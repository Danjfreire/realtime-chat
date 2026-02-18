import { OpenRouter } from "@openrouter/sdk";
import { getCharacter, type CharacterId } from "./characters";
import { type Emotion, isValidEmotion, EMOTIONS } from "./emotions";
import { createSentenceBuffer } from "./sentence-buffer";
import { parse } from "partial-json";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface StreamingCallbacks {
  onEmotion: (emotion: Emotion) => void;
  onTextChunk: (text: string) => void;
  onSentence: (sentence: string, isLast: boolean) => void;
  onComplete: (fullText: string) => void;
  onError: (error: string) => void;
}

const structuredOutputSchema = {
  type: "object" as const,
  properties: {
    text: { type: "string" as const },
    emotion: { type: "string" as const, enum: EMOTIONS },
  },
  required: ["text", "emotion"],
};

const messageHistoryMap: Map<string, ChatMessage[]> = new Map();

export function getMessageHistory(characterId: CharacterId): ChatMessage[] {
  if (!messageHistoryMap.has(characterId)) {
    const character = getCharacter(characterId);
    messageHistoryMap.set(characterId, [
      {
        role: "system",
        content: character.systemPrompt,
      },
    ]);
  }
  return messageHistoryMap.get(characterId)!;
}

export function resetChat(characterId?: CharacterId): void {
  if (characterId) {
    messageHistoryMap.delete(characterId);
  } else {
    messageHistoryMap.clear();
  }
}

function extractEmotionFromPartialJson(jsonText: string): Emotion | null {
  try {
    const parsed = parse(jsonText);
    if (parsed && typeof parsed === "object" && "emotion" in parsed) {
      const emotion = parsed.emotion;
      if (typeof emotion === "string" && isValidEmotion(emotion)) {
        return emotion;
      }
    }
  } catch {
  }
  return null;
}

function extractTextFromPartialJson(jsonText: string): string | null {
  try {
    const parsed = parse(jsonText);
    if (parsed && typeof parsed === "object" && "text" in parsed) {
      const text = parsed.text;
      if (typeof text === "string") {
        return text;
      }
    }
  } catch {
    // Fallback: try regex extraction for incomplete JSON
    const match = jsonText.match(/"text"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
    if (match && match[1]) {
      return match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
  }
  return null;
}

export async function streamChat(
  message: string,
  characterId: CharacterId,
  callbacks: StreamingCallbacks
): Promise<void> {
  const messageHistory = getMessageHistory(characterId);
  messageHistory.push({ role: "user", content: message });

  let fullText = "";
  let foundEmotion = false;
  let lastParsedText = "";

  const sentenceBuffer = createSentenceBuffer((sentence, isLast) => {
    callbacks.onSentence(sentence, isLast);
  });

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY ?? ""}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Realtime Chat",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: messageHistory,
        stream: true,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "chat_response",
            schema: structuredOutputSchema,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      callbacks.onError(`API error: ${response.status} - ${errorText}`);
      return;
    }

    if (!response.body) {
      callbacks.onError("No response body");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") {
          sentenceBuffer.finalize();
          const finalText = extractTextFromPartialJson(fullText) || fullText;
          
          if (!foundEmotion) {
            const emotion = extractEmotionFromPartialJson(fullText);
            if (emotion) {
              foundEmotion = true;
              callbacks.onEmotion(emotion);
            }
          }
          
          messageHistory.push({ role: "assistant", content: finalText });
          callbacks.onComplete(finalText);
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content ?? "";

          if (content) {
            fullText += content;
            callbacks.onTextChunk(content);

            const parsedText = extractTextFromPartialJson(fullText);
            
            if (parsedText && parsedText !== lastParsedText) {
              const newContent = parsedText.slice(lastParsedText.length);
              if (newContent) {
                sentenceBuffer.feed(newContent, false);
              }
              lastParsedText = parsedText;
            }

            if (!foundEmotion) {
              const emotion = extractEmotionFromPartialJson(fullText);
              if (emotion) {
                foundEmotion = true;
                callbacks.onEmotion(emotion);
              }
            }
          }
        } catch {
        }
      }
    }

    sentenceBuffer.finalize();
    const finalText = extractTextFromPartialJson(fullText) || fullText;
    
    if (!foundEmotion) {
      const emotion = extractEmotionFromPartialJson(fullText);
      if (emotion) {
        foundEmotion = true;
        callbacks.onEmotion(emotion);
      }
    }
    
    messageHistory.push({ role: "assistant", content: finalText });
    callbacks.onComplete(finalText);
  } catch (error) {
    callbacks.onError(error instanceof Error ? error.message : "Unknown error");
  }
}

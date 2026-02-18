import { OpenRouter } from "@openrouter/sdk";
import { getCharacter, getDefaultCharacter, type CharacterId } from "./characters";
import { type Emotion, isValidEmotion, EMOTIONS } from "./emotions";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  message: string;
  characterId?: CharacterId;
}

export interface ChatResponse {
  response: string;
  emotion: Emotion;
  done: boolean;
}

const structuredOutputSchema = {
  type: "object" as const,
  properties: {
    emotion: { type: "string" as const, enum: EMOTIONS },
    text: { type: "string" as const },
  },
  required: ["emotion", "text"],
};

const messageHistoryMap: Map<string, ChatMessage[]> = new Map();

function getMessageHistory(characterId: CharacterId): ChatMessage[] {
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

function clearMessageHistory(characterId: CharacterId): void {
  messageHistoryMap.delete(characterId);
}

export async function chat(request: ChatRequest): Promise<ChatResponse> {
  const characterId = request.characterId ?? getDefaultCharacter().id;
  const messageHistory = getMessageHistory(characterId);

  messageHistory.push({ role: "user", content: request.message });

  const result = await openrouter.callModel({
    model: "google/gemini-2.5-flash-lite",
    input: messageHistory,
    text: {
      format: {
        type: "json_schema",
        name: "chat_response",
        schema: structuredOutputSchema,
      },
    },
  });

  const rawText = await result.getText();
  
  let parsed: { text: string; emotion: string };
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = { text: rawText, emotion: "neutral" };
  }

  const emotion: Emotion = isValidEmotion(parsed.emotion) ? parsed.emotion : "neutral";

  messageHistory.push({ role: "assistant", content: parsed.text });

  return {
    response: parsed.text,
    emotion,
    done: true,
  };
}

export function resetChat(characterId?: CharacterId): void {
  if (characterId) {
    clearMessageHistory(characterId);
  } else {
    messageHistoryMap.clear();
  }
}

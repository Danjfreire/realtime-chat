import { generateSpeech } from "./tts";
import { TTSQueue } from "./tts-queue";
import { serializeMessage, deserializeClientMessage, type ServerMessage } from "./protocol";
import { streamChat, resetChat } from "./chat-stream";
import {
  createClientState,
  getClientState,
  removeClientState,
  setClientCharacter,
  abortClientStream,
  markChatStarted,
  resetChatState,
  incrementMessageCount,
  setIsEnding,
  getMessageCount,
  getIsEnding,
} from "./client-state";
import { initiateChat } from "./chat-init";
import { getCharacter } from "./characters";
import type { CharacterId } from "./characters";
import {
  WRAP_UP_THRESHOLD,
  GOODBYE_THRESHOLD,
  WRAP_UP_PROMPT,
  GOODBYE_PROMPT,
} from "./chat-config";

const server = Bun.serve({
  routes: {
    "/api/status": new Response("OK"),
  },

  websocket: {
    open(ws) {
      const clientId = crypto.randomUUID();
      (ws as any).clientId = clientId;
      createClientState(clientId);
      console.log(`WebSocket opened: ${clientId}`);
    },

    async message(ws, message) {
      const clientId = (ws as any).clientId;
      const state = getClientState(clientId);
      if (!state) return;

      let text: string;
      if (typeof message === "string") {
        text = message;
      } else {
        text = new TextDecoder().decode(message);
      }

      const clientMsg = deserializeClientMessage(text);
      if (!clientMsg) {
        ws.send(serializeMessage({ type: "error", message: "Invalid message format" }));
        return;
      }

      if (clientMsg.type === "switch-character") {
        setClientCharacter(clientId, clientMsg.characterId);
        resetChatState(clientId);
        resetChat(clientMsg.characterId);
        const character = getCharacter(clientMsg.characterId);
        ws.send(serializeMessage({ type: "emotion", emotion: "neutral" }));
        console.log(`Client ${clientId} switched to character: ${character.name}`);
        return;
      }

      if (clientMsg.type === "start-chat") {
        if (state.chatStarted) {
          ws.send(serializeMessage({ type: "error", message: "Chat already started" }));
          return;
        }

        abortClientStream(clientId);
        resetChatState(clientId); // Reset message count and ending state
        markChatStarted(clientId);
        setClientCharacter(clientId, clientMsg.characterId);
        resetChat(clientMsg.characterId);
        
        ws.send(serializeMessage({ type: "thinking" }));

        let sentenceIndex = 0;

        const ttsQueue = new TTSQueue({
          onAudioChunk: (chunk) => {
            ws.sendBinary(chunk);
          },
          onSentenceEnd: (idx) => {
            ws.send(serializeMessage({ type: "audio-end", sentenceIndex: idx }));
          },
          onQueueEmpty: () => {
            // All sentences processed
          },
          onError: (error) => {
            ws.send(serializeMessage({ type: "error", message: error }));
          },
        });

        try {
          await initiateChat(clientMsg.characterId, {
            onEmotion(emotion) {
              ws.send(serializeMessage({ type: "emotion", emotion }));
            },
            onSentence(sentence, isLast) {
              ttsQueue.enqueue(sentence, sentenceIndex);
              sentenceIndex++;
            },
            onComplete(fullText) {
              ttsQueue.complete();
              ws.send(serializeMessage({ type: "response-end", fullText }));
              ws.send(serializeMessage({ type: "chat-started" }));
              console.log(`Chat started for client ${clientId} with topic`);
            },
            onError(error) {
              ttsQueue.abort();
              ws.send(serializeMessage({ type: "error", message: error }));
              console.error(`Chat initiation error for ${clientId}: ${error}`);
            },
          });
        } catch (error) {
          ttsQueue.abort();
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          ws.send(serializeMessage({ type: "error", message: errorMsg }));
          console.error(`Start chat error for ${clientId}: ${error}`);
        }
        return;
      }

      if (clientMsg.type === "chat") {
        // Check if chat has already ended
        if (getIsEnding(clientId)) {
          ws.send(serializeMessage({ type: "error", message: "Chat has ended. Please start a new chat." }));
          return;
        }

        abortClientStream(clientId);

        // Increment message count and determine guidance prompt
        const messageCount = incrementMessageCount(clientId);
        let guidancePrompt: string | undefined;

        if (messageCount >= GOODBYE_THRESHOLD) {
          // This is the final message - set ending flag and use goodbye prompt
          setIsEnding(clientId, true);
          guidancePrompt = GOODBYE_PROMPT;
        } else if (messageCount >= WRAP_UP_THRESHOLD) {
          // Start wrapping up the conversation
          guidancePrompt = WRAP_UP_PROMPT;
        }

        const character = getCharacter(state.characterId);
        ws.send(serializeMessage({ type: "thinking" }));

        let sentenceIndex = 0;
        const isEndingChat = getIsEnding(clientId);

        const ttsQueue = new TTSQueue({
          onAudioChunk: (chunk) => {
            ws.sendBinary(chunk);
          },
          onSentenceEnd: (idx) => {
            ws.send(serializeMessage({ type: "audio-end", sentenceIndex: idx }));
          },
          onQueueEmpty: () => {
            // All sentences processed - if this was the ending message, send chat-ended
            if (isEndingChat) {
              ws.send(serializeMessage({ type: "chat-ended" }));
              console.log(`Chat ended for client ${clientId} after ${messageCount} messages`);
            }
          },
          onError: (error) => {
            ws.send(serializeMessage({ type: "error", message: error }));
          },
        });

        try {
          await streamChat(clientMsg.message, state.characterId, {
            onEmotion(emotion) {
              ws.send(serializeMessage({ type: "emotion", emotion }));
            },
            onTextChunk(_text) {
            },
            onSentence(sentence, isLast) {
              ttsQueue.enqueue(sentence, sentenceIndex);
              sentenceIndex++;
            },
            onComplete(fullText) {
              ttsQueue.complete();
              ws.send(serializeMessage({ type: "response-end", fullText }));
            },
            onError(error) {
              ttsQueue.abort();
              ws.send(serializeMessage({ type: "error", message: error }));
              console.error(`Chat error for ${clientId}: ${error}`);
            },
          }, { guidancePrompt });
        } catch (error) {
          ttsQueue.abort();
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          ws.send(serializeMessage({ type: "error", message: errorMsg }));
          console.error(`Stream error for ${clientId}: ${error}`);
        }
      }
    },

    close(ws) {
      const clientId = (ws as any).clientId;
      if (clientId) {
        removeClientState(clientId);
        console.log(`WebSocket closed: ${clientId}`);
      }
    },
  },

  fetch(req: Request): Response | undefined {
    const url = new URL(req.url);

    if (url.pathname === "/ws" && req.headers.get("upgrade") === "websocket") {
      server.upgrade(req);
      return undefined;
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at ${server.url}`);
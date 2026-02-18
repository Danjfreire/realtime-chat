import { generateSpeech } from "./tts";
import { TTSQueue } from "./tts-queue";
import { serializeMessage, deserializeClientMessage, type ServerMessage } from "./protocol";
import { streamChat } from "./chat-stream";
import {
  createClientState,
  getClientState,
  removeClientState,
  setClientCharacter,
  abortClientStream,
} from "./client-state";
import { getCharacter } from "./characters";
import type { CharacterId } from "./characters";

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
        const character = getCharacter(clientMsg.characterId);
        ws.send(serializeMessage({ type: "emotion", emotion: "neutral" }));
        console.log(`Client ${clientId} switched to character: ${character.name}`);
        return;
      }

      if (clientMsg.type === "chat") {
        abortClientStream(clientId);

        const character = getCharacter(state.characterId);
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
          });
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
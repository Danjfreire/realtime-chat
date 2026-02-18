import { chat, type ChatRequest } from "./chat";
import { generateSpeech } from "./tts";

const server = Bun.serve({
  routes: {
    "/api/status": new Response("OK"),
    "/api/chat": async (req) => {
      if (req.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }

      if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }

      try {
        const body = (await req.json()) as ChatRequest;
        const result = await chat(body);
        return Response.json(result, {
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (error) {
        console.error("Chat error:", error);
        return Response.json(
          { error: "Failed to process chat request" },
          { status: 500 }
        );
      }
    },
  },

  websocket: {
    open(ws) {
      console.log("WebSocket opened");
    },
    async message(ws, message) {
      let text: string;
      if (typeof message === "string") {
        text = message;
      } else {
        text = new TextDecoder().decode(message);
      }

      console.log("TTS request:", text);

      for await (const chunk of generateSpeech(text)) {
        ws.sendBinary(chunk);
      }
      ws.close();
    },
    close(ws) {
      console.log("WebSocket closed");
    },
  },

  fetch(req: Request): Response | undefined {
    const url = new URL(req.url);

    if (url.pathname === "/ws/audio" && req.headers.get("upgrade") === "websocket") {
      server.upgrade(req);
      return undefined;
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at ${server.url}`);
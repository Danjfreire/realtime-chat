import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  response: string;
  done: boolean;
}

const messageHistory: ChatMessage[] = [
  {
    role: "system",
    content:
      "You are a helpful AI assistant. Keep your responses concise and conversational. Answer in the same language as the user's message. Prefer to use short answers. Do not include any other text than the answer. Avoid using emojis and markdown formatting.",
  },
];

export async function chat(request: ChatRequest): Promise<ChatResponse> {
  messageHistory.push({ role: "user", content: request.message });

  const result = await openrouter.callModel({
    model: "deepseek/deepseek-chat",
    input: messageHistory,
  });

  const text = await result.getText();
  
  messageHistory.push({ role: "assistant", content: text });

  return {
    response: text,
    done: true,
  };
}

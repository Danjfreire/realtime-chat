import { ElevenLabsClient } from "elevenlabs";
import { Readable } from "stream";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY ?? "",
});

export interface TTSRequest {
  text: string;
}

export async function* generateSpeech(
  text: string
): AsyncGenerator<Uint8Array, void, unknown> {
  const audio = await elevenlabs.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
    text,
    model_id: "eleven_flash_v2_5",
  });

  const stream = audio as unknown as Readable;

  for await (const chunk of stream) {
    yield chunk;
  }
}

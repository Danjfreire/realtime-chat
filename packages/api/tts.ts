import { ElevenLabsClient, ElevenLabsError } from "elevenlabs";
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
  try {
  const audio = await elevenlabs.textToSpeech.convert("Xb7hH8MSUJpSbSDYk0k2", {
    text,
    model_id: "eleven_flash_v2_5",
  });

  const stream = audio as unknown as Readable;

  for await (const chunk of stream) {
    yield chunk;
  }
    
  } catch (error) {
    if (error instanceof ElevenLabsError) {

    console.log(`Status code: ${error.statusCode}`);

    // Access the error body

    const detail = (error.body as any)?.detail;

    if (detail) {

      console.log(`Error type: ${detail.type}`);

      console.log(`Error code: ${detail.code}`);

      console.log(`Message: ${detail.message}`);

      console.log(`Request ID: ${detail.request_id}`);

      // Handle specific error types

      if (detail.type === 'rate_limit_error') {

        console.log('Rate limited - implement exponential backoff');

      } else if (detail.type === 'authentication_error') {

        console.log('Check your API key');

      }

    }
  }
  }
}

import { generateSpeech } from "./tts";

export interface TTSQueueCallbacks {
  onAudioChunk: (chunk: Uint8Array) => void;
  onSentenceEnd: (sentenceIndex: number) => void;
  onQueueEmpty: () => void;
  onError: (error: string) => void;
}

interface QueuedSentence {
  text: string;
  sentenceIndex: number;
}

export class TTSQueue {
  private queue: QueuedSentence[] = [];
  private isProcessing = false;
  private isComplete = false;
  private aborted = false;

  constructor(private callbacks: TTSQueueCallbacks) {}

  enqueue(text: string, sentenceIndex: number): void {
    if (this.aborted) return;

    this.queue.push({ text, sentenceIndex });
    this.processNext();
  }

  complete(): void {
    this.isComplete = true;
    if (!this.isProcessing && this.queue.length === 0) {
      this.callbacks.onQueueEmpty();
    }
  }

  abort(): void {
    this.aborted = true;
    this.queue = [];
    this.isComplete = false;
    this.isProcessing = false;
  }

  isIdle(): boolean {
    return !this.isProcessing && this.queue.length === 0;
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.aborted) return;

    const sentence = this.queue.shift();
    if (!sentence) {
      if (this.isComplete) {
        this.callbacks.onQueueEmpty();
      }
      return;
    }

    this.isProcessing = true;

    console.log("Processing sentence:", sentence.text);
    try {
      for await (const chunk of generateSpeech(sentence.text)) {
        if (this.aborted) return;
        this.callbacks.onAudioChunk(chunk);
      }

      this.callbacks.onSentenceEnd(sentence.sentenceIndex);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown TTS error";
      this.callbacks.onError(errorMessage);
    } finally {
      this.isProcessing = false;
      this.processNext();
    }
  }
}

import { SEPARATOR } from "./elevenlabs-guide";

export interface SentenceChunk {
  text: string;
  hasBreak: boolean;
  breakTime?: string;
}

export interface SentenceEmitter {
  (text: string): void;
  getFullText(): string;
}

export class SentenceBuffer {
  private buffer: string = "";
  private emittedLength: number = 0;
  private sentenceIndex: number = 0;
  private isComplete: boolean = false;

  private static readonly SEPARATOR_REGEX = new RegExp(
    `\\s*${SEPARATOR}\\s*`,
    "g"
  );

  private static readonly BREAK_REGEX = /<break\s+time="(\d+(?:\.\d+)?)s"\s*\/>/g;

  constructor(
    private onSentence: (sentence: string, isLast: boolean) => void
  ) {}

  feed(text: string, isComplete: boolean = false): void {
    this.buffer += text;
    this.isComplete = isComplete;
    this.processBuffer();
  }

  private findSeparatorIndex(text: string): number {
    const index = text.indexOf(SEPARATOR);
    return index;
  }

  private parseChunk(text: string): SentenceChunk {
    const trimmed = text.trim();
    const breakMatch = trimmed.match(SentenceBuffer.BREAK_REGEX);
    return {
      text: trimmed,
      hasBreak: breakMatch !== null,
      breakTime: breakMatch?.[1],
    };
  }

  private processBuffer(): void {
    while (true) {
      const unprocessedBuffer = this.buffer.slice(this.emittedLength);
      const separatorIndex = this.findSeparatorIndex(unprocessedBuffer);

      if (separatorIndex === -1) {
        break;
      }

      const textBeforeSeparator = unprocessedBuffer.slice(0, separatorIndex);
      const chunk = this.parseChunk(textBeforeSeparator);

      if (chunk.text.length > 0) {
        this.onSentence(chunk.text, false);
        this.sentenceIndex++;
        console.log("Emitted sentence:", chunk.text);
        console.log("--------------------------------");
      }

      this.emittedLength += separatorIndex + SEPARATOR.length;
    }

    if (this.isComplete) {
      const remaining = this.buffer.slice(this.emittedLength).trim();
      if (remaining.length > 0) {
        const chunk = this.parseChunk(remaining);
        this.onSentence(chunk.text, true);
        this.sentenceIndex++;
      }
      this.emittedLength = this.buffer.length;
    }
  }

  finalize(): void {
    this.isComplete = true;
    this.processBuffer();
  }

  reset(): void {
    this.buffer = "";
    this.emittedLength = 0;
    this.sentenceIndex = 0;
    this.isComplete = false;
  }

  getBufferedText(): string {
    return this.buffer.slice(this.emittedLength);
  }

  getFullText(): string {
    return this.buffer;
  }
}

export function createSentenceBuffer(
  onSentence: (sentence: string, isLast: boolean) => void
) {
  const buffer = new SentenceBuffer(onSentence);

  return {
    feed(text: string, isComplete: boolean = false) {
      buffer.feed(text, isComplete);
    },
    finalize() {
      buffer.finalize();
    },
    reset() {
      buffer.reset();
    },
    getBufferedText(): string {
      return buffer.getBufferedText();
    },
    getFullText(): string {
      return buffer.getFullText();
    },
  };
}

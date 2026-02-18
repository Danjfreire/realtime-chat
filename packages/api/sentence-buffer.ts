export interface SentenceEmitter {
  (text: string): void;
  getFullText(): string;
}

export class SentenceBuffer {
  private buffer: string = "";
  private emittedLength: number = 0;
  private sentenceIndex: number = 0;
  private isComplete: boolean = false;

  private static readonly SENTENCE_END_REGEX = /[.!?]+[\s]*|[\n]+/g;

  constructor(
    private onSentence: (sentence: string, isLast: boolean) => void
  ) {}

  feed(text: string, isComplete: boolean = false): void {
    this.buffer += text;
    this.isComplete = isComplete;
    this.processBuffer();
  }

  private processBuffer(): void {
    const regex = new RegExp(SentenceBuffer.SENTENCE_END_REGEX.source, "g");

    let match: RegExpExecArray | null;
    while ((match = regex.exec(this.buffer)) !== null) {
      const endIndex = match.index + match[0].length;
      const sentence = this.buffer.slice(this.emittedLength, endIndex).trim();

      if (sentence.length > 0) {
        this.onSentence(sentence, false);
        this.sentenceIndex++;
      }

      this.emittedLength = endIndex;
    }

    if (this.isComplete && this.emittedLength < this.buffer.length) {
      const remaining = this.buffer.slice(this.emittedLength).trim();
      if (remaining.length > 0) {
        this.onSentence(remaining, true);
        this.sentenceIndex++;
        this.emittedLength = this.buffer.length;
      }
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

export function createSentenceBuffer(onSentence: (sentence: string, isLast: boolean) => void) {
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
  };
}

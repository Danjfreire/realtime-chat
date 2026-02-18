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
    const unprocessedBuffer = this.buffer.slice(this.emittedLength);
    while ((match = regex.exec(unprocessedBuffer)) !== null) {
      const endIndex = match.index + match[0].length;
      const sentence = unprocessedBuffer.slice(0, endIndex).trim();

      console.log("EmmitedLength:", this.emittedLength);
      console.log("EndIndex:", endIndex);


      if (sentence.length > 0) {
        this.onSentence(sentence, false);
        console.log("Emitting sentence:", sentence);
        this.sentenceIndex++;
      }

      this.emittedLength += endIndex;
      console.log("New EmittedLength:", this.emittedLength);
      console.log("--------------------------------");
    }

    if (this.isComplete && this.emittedLength < this.buffer.length) {
      const remaining = this.buffer.slice(this.emittedLength).trim();
      if (remaining.length > 0) {
        console.log("Emitting final sentence:", remaining);
        this.onSentence(remaining, true);
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

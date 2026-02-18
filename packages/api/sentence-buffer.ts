export interface SentenceEmitter {
  (text: string): void;
  getFullText(): string;
}

export function createSentenceBuffer(onSentence: (sentence: string, isLast: boolean) => void) {
  let buffer = "";
  let sentenceIndex = 0;
  let isLast = false;

  const SENTENCE_END_REGEX = /[.!?]\s*$/;

  function flush() {
    if (buffer.length > 0) {
      onSentence(buffer.trim(), isLast);
      buffer = "";
      sentenceIndex++;
    }
  }

  return {
    feed(text: string, isComplete: boolean = false) {
      buffer += text;
      isLast = isComplete;

      while (buffer.length > 0) {
        const match = buffer.match(SENTENCE_END_REGEX);
        if (match) {
          const endIndex = match.index! + match[0].length;
          const sentence = buffer.slice(0, endIndex).trim();
          if (sentence.length > 0) {
            onSentence(sentence, false);
            sentenceIndex++;
          }
          buffer = buffer.slice(endIndex);
        } else {
          break;
        }
      }
      
      if (isComplete && buffer.length > 0) {
        flush();
      }
    },
    finalize() {
      isLast = true;
      flush();
    },
    reset() {
      buffer = "";
      sentenceIndex = 0;
    },
    getBufferedText(): string {
      return buffer;
    },
  };
}

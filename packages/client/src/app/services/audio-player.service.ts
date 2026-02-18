import { Injectable, signal } from '@angular/core';
import { WebSocketService } from './websocket.service';

interface AudioSentence {
  index: number;
  chunks: Uint8Array[];
  audioBuffer: AudioBuffer | null;
}

@Injectable({ providedIn: 'root' })
export class AudioPlayerService {
  private audioContext: AudioContext | null = null;
  private sentenceQueue: AudioSentence[] = [];
  private currentSentenceIndex = -1;
  private sourceNode: AudioBufferSourceNode | null = null;

  readonly isPlaying = signal(false);

  constructor(private wsService: WebSocketService) {
    this.setupListeners();
  }

  private setupListeners(): void {
    this.wsService.audioChunk$.subscribe((chunk) => {
      this.handleAudioChunk(chunk);
    });

    this.wsService.audioEnd$.subscribe((sentenceIndex) => {
      this.handleAudioEnd(sentenceIndex);
    });

    this.wsService.interrupt$.subscribe(() => {
      this.stop();
    });
  }

  private handleAudioChunk(chunk: Uint8Array): void {
    const lastSentence = this.sentenceQueue[this.sentenceQueue.length - 1];
    if (lastSentence && lastSentence.index === this.sentenceQueue.length - 1) {
      lastSentence.chunks.push(chunk);
    } else {
      this.sentenceQueue.push({
        index: this.sentenceQueue.length,
        chunks: [chunk],
        audioBuffer: null,
      });
    }

    this.tryPlayNextSentence();
  }

  private async handleAudioEnd(sentenceIndex: number): Promise<void> {
    const sentence = this.sentenceQueue.find((s) => s.index === sentenceIndex);
    if (!sentence) return;

    await this.decodeAudio(sentence);
    this.tryPlayNextSentence();
  }

  private async decodeAudio(sentence: AudioSentence): Promise<void> {
    if (sentence.chunks.length === 0) return;

    const totalLength = sentence.chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of sentence.chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    try {
      const arrayBuffer = combined.buffer;
      sentence.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (e) {
      console.error('Failed to decode audio:', e);
    }
  }

  private tryPlayNextSentence(): void {
    if (this.isPlaying()) return;

    const nextSentence = this.sentenceQueue.find(
      (s) => s.index === this.currentSentenceIndex + 1 && s.audioBuffer !== null
    );

    if (nextSentence) {
      this.playSentence(nextSentence);
    }
  }

  private playSentence(sentence: AudioSentence): void {
    if (!this.audioContext || !sentence.audioBuffer) return;

    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
    }

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = sentence.audioBuffer;
    this.sourceNode.connect(this.audioContext.destination);

    this.sourceNode.onended = () => {
      this.currentSentenceIndex = sentence.index;
      this.isPlaying.set(false);
      this.tryPlayNextSentence();
    };

    this.sourceNode.start(0);
    this.isPlaying.set(true);
  }

  stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch {
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    this.sentenceQueue = [];
    this.currentSentenceIndex = -1;
    this.isPlaying.set(false);
  }
}

import { Injectable, signal } from '@angular/core';
import { WebSocketService } from './websocket.service';

interface AudioSegment {
  chunks: Uint8Array[];
}

@Injectable({ providedIn: 'root' })
export class AudioPlayerService {
  private audioContext: AudioContext | null = null;
  private currentChunks: Uint8Array[] = [];
  private audioQueue: AudioSegment[] = [];
  private currentSource: AudioBufferSourceNode | null = null;
  private isPlaying = false;

  readonly isPlayingSignal = signal(false);

  constructor(private wsService: WebSocketService) {
    this.setupListeners();
  }

  private setupListeners(): void {
    this.wsService.audioChunk$.subscribe((chunk) => {
      this.currentChunks.push(chunk);
    });

    this.wsService.audioEnd$.subscribe(() => {
      // Small delay to ensure last chunk is received (race condition fix)
      setTimeout(() => {
        // Add completed segment to queue
        if (this.currentChunks.length > 0) {
          this.audioQueue.push({ chunks: [...this.currentChunks] });
          this.currentChunks = [];
        }
        this.playNext();
      }, 50);
    });

    this.wsService.interrupt$.subscribe(() => {
      this.stop();
    });
  }

  private async playNext(): Promise<void> {
    if (this.isPlaying) return;
    if (this.audioQueue.length === 0) return;

    this.isPlaying = true;
    this.isPlayingSignal.set(true);

    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    const segment = this.audioQueue.shift()!;

    try {
      const totalBytes = segment.chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of segment.chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      const arrayBuffer = combined.buffer.slice(0);
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = audioBuffer;
      this.currentSource.connect(this.audioContext.destination);

      this.currentSource.onended = () => {
        this.isPlaying = false;
        this.isPlayingSignal.set(false);
        // Play next segment after this one finishes
        this.playNext();
      };

      this.currentSource.start(0);
    } catch (e) {
      console.error('Failed to play audio:', e);
      this.isPlaying = false;
      this.isPlayingSignal.set(false);
      // Try next segment even if this one failed
      this.playNext();
    }
  }

  stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {}
      this.currentSource.disconnect();
      this.currentSource = null;
    }

    this.currentChunks = [];
    this.audioQueue = [];
    this.isPlaying = false;
    this.isPlayingSignal.set(false);
  }
}

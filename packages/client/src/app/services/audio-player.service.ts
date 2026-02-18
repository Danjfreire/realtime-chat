import { Injectable, signal } from '@angular/core';
import { WebSocketService } from './websocket.service';

@Injectable({ providedIn: 'root' })
export class AudioPlayerService {
  private audioContext: AudioContext | null = null;
  private currentChunks: Uint8Array[] = [];
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
      this.playCurrentAudio();
    });

    this.wsService.interrupt$.subscribe(() => {
      this.stop();
    });
  }

  private async playCurrentAudio(): Promise<void> {
    if (this.currentChunks.length === 0) return;
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.isPlayingSignal.set(true);

    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {}
      this.currentSource.disconnect();
    }

    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    try {
      const totalBytes = this.currentChunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of this.currentChunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      console.log('First bytes:', Array.from(combined.slice(0, 20)));
      console.log('Total bytes:', totalBytes);

      const arrayBuffer = combined.buffer.slice(0);
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      console.log('Decoded successfully, duration:', audioBuffer.duration);

      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = audioBuffer;
      this.currentSource.connect(this.audioContext.destination);

      this.currentSource.onended = () => {
        this.isPlaying = false;
        this.isPlayingSignal.set(false);
      };

      this.currentSource.start(0);
      this.currentChunks = [];
    } catch (e) {
      console.error('Failed to play audio:', e);
      this.isPlaying = false;
      this.isPlayingSignal.set(false);
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
    this.isPlaying = false;
    this.isPlayingSignal.set(false);
  }
}

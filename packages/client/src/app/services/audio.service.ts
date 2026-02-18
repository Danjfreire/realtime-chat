import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private ws: WebSocket | null = null;
  
  readonly isPlaying = signal(false);
  readonly isConnecting = signal(false);
  
  private audioChunks: Uint8Array[] = [];
  private audio: HTMLAudioElement | null = null;
  private audioUrl: string | null = null;

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    console.time("audio-generation");

    this.isConnecting.set(true);
    this.audioChunks = [];
    this.ws = new WebSocket('ws://localhost:3000/ws/audio');

    this.ws.onopen = () => {
      this.isConnecting.set(false);
    };

    this.ws.onmessage = (event) => {
      if (event.data instanceof Blob) {
        event.data.arrayBuffer().then((buffer) => {
          this.queueAudio(new Uint8Array(buffer));
        });
      } else if (event.data instanceof ArrayBuffer) {
        this.queueAudio(new Uint8Array(event.data));
      }
    };

    this.ws.onclose = () => {
      console.timeEnd("audio-generation");
      this.playCombinedAudio();
    };

    this.ws.onerror = () => {
      this.isPlaying.set(false);
    };
  }

  private queueAudio(chunk: Uint8Array): void {
    this.audioChunks.push(chunk);
  }

  private playCombinedAudio(): void {
    if (this.audioChunks.length === 0) {
      this.isPlaying.set(false);
      return;
    }

    const totalLength = this.audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of this.audioChunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }

    const blob = new Blob([combined], { type: 'audio/mpeg' });
    this.audioUrl = URL.createObjectURL(blob);
    
    this.audio = new Audio(this.audioUrl);
    this.audio.onplay = () => this.isPlaying.set(true);
    this.audio.onended = () => {
      this.isPlaying.set(false);
      this.audioChunks = [];
    };
    this.audio.onerror = () => {
      console.error('Audio playback error');
      this.isPlaying.set(false);
    };
    
    this.audio.play().catch(err => console.error('Play error:', err));
  }

  sendText(text: string): void {
    this.audioChunks = [];
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(text);
    } else {
      this.connect();
      
      const checkAndSend = () => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(text);
        } else if (this.ws?.readyState !== WebSocket.CONNECTING) {
          setTimeout(checkAndSend, 100);
        }
      };
      
      this.ws?.addEventListener('open', checkAndSend, { once: true });
    }
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.audioChunks = [];
    this.audio?.pause();
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }
    this.isPlaying.set(false);
  }
}

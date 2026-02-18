import { Injectable, signal, computed } from '@angular/core';
import { Subject } from 'rxjs';

export type Emotion =
  | 'happy'
  | 'sad'
  | 'neutral'
  | 'horny'
  | 'angry'
  | 'excited'
  | 'lonely'
  | 'flirty'
  | 'confused'
  | 'worried'
  | 'surprised'
  | 'bored';

export const EMOTION_EMOJI: Record<Emotion, string> = {
  happy: '😊',
  sad: '😢',
  neutral: '😐',
  horny: '😏',
  angry: '😠',
  excited: '🤩',
  lonely: '🥺',
  flirty: '😘',
  confused: '😕',
  worried: '😟',
  surprised: '😲',
  bored: '😴',
};

export type CharacterId = 'cheerful' | 'sarcastic' | 'gentle';

export interface Character {
  id: CharacterId;
  name: string;
  emoji: string;
}

export const CHARACTERS: Character[] = [
  { id: 'cheerful', name: 'Cheerful Buddy', emoji: '😊' },
  { id: 'sarcastic', name: 'Sarcastic Wit', emoji: '😏' },
  { id: 'gentle', name: 'Gentle Listener', emoji: '🥺' },
];

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

interface ServerMessage {
  type: 'emotion' | 'audio-chunk' | 'audio-end' | 'response-end' | 'error' | 'interrupt' | 'thinking' | 'chat-started' | 'chat-ended';
  [key: string]: unknown;
}

interface ClientMessage {
  type: 'chat' | 'switch-character' | 'start-chat';
  message?: string;
  characterId?: CharacterId;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private ws: WebSocket | null = null;
  private readonly wsUrl = 'ws://localhost:3000/ws';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  private readonly _connectionStatus = signal<ConnectionStatus>('disconnected');
  readonly connectionStatus = this._connectionStatus.asReadonly();

  private readonly _currentEmotion = signal<Emotion>('neutral');
  readonly currentEmotion = this._currentEmotion.asReadonly();

  private readonly _isThinking = signal(false);
  readonly isThinking = this._isThinking.asReadonly();

  readonly isConnected = computed(() => this._connectionStatus() === 'connected');

  readonly audioChunk$ = new Subject<Uint8Array>();
  readonly audioEnd$ = new Subject<number>();
  readonly responseEnd$ = new Subject<string>();
  readonly error$ = new Subject<string>();
  readonly interrupt$ = new Subject<void>();
  readonly chatStarted$ = new Subject<void>();
  readonly chatEnded$ = new Subject<void>();

  private readonly _chatStarted = signal(false);
  readonly chatStarted = this._chatStarted.asReadonly();

  private readonly _chatEnded = signal(false);
  readonly chatEnded = this._chatEnded.asReadonly();

  constructor() {
    this.connect();
  }

  private connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this._connectionStatus.set('connecting');
    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = () => {
      this._connectionStatus.set('connected');
      this.reconnectAttempts = 0;
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event);
    };

    this.ws.onclose = () => {
      this._connectionStatus.set('disconnected');
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      console.error('WebSocket error');
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    const delay = Math.pow(2, this.reconnectAttempts) * 1000;
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private handleMessage(event: MessageEvent): void {
    if (event.data instanceof Blob) {
      event.data.arrayBuffer().then((buffer) => {
        this.audioChunk$.next(new Uint8Array(buffer));
      });
      return;
    }

    if (event.data instanceof ArrayBuffer) {
      this.audioChunk$.next(new Uint8Array(event.data));
      return;
    }

    try {
      const msg = JSON.parse(event.data) as ServerMessage;

      switch (msg.type) {
        case 'emotion':
          this._currentEmotion.set(msg['emotion'] as Emotion);
          break;
        case 'audio-end':
          this.audioEnd$.next(msg['sentenceIndex'] as number);
          break;
        case 'response-end':
          this.responseEnd$.next(msg['fullText'] as string);
          this._isThinking.set(false);
          break;
        case 'error':
          this.error$.next(msg['message'] as string);
          this._isThinking.set(false);
          break;
        case 'interrupt':
          this.interrupt$.next();
          break;
        case 'thinking':
          this._isThinking.set(true);
          break;
        case 'chat-started':
          this._chatStarted.set(true);
          this.chatStarted$.next();
          break;
        case 'chat-ended':
          this._chatEnded.set(true);
          this.chatEnded$.next();
          break;
      }
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  }

  sendMessage(text: string, characterId: CharacterId): void {
    const msg: ClientMessage = { type: 'chat', message: text, characterId };
    this.send(msg);
  }

  switchCharacter(characterId: CharacterId): void {
    const msg: ClientMessage = { type: 'switch-character', characterId };
    this.send(msg);
    this._chatStarted.set(false);
    this._chatEnded.set(false);
  }

  startChat(characterId: CharacterId): void {
    const msg: ClientMessage = { type: 'start-chat', characterId };
    this._chatEnded.set(false);
    this.send(msg);
  }

  restartChat(characterId: CharacterId): void {
    this._chatStarted.set(false);
    this._chatEnded.set(false);
    this.startChat(characterId);
  }

  private send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      this.connect();
      const checkAndSend = () => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(msg));
        } else if (this.ws?.readyState !== WebSocket.CONNECTING) {
          setTimeout(checkAndSend, 100);
        }
      };
      this.ws?.addEventListener('open', checkAndSend, { once: true });
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.ws?.close();
    this.ws = null;
    this._connectionStatus.set('disconnected');
  }
}

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  emotion?: Emotion;
}

export interface ChatRequest {
  message: string;
  characterId?: CharacterId;
}

export interface ChatResponse {
  response: string;
  emotion: Emotion;
  done: boolean;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/chat';

  readonly currentEmotion = signal<Emotion>('neutral');

  sendMessage(message: string, characterId?: CharacterId): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.apiUrl, { message, characterId } as ChatRequest);
  }
}

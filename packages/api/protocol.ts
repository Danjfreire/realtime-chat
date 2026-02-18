import type { Emotion } from './emotions';
import type { CharacterId } from './characters';

export type { Emotion } from './emotions';
export type { CharacterId } from './characters';

export type ClientMessage =
  | { type: 'chat'; message: string; characterId: CharacterId }
  | { type: 'switch-character'; characterId: CharacterId };

export type ServerMessage =
  | { type: 'emotion'; emotion: Emotion }
  | { type: 'audio-chunk'; data: number[] }
  | { type: 'audio-end'; sentenceIndex: number }
  | { type: 'response-end'; fullText: string }
  | { type: 'error'; message: string }
  | { type: 'interrupt' }
  | { type: 'thinking' };

export function serializeMessage(msg: ServerMessage): string {
  return JSON.stringify(msg);
}

export function deserializeClientMessage(data: string): ClientMessage | null {
  try {
    const parsed = JSON.parse(data);
    if (
      parsed.type === 'chat' ||
      parsed.type === 'switch-character'
    ) {
      return parsed as ClientMessage;
    }
    return null;
  } catch {
    return null;
  }
}

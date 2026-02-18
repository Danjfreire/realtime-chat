import type { CharacterId } from "./characters";
import type { Emotion } from "./emotions";
import type { ClientMessage, ServerMessage } from "./protocol";

export interface ClientState {
  id: string;
  characterId: CharacterId;
  messageHistory: { role: "user" | "assistant" | "system"; content: string }[];
  abortController: AbortController | null;
}

const clients = new Map<string, ClientState>();

export function createClientState(id: string): ClientState {
  const state: ClientState = {
    id,
    characterId: "cheerful",
    messageHistory: [],
    abortController: null,
  };
  clients.set(id, state);
  return state;
}

export function getClientState(id: string): ClientState | undefined {
  return clients.get(id);
}

export function removeClientState(id: string): void {
  const state = clients.get(id);
  if (state?.abortController) {
    state.abortController.abort();
  }
  clients.delete(id);
}

export function setClientCharacter(id: string, characterId: CharacterId): void {
  const state = clients.get(id);
  if (state) {
    state.characterId = characterId;
    state.messageHistory = [];
  }
}

export function abortClientStream(id: string): void {
  const state = clients.get(id);
  if (state?.abortController) {
    state.abortController.abort();
    state.abortController = null;
  }
}

import { streamChat } from "./chat-stream";
import { getCharacter, type CharacterId } from "./characters";
import { getRandomTopic, type ConversationTopic } from "./conversation-starters";
import type { Emotion } from "./emotions";

export interface InitChatCallbacks {
  onEmotion: (emotion: Emotion) => void;
  onSentence: (sentence: string, isLast: boolean) => void;
  onComplete: (fullText: string) => void;
  onError: (error: string) => void;
}

export async function initiateChat(
  characterId: CharacterId,
  callbacks: InitChatCallbacks
): Promise<{ topic: ConversationTopic }> {
  const topic = getRandomTopic();
  const character = getCharacter(characterId);
  
  const greetingMessage = `TOPIC: ${topic}\n\nSay hi to the user with a very short greeting (just "Hi!" or "Hey there!"). Then you should bring up the topic of ${topic} naturally in your next response and ask them a simple question about it.`;
  
  return new Promise((resolve, reject) => {
    let completed = false;
    
    const wrappedCallbacks: InitChatCallbacks = {
      onEmotion: callbacks.onEmotion,
      onSentence: callbacks.onSentence,
      onComplete: (fullText) => {
        if (!completed) {
          completed = true;
          callbacks.onComplete(fullText);
          resolve({ topic });
        }
      },
      onError: (error) => {
        if (!completed) {
          completed = true;
          callbacks.onError(error);
          reject(new Error(error));
        }
      },
    };
    
    streamChat(greetingMessage, characterId, {
      onEmotion: callbacks.onEmotion,
      onTextChunk: () => {},
      onSentence: callbacks.onSentence,
      onComplete: wrappedCallbacks.onComplete,
      onError: wrappedCallbacks.onError,
    });
  });
}

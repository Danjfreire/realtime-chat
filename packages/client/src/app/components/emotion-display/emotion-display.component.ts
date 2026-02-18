import { Component, inject } from '@angular/core';
import { ChatService, EMOTION_EMOJI, type Emotion } from '../../services/chat.service';

@Component({
  selector: 'app-emotion-display',
  standalone: true,
  template: `
    <div class="text-center">
      <div class="text-9xl mb-4 transition-all duration-300 transform scale-100">
        {{ currentEmoji() }}
      </div>
      <div class="text-xl text-gray-600 capitalize">
        {{ currentEmotion() }}
      </div>
    </div>
  `,
})
export class EmotionDisplayComponent {
  private readonly chatService = inject(ChatService);

  readonly currentEmotion = this.chatService.currentEmotion;
  
  currentEmoji(): string {
    const emotion: Emotion = this.currentEmotion();
    return EMOTION_EMOJI[emotion] ?? '😐';
  }
}

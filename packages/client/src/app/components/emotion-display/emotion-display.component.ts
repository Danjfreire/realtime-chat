import { Component, inject } from '@angular/core';
import { WebSocketService, EMOTION_EMOJI, type Emotion } from '../../services/websocket.service';
import { AudioPlayerService } from '../../services/audio-player.service';

@Component({
  selector: 'app-emotion-display',
  standalone: true,
  template: `
    <div class="text-center">
      <div 
        class="text-[12rem] mb-4 transition-all duration-300 transform"
        [class.scale-110]="isThinking()"
        [class.animate-pulse]="isThinking()"
      >
        {{ currentEmoji() }}
      </div>
      <div class="text-2xl text-gray-600 capitalize">
        {{ currentEmotion() }}
      </div>
    </div>
  `,
})
export class EmotionDisplayComponent {
  private readonly wsService = inject(WebSocketService);
  private readonly audioPlayer = inject(AudioPlayerService);

  readonly currentEmotion = this.wsService.currentEmotion;
  readonly isThinking = this.wsService.isThinking;

  currentEmoji(): string {
    const emotion: Emotion = this.currentEmotion();
    return EMOTION_EMOJI[emotion] ?? '😐';
  }
}

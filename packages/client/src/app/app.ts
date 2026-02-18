import { Component, signal, inject, ViewChild, ElementRef, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmotionDisplayComponent } from './components/emotion-display/emotion-display.component';
import { WebSocketService, CHARACTERS, type CharacterId } from './services/websocket.service';
import { AudioPlayerService } from './services/audio-player.service';

@Component({
  selector: 'app-root',
  imports: [EmotionDisplayComponent, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('client');
  protected readonly characters = CHARACTERS;
  protected readonly selectedCharacter = signal<CharacterId>('cheerful');
  protected readonly messageInput = signal('');
  protected readonly chatFinished = signal(false);

  readonly wsService = inject(WebSocketService);
  private readonly audioPlayer = inject(AudioPlayerService);

  readonly connectionStatus = this.wsService.connectionStatus;
  readonly isConnected = this.wsService.isConnected;
  readonly chatStarted = this.wsService.chatStarted;
  readonly isThinking = this.wsService.isThinking;

  ngOnInit(): void {
    // Listen for chat-ended and wait for audio to finish
    this.wsService.chatEnded$.subscribe(() => {
      this.waitForAudioThenFinish();
    });
  }

  private waitForAudioThenFinish(): void {
    // Check if audio is currently playing
    if (this.audioPlayer.isPlayingSignal()) {
      // Poll until audio finishes
      const checkInterval = setInterval(() => {
        if (!this.audioPlayer.isPlayingSignal()) {
          clearInterval(checkInterval);
          this.chatFinished.set(true);
        }
      }, 100);
    } else {
      // Audio already finished, mark chat as finished immediately
      this.chatFinished.set(true);
    }
  }

  @ViewChild('messageInputField') messageInputField!: ElementRef<HTMLInputElement>;

  selectCharacter(id: CharacterId): void {
    this.selectedCharacter.set(id);
    this.wsService.switchCharacter(id);
  }

  sendMessage(): void {
    const message = this.messageInput().trim();
    if (!message) return;

    this.audioPlayer.stop();
    this.wsService.sendMessage(message, this.selectedCharacter());
    this.messageInput.set('');
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  startChat(): void {
    if (!this.isConnected()) return;
    this.audioPlayer.stop();
    this.wsService.startChat(this.selectedCharacter());
  }

  restartChat(): void {
    this.chatFinished.set(false);
    this.audioPlayer.stop();
    this.wsService.restartChat(this.selectedCharacter());
  }
}

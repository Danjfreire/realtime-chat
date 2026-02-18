import { Component, signal, inject, ViewChild, ElementRef } from '@angular/core';
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
export class App {
  protected readonly title = signal('client');
  protected readonly characters = CHARACTERS;
  protected readonly selectedCharacter = signal<CharacterId>('cheerful');
  protected readonly messageInput = signal('');

  private readonly wsService = inject(WebSocketService);
  private readonly audioPlayer = inject(AudioPlayerService);

  readonly connectionStatus = this.wsService.connectionStatus;
  readonly isConnected = this.wsService.isConnected;

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
}

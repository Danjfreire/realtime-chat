import { Component, signal } from '@angular/core';
import { ChatComponent } from './components/chat/chat.component';
import { EmotionDisplayComponent } from './components/emotion-display/emotion-display.component';
import { CHARACTERS, type CharacterId } from './services/chat.service';

@Component({
  selector: 'app-root',
  imports: [ChatComponent, EmotionDisplayComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('client');
  protected readonly characters = CHARACTERS;
  protected readonly selectedCharacter = signal<CharacterId>('cheerful');

  selectCharacter(id: CharacterId): void {
    this.selectedCharacter.set(id);
  }
}

import { Component, inject, signal, ElementRef, viewChild, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  template: `
    <div class="flex flex-col h-full">
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        @for (msg of messages(); track $index) {
          <div
            class="max-w-[80%] p-3 rounded-lg"
            [class]="msg.role === 'user' 
              ? 'ml-auto bg-blue-500 text-white' 
              : 'mr-auto bg-gray-200 text-gray-900'"
          >
            {{ msg.content }}
          </div>
        }
        
        @if (isThinking()) {
          <div class="mr-auto bg-gray-200 text-gray-900 p-3 rounded-lg">
            <span class="animate-pulse">AI is thinking...</span>
          </div>
        }

        @if (audioService.isPlaying()) {
          <div class="mr-auto bg-green-100 text-green-800 p-2 rounded-lg text-sm">
            🔊 Playing audio...
          </div>
        }
      </div>

      <div class="border-t p-4 flex gap-2">
        <input
          #inputEl
          type="text"
          [(ngModel)]="userInput"
          (keyup.enter)="sendMessage()"
          placeholder="Type a message..."
          class="flex-1 p-2 border rounded-lg"
          [disabled]="isThinking()"
        />
        <button
          (click)="sendMessage()"
          [disabled]="isThinking() || !userInput()"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
  `]
})
export class ChatComponent {
  readonly chatService = inject(ChatService);
  readonly audioService = inject(AudioService);

  readonly messages = signal<ChatMessage[]>([]);
  readonly userInput = signal('');
  readonly isThinking = signal(false);
  
  readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');

  constructor() {
    effect(() => {
      if (this.audioService.isPlaying()) {
        console.log('Audio playing');
      }
    });
  }

  sendMessage(): void {
    const text = this.userInput().trim();
    if (!text || this.isThinking()) return;

    this.messages.update(msgs => [...msgs, { role: 'user', content: text }]);
    this.userInput.set('');
    this.isThinking.set(true);

    this.chatService.sendMessage(text).subscribe({
      next: (response) => {
        this.messages.update(msgs => [...msgs, { role: 'assistant', content: response.response }]);
        this.isThinking.set(false);
        
        this.audioService.sendText(response.response);
      },
      error: (err) => {
        console.error('Chat error:', err);
        this.messages.update(msgs => [...msgs, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
        this.isThinking.set(false);
      }
    });
  }
}

import { Component, signal } from '@angular/core';
import { ChatComponent } from './components/chat/chat.component';

@Component({
  selector: 'app-root',
  imports: [ChatComponent],
  template: '<app-chat />',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('client');
}

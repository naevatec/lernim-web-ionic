import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { UserModel } from '../../models/user-model';
import { Session } from 'openvidu-browser';
import { ChatMessage } from '../../models/chat-message';

@Component({
  selector: 'app-chat-component',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent {
  @ViewChild('chatScroll') chatScroll: ElementRef;

  @Input() session: Session;
  @Input() teacher: UserModel;
  @Input() user: UserModel;
  @Input() otherUsers: UserModel[];
  @Input() lightTheme: boolean;
  @Input() messageList: ChatMessage[] = [];

  @Output() closeChat = new EventEmitter<any>();


  showParticipants = false;
  message: string;

  /**
   * Handles the return-key event.
   */
  handleReturnKeyEvent(event) {
    if (event && event.keyCode === 13) {
      this.sendMessage();
    }
  }

  /**
   * Sends a new message to all participants.
   */
  sendMessage(): void {
    this.message = this.message.trim();

    if (this.user && this.message) {
      const data = {
        connectionId: this.user.connectionId,
        message: this.message,
        userName: this.user.userName
      };

      this.session.signal({
        data: JSON.stringify(data),
        type: 'chat'
      });

      this.message = '';
      this.showParticipants = false;
    }
  }

  /**
   * Scrolls the chat to the bottom to see the last message.
   */
  scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.chatScroll.nativeElement.scrollTop = this.chatScroll.nativeElement.scrollHeight;
      } catch (err) {
      }
    }, 20);
  }

  /**
   * Toggles the visibility of the participants view.
   */
  toggleParticipants() {
    this.showParticipants = !this.showParticipants;
  }

  /**
   * Closes the chat view.
   */
  close() {
    this.closeChat.emit();
  }
}

import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { UserModel } from "../../models/user-model";
import { Session } from "openvidu-browser";

@Component({
  selector: "chat-component",
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.css"]
})
export class ChatComponent implements OnInit {
  @ViewChild("chatScroll", {static: false}) chatScroll: ElementRef;

  @Input() session: Session;
  @Input() usersData: UserModel[];
  @Input() user: UserModel;
  @Input() lightTheme: boolean;
  @Input() messageList: { connectionId: string; userName: string; message: string, userAvatar: string }[] = [];

  _chatDisplay: "block" | "none";
  showParticipants = false;

  @Output() closeChat = new EventEmitter<any>();

  message: string;

  constructor() {
  }

  @Input("chatDisplay") set isDisplayed(display: "block" | "none") {
    this._chatDisplay = display;
    if (this._chatDisplay === "block") {
      this.scrollToBottom();
    }
  }

  ngOnInit() {
  }

  eventKeyPress(event) {
    if (event && event.keyCode === 13) {
      this.sendMessage();
    }
  }

  sendMessage(): void {
    if (this.user && this.message) {
      this.message = this.message.replace(/ +(?= )/g, "");
      if (this.message !== "" && this.message !== " ") {
        const data = {
          connectionId: this.user.connectionId,
          message: this.message,
          userName: this.user.userName
        };
        this.session.signal({
          data: JSON.stringify(data),
          type: "chat"
        });
        this.message = "";
      }
    }
  }

  scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.chatScroll.nativeElement.scrollTop = this.chatScroll.nativeElement.scrollHeight;
      }
      catch (err) {
      }
    }, 20);
  }

  toggleParticipants() {
    this.showParticipants = !this.showParticipants;
  }

  close() {
    this.closeChat.emit();
  }
}

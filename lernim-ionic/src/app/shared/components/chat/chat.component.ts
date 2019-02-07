import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UserModel } from '../../models/user-model';
import { ModalController } from '@ionic/angular';
import { Session } from 'openvidu-browser';

@Component({
    selector: 'chat-component',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {

    message: string;

    @Input() session: Session;
    @Input() usersData: UserModel[];
    @Input() user: UserModel;
    @Input()
    messageList: { connectionId: string; userName: string; message: string, userAvatar: string }[] = [];

    @Output()
    messageReceived = new EventEmitter<any>();
    @Output()
    closeChat = new EventEmitter<any>();

    constructor(public modalController: ModalController) {}

    ngOnInit() {}

    eventKeyPress(event) {
        if (event && event.keyCode === 13) {
            this.sendMessage();
        }
    }

    sendMessage(): void {
        if (this.user && this.message) {
            this.message = this.message.replace(/ +(?= )/g, '');
            if (this.message !== '' && this.message !== ' ') {
                const data = { connectionId: this.user.connectionId, message: this.message, userName: this.user.userName };
                this.session.signal({
                    data: JSON.stringify(data),
                    type: 'chat',
                });
                this.scrollToBottom();
                this.message = '';
            }
        }
    }

    scrollToBottom(): void {
        setTimeout(() => {
            try {
                const contentMessage = document.getElementById('message-wrap');
                contentMessage.scrollTop = contentMessage.scrollHeight;
            } catch (err) {
                console.error(err);
            }
        }, 20);
    }

    dismiss() {
        this.modalController.dismiss();
    }

    onFocus() {}
}

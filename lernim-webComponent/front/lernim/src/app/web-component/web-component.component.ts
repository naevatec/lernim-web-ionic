import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ISessionCongif } from '../shared/models/webcomponent-config';
import { VideoRoomComponent } from '../video-room/video-room.component';

@Component({
  selector: 'app-web-component',
  templateUrl: './web-component.component.html',
  styleUrls: ['./web-component.component.css']
})
export class WebComponentComponent implements OnInit {
  _sessionName: string;
  _user: string;
  _token: string;
  _roleTeacher: boolean;
  _openviduServerUrl: string;
  _openviduSecret: string;

  @Input() theme: string;
  @Output() joinSession = new EventEmitter<any>();
  @Output() leaveSession = new EventEmitter<any>();
  @Output() error = new EventEmitter<any>();

  @ViewChild('videoRoom') videoRoom: VideoRoomComponent;

  public display = false;

  constructor() {
  }

  @Input('sessionConfig') set sessionConfig(sessionConfig: ISessionCongif) {
    if (sessionConfig) {
      this._sessionName = sessionConfig.sessionName;
      this._user = sessionConfig.user;
      this._openviduServerUrl = sessionConfig.url;
      this._openviduSecret = sessionConfig.secret;
      this._roleTeacher = sessionConfig.roleTeacher;

      if (this.validateParameters()) {
        console.log('valid');
        this.display = true;
      }
    } else {
      this.videoRoom.exitSession();
      this.display = false;
    }
  }

  ngOnInit() {
  }

  validateParameters(): boolean {
    return !!(this._sessionName && this._openviduServerUrl && this._openviduSecret && this._user);

  }

  emitJoinSessionEvent(event): void {
    this.joinSession.emit(event);
    this.videoRoom.checkSizeComponent();
  }

  emitLeaveSessionEvent(event): void {
    this.leaveSession.emit(event);
    this.display = false;
  }

  emitErrorEvent(event): void {
    setTimeout(() => this.error.emit(event), 20);
  }
}

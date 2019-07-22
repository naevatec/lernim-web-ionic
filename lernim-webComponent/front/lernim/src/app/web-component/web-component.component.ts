import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ISessionConfig } from '../shared/models/webcomponent-config';
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
  _students: string[];
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

  @Input('sessionConfig') set sessionConfig(sessionConfig: ISessionConfig) {
    if (sessionConfig) {
      this._sessionName = sessionConfig.sessionName;
      this._user = sessionConfig.user;
      this._openviduServerUrl = sessionConfig.ov_url;
      this._openviduSecret = sessionConfig.ov_secret;
      this._students = sessionConfig.students;
      this._roleTeacher = sessionConfig.roleTeacher;

      if (this.validateParameters()) {
        console.log('Valid parameters');
        this.display = true;
      } else {
        console.log('Incorrect parameters');
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
    console.log('Joining session');
    this.joinSession.emit(event);
    this.videoRoom.checkSizeComponent();
  }

  emitLeaveSessionEvent(event): void {
    console.log('Leaving session');
    this.leaveSession.emit(event);
    this.display = false;
  }

  emitErrorEvent(event): void {
    setTimeout(() => this.error.emit(event), 20);
  }
}

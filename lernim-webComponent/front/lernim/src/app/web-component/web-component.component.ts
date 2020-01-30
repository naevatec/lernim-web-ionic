import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { ISessionCongif } from "../shared/models/webcomponent-config";
import { VideoRoomComponent } from "../video-room/video-room.component";

@Component({
  selector: "app-web-component",
  templateUrl: "./web-component.component.html",
  styleUrls: ["./web-component.component.css"]
})
export class WebComponentComponent implements OnInit {
  _sessionName: string;
  _user: string;
  _token: string;
  _roleTeacher: boolean;

  @Input() openviduServerUrl: string;
  @Input() openviduSecret: string;
  @Input() theme: string;
  @Output() joinSession = new EventEmitter<any>();
  @Output() leaveSession = new EventEmitter<any>();
  @Output() error = new EventEmitter<any>();

  @ViewChild("videoRoom", {static: false}) videoRoom: VideoRoomComponent;

  public display = false;

  constructor() {
  }

  @Input("sessionConfig") set sessionConfig(config: any) {
    let sessionConfig: ISessionCongif;
    console.log("Session config input ", config);
    sessionConfig = config;
    if (typeof config === "string") {
      sessionConfig = JSON.parse(config);
    }
    if (sessionConfig) {
      this._sessionName = sessionConfig.sessionName;
      this._user = sessionConfig.user;
      this._token = sessionConfig.token;
      this._roleTeacher = sessionConfig.roleTeacher;
      if (this.validateParameters()) {
        this.display = true;
      }
    } else {
      this.videoRoom.exitSession();
    }
  }

  ngOnInit() {
  }

  validateParameters(): boolean {
    if ((this._sessionName && this.openviduServerUrl && this.openviduSecret && this._user /*&& this._roleTeacher*/) ||
      (this._token && this._user /*&& this._roleTeacher*/)) {
      return true;
    }
    return false;
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

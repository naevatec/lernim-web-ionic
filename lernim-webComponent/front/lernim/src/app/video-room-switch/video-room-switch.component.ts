import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { OpenViduService } from '../shared/services/open-vidu.service';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'app-web-component',
  templateUrl: './video-room-switch.component.html',
  styleUrls: ['./video-room-switch.component.css']
})
export class VideoRoomSwitchComponent implements OnInit {
  _sessionName: string;
  _userName: string;
  _roleTeacher: boolean;

  @Input() theme: string;
  @Output() joinSession = new EventEmitter<any>();
  @Output() leaveSession = new EventEmitter<any>();
  @Output() error = new EventEmitter<any>();

  public display = false;

  constructor(private openViduSrv: OpenViduService, private router: Router, private route: ActivatedRoute, public dialog: MatDialog) {
  }

  ngOnInit() {
    // Get the params of the uri.
    this.route.params.subscribe((params: Params) => {
      this._sessionName = params.roomName || ('default-session-' + Math.floor(Math.random() * 100));
      this._userName = params.userName || ('OpenVidu-User-' + Math.floor(Math.random() * 100));
      this._roleTeacher = params.role === 't';

      console.log('ROL: ' + (this._roleTeacher ? 'TEACHER' : 'STUDENT'));

      this.display = true;
    });
  }

  /**
   * Leaves the session.
   */
  private leaveSessionHandler() {
    console.log('Leaving session');
    this.router.navigate(['']);
  }
}

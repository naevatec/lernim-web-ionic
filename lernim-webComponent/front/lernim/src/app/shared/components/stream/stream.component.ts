import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { StreamManager } from 'openvidu-browser';
import { UserModel } from '../../models/user-model';
import { OpenViduVideoComponent } from './ov-video.component';

@Component({
  selector: 'app-stream-component',
  styleUrls: ['./stream.component.css'],
  templateUrl: './stream.component.html'
})
export class StreamComponent {

  @ViewChild('mainElement') mainElement: ElementRef;
  @ViewChild('videoComponent') videoComponent: OpenViduVideoComponent;

  @Input() streamManager: StreamManager;
  @Input() lightTheme: boolean;
  @Input() compact: boolean;
  @Input() isMiniature: boolean;
  @Input() small: boolean;
  @Input() user: UserModel;
  @Input() highlightUserType: boolean;
  @Input() muted: boolean;
  @Input() hideVideo: boolean;
}

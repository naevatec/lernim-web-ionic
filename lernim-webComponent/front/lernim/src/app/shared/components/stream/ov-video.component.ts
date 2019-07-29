import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { StreamManager } from 'openvidu-browser';

@Component({
  selector: 'ov-video',
  template: `
    <video #videoElement [class.hidden]="hideVideo" [id]="'video-' + _streamManager.stream.streamId" [muted]="mutedSound"></video>`,
  styleUrls: ['./stream.component.css']
})
export class OpenViduVideoComponent implements AfterViewInit {

  @ViewChild('videoElement') videoElement: ElementRef;

  @Input() hideVideo: boolean;
  @Input() mutedSound: boolean;

  _streamManager: StreamManager;

  ngAfterViewInit() {
    this._streamManager.addVideoElement(this.videoElement.nativeElement);
  }

  @Input() set streamManager(streamManager: StreamManager) {
    this._streamManager = streamManager;
    if (!!this.videoElement) {
      this._streamManager.addVideoElement(this.videoElement.nativeElement);
    }
  }
}

import { AfterViewInit, Component, ElementRef, Input, ViewChild } from "@angular/core";
import { StreamManager } from "openvidu-browser";

@Component({
  selector: "ov-video",
  template: `
    <video #videoElement [id]="'video-' + _streamManager.stream.streamId" [muted]="mutedSound"></video>`,
  styleUrls: ["./stream.component.css"]
})
export class OpenViduVideoComponent implements AfterViewInit {

  @ViewChild("videoElement", {static: false}) elementRef: ElementRef;

  @Input() mutedSound: boolean;

  _streamManager: StreamManager;

  @Input() set streamManager(streamManager: StreamManager) {
    this._streamManager = streamManager;
    if (!!this.elementRef) {
      this._streamManager.addVideoElement(this.elementRef.nativeElement);
    }
  }

  ngAfterViewInit() {
    this._streamManager.addVideoElement(this.elementRef.nativeElement);
  }
}

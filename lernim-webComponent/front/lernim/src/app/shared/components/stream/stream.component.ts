import { Component, Input, OnInit, HostListener, ElementRef, ViewChild, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { StreamManager } from 'openvidu-browser';

@Component({
  selector: 'stream-component',
  styleUrls: ['./stream.component.css'],
  templateUrl: './stream.component.html',
})
export class StreamComponent implements OnInit {
  fullscreenIcon = 'fullscreen';
  mutedSound: boolean;
  isFullscreen: boolean;
  mutedSoundIcon = 'volume_up';
  publishAudioIcon = 'volume_up';

  @Input() streamManager: StreamManager;
  @Input() lightTheme: boolean;
  @Input() compact: boolean;
  @Input() showNotification: boolean;
  @Input() small: boolean;
  @Input() muted: boolean;
  @Input() publishAudio: boolean;
  @Output() screenShareClicked = new EventEmitter<any>();
  @Output() screenShareDisabledClicked = new EventEmitter<any>();

  @ViewChild('videoElement') htmlVideoElement: ElementRef;
  videoElement: HTMLVideoElement;

  @HostListener('window:resize', ['$event'])
  sizeChange(event) {
    const maxHeight = window.screen.height;
    const maxWidth = window.screen.width;
    const curHeight = window.innerHeight;
    const curWidth = window.innerWidth;
    if (maxWidth !== curWidth && maxHeight !== curHeight) {
      this.isFullscreen = false;
      this.fullscreenIcon = 'fullscreen';
    }
  }

  ngOnInit() {
    this.mutedSound = this.muted;
  }

  // ngAfterViewInit() { // Get HTMLVideoElement from the view
  //   this.videoElement = this.htmlVideoElement.nativeElement;
  // }

  ngOnChanges(changes: SimpleChanges) { // Listen to 'muted' property changes
    if (changes['muted']) {
      this.muted = changes['muted'].currentValue;
      console.warn('Small: ' + this.small + ' | Muted: '  + this.muted);
      this.mutedSound = this.muted;
      if (this.mutedSound) {
        this.mutedSoundIcon = 'volume_off';
      } else {
        this.mutedSoundIcon = 'volume_up';
      }
    }
    if (changes['publishAudio']) {
      this.publishAudio = changes['publishAudio'].currentValue;
      if (this.publishAudio) {
        this.publishAudioIcon = 'volume_up';
      } else {
        this.publishAudioIcon = 'volume_off';
      }
    }
  }

  // ngDoCheck() { // Detect any change in 'stream' property (specifically in its 'srcObject' property)
  //   if (this.videoElement && (this.videoElement.srcObject !== this.streamManager.stream.getMediaStream())) {
  //     this.videoElement.srcObject = this.streamManager.stream.getMediaStream();
  //   }
  // }

  getNicknameTag() {
    try {
        return JSON.parse(this.streamManager.stream.connection.data).userName;
    } catch (err) {
        console.error('Username is not JSON formatted');
    }
  }

  toggleSound(): void {
    this.mutedSound = !this.mutedSound;
  }

  screenShare() {
    this.screenShareClicked.emit();
  }

  screenShareDisabled() {
    this.screenShareDisabledClicked.emit();
  }

}

import { Component, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { StreamManager, StreamPropertyChangedEvent } from 'openvidu-browser';
import { Platform } from '@ionic/angular';
declare var cordova;

@Component({
    selector: 'ov-video',
    template: `<video #videoElement [id]="'video-' + _streamManager.stream.streamId" [muted]="mutedSound"
    [class.rotate]="rotateVideo"></video>`,
    styleUrls: ['./stream.component.scss']
})
export class OpenViduVideoComponent implements AfterViewInit {

    @ViewChild('videoElement') elementRef: ElementRef;

    @Input() mutedSound: boolean;
    @Input() rotateVideo: boolean;

    _streamManager: StreamManager;
    rotationFunction;

    constructor(private platform: Platform) {}

    ngAfterViewInit() {
        if (this.isIos() && this._streamManager.remote) {
            this.rotationFunction = () => {
                // Give the remote video some time to update its dimensions when rotating the device
                setTimeout(() => {
                    this.applyIosIonicVideoAttributes();
                }, 250);
            };
            (<any>window).addEventListener('orientationchange', this.rotationFunction);
        }
        this.updateVideoView();
        // this._streamManager.addVideoElement(this.elementRef.nativeElement);
    }

    @Input()
    set streamManager(streamManager: StreamManager) {
        this._streamManager = streamManager;
        if (!!this.elementRef) {
             this._streamManager.addVideoElement(this.elementRef.nativeElement);
        }
        if (this.isIos()) {
        //    this._streamManager.on('streamPropertyChanged', event => {
        //        if ((<StreamPropertyChangedEvent>event).changedProperty === 'videoDimensions') {
                    this.applyIosIonicVideoAttributes();
        //        }
        //    });
        }
    }

    private updateVideoView() {
        this._streamManager.addVideoElement(this.elementRef.nativeElement);
        if (this.isIos()) {
            (<HTMLVideoElement>this.elementRef.nativeElement).onloadedmetadata = () => {
                this.applyIosIonicVideoAttributes();
            };
        }
    }

    private applyIosIonicVideoAttributes() {
        // this.elementRef.nativeElement.style.width = this._streamManager.stream.videoDimensions.width;
        this.elementRef.nativeElement.style.width ='100% !important';
        this.elementRef.nativeElement.style.objectFit = 'fill';
        this.elementRef.nativeElement.style.position = 'relative';
        this.elementRef.nativeElement.style.display = 'inline-block';
        this.elementRef.nativeElement.style.zIndex = '-1';
        // const ratio = this._streamManager.stream.videoDimensions.height / this._streamManager.stream.videoDimensions.width;
        // const computedWidth = this.elementRef.nativeElement.offsetWidth;
        // this.elementRef.nativeElement.style.height = computedWidth * ratio + 'px';
        // this.elementRef.nativeElement.style.height= '100% !important';
        if (!this._streamManager.remote) {
            // It is a Publisher video. Custom iosrtc plugin mirror video
            this.elementRef.nativeElement.style.transform = 'scale(-1,1)';
         }
        cordova.plugins.iosrtc.refreshVideos();
    }

    private isIos(): boolean {
        return this.platform.is('ios') && this.platform.is('cordova');
    }
}

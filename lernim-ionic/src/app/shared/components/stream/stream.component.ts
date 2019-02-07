import { Component, OnInit, Input, SimpleChanges} from '@angular/core';
import { StreamManager } from 'openvidu-browser';

@Component({
    selector: 'stream-component',
    templateUrl: './stream.component.html',
    styleUrls: ['./stream.component.scss'],
})
export class StreamComponent implements OnInit {
    mutedSound: boolean;

    @Input() streamManager: StreamManager;
    @Input() muted: boolean;

    constructor() {}

    ngOnInit() {
        this.mutedSound = this.muted;
    }

    ngOnChanges(changes: SimpleChanges) { // Listen to 'muted' property changes
        if (changes['muted']) {
            this.muted = changes['muted'].currentValue;
            this.mutedSound = this.muted;
        }
    }

    getNicknameTag() {
        try {
            return JSON.parse(this.streamManager.stream.connection.data).userName;
        } catch (err) {
            console.error('Username is not JSON formatted');
        }
    }
}

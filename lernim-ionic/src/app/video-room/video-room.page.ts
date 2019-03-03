import { Component, EventEmitter, OnInit, OnDestroy, Input, HostListener, ViewChild, ElementRef, Output } from '@angular/core';
import { Platform, ModalController, AlertController } from '@ionic/angular';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserModel } from '../shared/models/user-model';
import { OpenViduLayout, OpenViduLayoutOptions } from '../shared/layout/openvidu-layout';
import { OpenVidu, Session, StreamEvent, Publisher, SignalOptions, StreamManager,
    Connection, ConnectionEvent, SignalEvent, VideoElementEvent } from 'openvidu-browser';
import { OpenViduService } from '../shared/services/openvidu.service';
import { trigger, keyframes, state, style, transition, animate } from '@angular/animations';
import { ChatComponent } from '../shared/components/chat/chat.component';
import { InterventionAskedPipe } from '../shared/pipes/intervention-asked';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';

declare var cordova;

@Component({
    selector: 'app-video-room',
    templateUrl: './video-room.page.html',
    styleUrls: ['./video-room.page.scss'],
    providers: [InterventionAskedPipe],
    animations: [
        trigger('slideLeftRight', [
            state(
                'in',
                style({
                    transform: 'translateX(0px)'
                }),
            ),
            state(
                'out',
                style({
                    transform: 'translateX(100px)'
                }),
            ),
            transition('in => out', animate('200ms', keyframes([style({ transform: 'translateX(100px)' })]))),
            transition('out => in', animate('200ms', keyframes([style({ transform: 'translateX(0px)' })]))),
        ]),
        trigger('slideLeftRightChat', [
            state(
                'in',
                style({
                    transform: 'translateX(0px)'
                }),
            ),
            state(
                'out',
                style({
                    transform: 'translateX(100px)',
                }),
            ),
            transition('in => out', animate('200ms', keyframes([style({ transform: 'translateX(100px)' })]))),
            transition('out => in', animate('200ms', keyframes([style({ transform: 'translateX(0px)' })]))),
        ]),
        trigger('slideTopBottom', [
            state(
                'in',
                style({
                    transform: 'translateY(0px)',
                    visibility: 'visible'
                }),
            ),
            state(
                'out',
                style({
                    visibility: 'hidden'
                }),
            ),
            transition('in => out', animate('200ms', keyframes([style({ transform: 'translateY(100px)' })]))),
            transition('out => in', animate('200ms', keyframes([style({ transform: 'translateY(0px)' })]))),
        ]),
    ],
})

export class VideoRoomPage implements OnInit, OnDestroy {
    // Constants
    ANDROID_PERMISSIONS = [
        this.androidPermissions.PERMISSION.CAMERA,
        this.androidPermissions.PERMISSION.RECORD_AUDIO,
        this.androidPermissions.PERMISSION.MODIFY_AUDIO_SETTINGS,
    ];
    BIG_ELEMENT_CLASS = 'OV_big';

    buttonsVisibility = 'in';
    chatNotification = 'in';
    cameraBtnColor = 'light';
    camBtnColor = 'light';
    camBtnIcon = 'videocam';
    micBtnColor = 'light';
    micBtnIcon = 'mic';
    chatBtnColor = 'light';
    bigElement: HTMLElement;
    messageReceived = false;
    isBackCamera = false;
    modalIsPresented = false;

    // Join form
    mySessionId: string;
    myUserName: string;
    role: boolean;

    @Input() sessionName: string;
    @Input() user: string;
    @Input() token: string;
    @Input() roleTeacher: boolean;
    @Input() openviduServerUrl: string;
    @Input() openviduSecret: string;
    @Output() joinSession = new EventEmitter<any>();
    @Output() leaveSession = new EventEmitter<any>();
    @Output() error = new EventEmitter<any>();

    // Updated by click event
    usersData: UserModel[] = [];
    teacher = false;
    student = false;
    interventionRequired = false;
    myInterventionRequired = false;
    studentAccessGranted = false;
    myStudentAccessGranted = false;
    messageList: { connectionId: string; userName: string; message: string }[] = [];
    resizeTimeout;
    publishAudioMain = true;
    publishAudioExtra = true;
    publishVideoMain = true;
    publishVideoExtra = true;
    screenShareActive = false;

    // OpenVidu Objets
    OV: OpenVidu;
    @ViewChild('mainStream') mainStream: ElementRef;
    session: Session;
    openviduLayout: OpenViduLayout;
    openviduLayoutOptions: OpenViduLayoutOptions;
    mainStreamManager: StreamManager;
    extraStreamManager: StreamManager;
    teacherStream: StreamManager;
    teacherConnection: Connection;
    OVConnections: Connection[] = [];
    OVPublisher: Publisher;
    userChat: UserModel;

    // Icons
    interventionIcon = 'hand';
    fullscreenIcon = 'fullscreen';
    publishAudioIcon = 'mic';

    constructor(
        private platform: Platform,
        private router: Router,
        private route: ActivatedRoute,
        private openViduSrv: OpenViduService,
        public modalController: ModalController,
        private androidPermissions: AndroidPermissions,
        public alertController: AlertController,
    ) {
        this.initializeAdapterIosRtc();
     }

     initializeAdapterIosRtc() {
        this.platform.ready().then(() => {
            if (this.platform.is('ios') && this.platform.is('cordova')) {
                console.log('Initializing iosrct');
                cordova.plugins.iosrtc.registerGlobals();
                // load adapter.js (version 4.0.1)
                const script2 = document.createElement('script');
                script2.type = 'text/javascript';
                script2.src = 'assets/libs/adapter-4.0.1.js';
                script2.async = false;
                document.head.appendChild(script2);
            }
        });
    }

    @HostListener('window:beforeunload')
    beforeunloadHandler() {
        this.exitSession();
    }

    @HostListener('window:resize', ['$event'])
    sizeChange(event) {
        clearTimeout(this.resizeTimeout);
        this.updateLayout();
    }

    ngOnInit() {
        this.generateParticipantInfo();
        this.openviduLayout = new OpenViduLayout();
        this.openviduLayoutOptions = {
            maxRatio: 3 / 2, // The narrowest ratio that will be used (default 2x3)
            minRatio: 9 / 16, // The widest ratio that will be used (default 16x9)
            fixedRatio: false /* If this is true then the aspect ratio of the video is maintained
      and minRatio and maxRatio are ignored (default false)*/,
            bigClass: 'OV_big', // The class to add to elements that should be sized bigger
            bigPercentage: 0.82, // The maximum percentage of space the big ones should take up
            bigFixedRatio: false, // fixedRatio for the big ones
            bigMaxRatio: 3 / 2, // The narrowest ratio to use for the big elements (default 2x3)
            bigMinRatio: 9 / 16, // The widest ratio to use for the big elements (default 16x9)
            bigFirst: false, // Whether to place the big one in the top left (true) or bottom right
            animate: true, // Whether you want to animate the transitions
        };
        this.openviduLayout.initLayoutContainer(document.getElementById('layout'), this.openviduLayoutOptions);
        this.joinToSession();
    }

    ngOnDestroy() {
        this.exitSession();
    }

    joinToSession() {
        this.OV = new OpenVidu();
        this.session = this.OV.initSession();
        this.subscribeToUserChanged();
        this.subscribeToStreamCreated();
        this.subscribedToStreamDestroyed();
        this.subscribedToConectionCreated();
        this.subscribedToConectionDestroyed();
        this.subscribeToSignals();
        this.subscribedToChat();
        this.connectToSession();
    }

    exitSession() {
        if (this.session) {
            this.session.disconnect();
        }
        this.session = null;
        this.OV = null;
        this.openviduLayout = null;
        this.router.navigate(['']);
        this.leaveSession.emit();
    }

    resetVideoSize() {
        const element = document.querySelector('.' + this.BIG_ELEMENT_CLASS);
        if (element) {
            element.classList.remove(this.BIG_ELEMENT_CLASS);
            this.bigElement = undefined;
        }
        this.openviduLayout.updateLayout();
        this.refreshVideos();
    }

    private changeAudioIcons(streamManager: StreamManager): void {
        if (streamManager.stream.audioActive) {
            this.micBtnIcon = 'mic';
            this.micBtnColor = 'light';
        } else {
            this.micBtnIcon = 'mic-off';
            this.micBtnColor = 'primary';
        }
    }

    private changeVideosIcons(streamManager: StreamManager): void {
        if (streamManager.stream.videoActive) {
            this.camBtnIcon = 'videocam';
            this.camBtnColor = 'light';
        } else {
            this.camBtnIcon = 'eye-off';
            this.camBtnColor = 'primary';
        }
    }

    public micStatusMainChanged(): void {
        (<Publisher>this.mainStreamManager).publishAudio(!this.publishAudioMain);
        this.sendSignalUserChanged({ isAudioActiveMain: !this.publishAudioMain });
        this.changeAudioIcons(this.mainStreamManager);
    }

    public micStatusExtraChanged(): void {
        (<Publisher>this.extraStreamManager).publishAudio(!this.publishAudioExtra);
        this.sendSignalUserChanged({ isAudioActiveExtra: !this.publishAudioExtra });
        this.changeAudioIcons(this.extraStreamManager);
    }

    public camStatusMainChanged(): void {
        (<Publisher>this.mainStreamManager).publishVideo(!this.publishVideoMain);
        this.sendSignalUserChanged({ isVideoActiveMain: !this.publishVideoMain });
        this.changeVideosIcons(this.mainStreamManager);
    }

    public camStatusExtraChanged(): void {
        (<Publisher>this.extraStreamManager).publishVideo(!this.publishVideoExtra);
        this.sendSignalUserChanged({ isVideoActiveExtra: !this.publishVideoExtra });
        this.changeVideosIcons(this.extraStreamManager);
    }

    private sendSignalUserChanged(data: any): void {
        const signalOptions: SignalOptions = {
            data: JSON.stringify(data),
            type: 'userChanged',
        };
        this.session.signal(signalOptions);
    }

    public askForIntervention() {
        if (this.platform.is('cordova')) {
            console.warn('connectToSession(): cordova');
            if (this.platform.is('android')) {
                console.log('Android platform');
                this.checkAndroidPermissions()
                    .then(() => {
                        this.connectWebCam();
                    })
                    .catch(err => console.error(err));
            } else if (this.platform.is('ios')) {
                console.log('iOS platform');
                this.connectWebCam();
            }
        } else {
            this.connectWebCam();
        }

        this.OVPublisher.on('accessAllowed', (event) => {
            console.warn('OpenVidu camera access allowed');

            const msg = {
                interventionRequired: !this.interventionRequired
            };
            const msg2 = {
                myInterventionRequired: !this.myInterventionRequired
            };

            this.session.signal({
                type: 'askIntervention',
                to: [this.teacherConnection],
                data: JSON.stringify(msg)
            });

            this.session.signal({
                type: 'askMyIntervention',
                data: JSON.stringify(msg2)
            });

            // Invert intervention request
            this.interventionRequired = !this.interventionRequired;
            this.myInterventionRequired = !this.myInterventionRequired;
            // Change intervention icon
            this.interventionIcon = (this.interventionRequired ? 'close' : 'hand');

        });

        this.OVPublisher.on('accessDenied', (event) => {
            console.error('OpenVidu camera access denied');
        });
    }

    public grantIntervention(grant: boolean, userData: UserModel) {
        this.session.signal({
            type: 'grantIntervention',
            to: this.OVConnections.filter(connection => JSON.parse(connection.data).userName === userData.userName),
            data: grant.toString()
        });

        this.session.signal({
            type: 'grantMyIntervention',
            data: grant.toString()
        });

        // Set 'accessGranted' property of proper userData to 'grant' value
        this.usersData.map((u) => {
            if (u.userName === userData.userName) {
                u.accessGranted = grant;
                u.interventionRequired = grant;
            }
        });
        this.studentAccessGranted = grant;
    }

    async toggleChat() {
        this.buttonsVisibility = 'out';
        this.chatNotification = 'out';
        const modal = await this.modalController.create({
            component: ChatComponent,
            componentProps: { session: this.session, user: this.userChat, messageList: this.messageList },
        });


        modal.onWillDismiss().then(() => {
            this.modalIsPresented = false;
            this.toggleButtons();
        });

        return await modal.present().then(() => {
            this.modalIsPresented = true;
            this.chatBtnColor = 'light';
            this.messageReceived = false;
        });
    }

    public toggleButtons() {
        this.buttonsVisibility = this.buttonsVisibility === 'in' ? 'out' : 'in';
        this.chatNotification = this.buttonsVisibility;
    }

    public toggleButtonsOrEnlargeStream(event: any) {
        const element: HTMLElement = event.composedPath().filter((e: HTMLElement) => e.className && e.className.includes('OT_root'))[0];
        if (this.bigElement && element === this.bigElement) {
            console.log('Elemento local es igual que elemento pulsado');
            this.toggleButtons();
        } else if (this.bigElement !== element) {
            console.log('Elemento local es diferente que elemento pulsado o no existe');
            if (this.bigElement) {
                this.bigElement.classList.remove(this.BIG_ELEMENT_CLASS);
            } else {
                this.toggleButtons();
            }
            element.classList.add(this.BIG_ELEMENT_CLASS);
            this.bigElement = element;
        }
        this.openviduLayout.updateLayout();
        this.refreshVideos();
    }

    private generateParticipantInfo() {
        this.mySessionId = localStorage.getItem('mySessionId');
        this.myUserName = localStorage.getItem('myUserName');
        if (localStorage.getItem('isTeacher') === 'true') {
            this.role = true;
        } else {
            this.role = false;
        }
    }

    private subscribeToUserChanged() {
        this.session.on('signal:userChanged', (event: any) => {
            this.usersData.forEach((user: UserModel) => {
                const data = JSON.parse(event.data);
                if (data.isAudioActiveMain !== undefined) {
                    this.publishAudioMain = data.isAudioActiveMain;
                }
                if (data.isAudioActiveExtra !== undefined) {
                    this.publishAudioExtra = data.isAudioActiveExtra;
                }
                if (data.isVideoActiveMain !== undefined) {
                    this.publishVideoMain = data.isVideoActiveMain;
                }
                if (data.isVideoActiveExtra !== undefined) {
                    this.publishVideoExtra = data.isVideoActiveExtra;
                }
            });
            this.refreshVideos();
        });
    }

    private subscribeToStreamCreated() {
        this.session.on('streamCreated', (event: StreamEvent) => {
            console.warn('OpenVidu stream Created: ', event.stream);
            this.session.subscribe(event.stream, undefined);

            const streamManager: StreamManager = event.stream.streamManager;

            if (JSON.parse(streamManager.stream.connection.data).isTeacher) {
                this.teacherStream = streamManager;
                if (this.studentAccessGranted) {
                    this.extraStreamManager = streamManager;
                } else {
                    this.mainStreamManager = streamManager;
                }
            } else {
                this.mainStreamManager = streamManager;
                this.extraStreamManager = this.teacherStream;
                this.studentAccessGranted = true;
            }
            this.updateLayout();
        });
    }

    private subscribedToStreamDestroyed() {
        this.session.on('streamDestroyed', (event: StreamEvent) => {
            console.warn('OpenVidu stream destroyed: ', event.stream);

            const streamManager: StreamManager = event.stream.streamManager;
            if (JSON.parse(streamManager.stream.connection.data).isTeacher) {
                if (this.myStudentAccessGranted) {
                    this.unpublish();
                    this.refreshVideos();
                }
                delete this.mainStreamManager;
                delete this.extraStreamManager;
                this.studentAccessGranted = false;
                this.myStudentAccessGranted = false;
                this.interventionRequired = false;
                this.interventionIcon = 'hand';
            } else if (this.mainStreamManager.stream.connection.connectionId === streamManager.stream.connection.connectionId) {
                this.studentAccessGranted = false;
                this.mainStreamManager = this.teacherStream;
            }
            this.updateLayout();
        });
    }

    private subscribedToConectionCreated() {
        this.session.on('connectionCreated', (event: ConnectionEvent) => {
            if (event.connection.connectionId === this.session.connection.connectionId) {
                console.warn('YOUR OWN CONNECTION CREATED!');
                console.warn('Conection DATA: ' + this.session.connection.data);
                const chatData: UserModel = JSON.parse(event.connection.data);
                this.userChat = chatData;
                this.userChat.connectionId = this.session.connection.connectionId;
            } else {
                console.warn('OTHER USER\'S CONNECTION CREATED!');
                console.warn('Conection DATA: ' + event.connection.data);
            }
            if (event.connection !== this.session.connection) {
                if (JSON.parse(event.connection.data).isTeacher) {
                    this.teacherConnection = event.connection;
                    console.warn('Conection TEACHER: ' + this.teacherConnection);
                }
            }
            this.OVConnections.push(event.connection);

            const uData: UserModel = JSON.parse(event.connection.data);
            this.usersData.push(uData);
        });

    }

    private subscribedToConectionDestroyed() {
        this.session.on('connectionDestroyed', (event: ConnectionEvent) => {
            console.warn('OTHER USER\'S CONNECTION DESTROYED!');
            console.warn(event.connection);

            // Remove Connection
            const i1 = this.OVConnections.indexOf(event.connection);
            if (i1 !== -1) {
                this.OVConnections.splice(i1, 1);
            }
            // Remove UserData
            const i2 = this.usersData.map((data) => data.userName).indexOf(JSON.parse(event.connection.data).userName);
            if (i2 !== -1) {
                this.usersData.splice(i2, 1);
            }
        });
    }

    private subscribeToSignals() {
        // Signals
        if (this.role === false /*|| this.roleTeacher === false*/) {
            this.session.on('signal:grantIntervention', (msg: SignalEvent) => {
                if (msg.data === 'true') {
                    // Publish
                    this.publish();
                    this.studentAccessGranted = true;
                    this.myStudentAccessGranted = true;
                } else {
                    // Unpublish
                    this.unpublish();
                    this.mainStreamManager = this.teacherStream;
                    this.studentAccessGranted = false;
                    this.myStudentAccessGranted = false;
                    // Invert intervention request
                    this.interventionRequired = !this.interventionRequired;
                    // Change intervention icon
                    this.interventionIcon = (this.interventionRequired ? 'close' : 'hand');
                }
            });
            this.session.on('signal:askMyIntervention', (msg: SignalEvent) => {
                this.myInterventionRequired = JSON.parse(msg.data).myInterventionRequired;
            });

            this.session.on('signal:grantMyIntervention', (msg: SignalEvent) => {
                if (msg.data === 'false') {
                    this.myInterventionRequired = false;
                }
            });

        }
        if (this.role === true /*|| this.roleTeacher === true*/) {
            this.session.on('signal:askIntervention', (msg: SignalEvent) => {
                const from: Connection = msg.from;
                const petition: boolean = JSON.parse(msg.data).interventionRequired;

                if (petition) {
                    // Set proper userData  'interventionRequired' property to true
                    this.usersData.map((uData) => {
                        if (uData.userName === JSON.parse(from.data).userName) {
                            uData.interventionRequired = true;
                        }
                    });
                } else {
                    // Set proper userData  'interventionRequired' property to false
                    this.usersData.map((uData) => {
                        if (uData.userName === JSON.parse(from.data).userName) {
                            uData.interventionRequired = false;
                            this.studentAccessGranted = false;
                            this.myStudentAccessGranted = false;
                        }
                    });
                }
            });
        }
        this.updateLayout();
    }

    private subscribedToChat() {
        this.session.on('signal:chat', (event: any) => {
            const data = JSON.parse(event.data);

            this.messageList.push({
                connectionId: event.from.connectionId,
                userName: data.userName,
                message: data.message,
            });
            ChatComponent.prototype.scrollToBottom();

            if (!this.modalIsPresented) {
                this.chatBtnColor = 'secondary';
                this.messageReceived = true;
                this.chatNotification = 'in';
            }
        });
    }

    private connectToSession(): void {
        if (this.token) {
            this.connect(this.token, this.roleTeacher);
        } else {
            if (this.role === true) {
                console.warn('connectToSession(): TEACHER');
                this.openViduSrv.getToken(this.mySessionId, this.openviduServerUrl, this.openviduSecret)
                    .then((token) => {
                        this.session.connect(token, { userName: this.myUserName, isTeacher: true })
                            .then(() => {
                                if (this.platform.is('cordova')) {
                                    // Ionic platform
                                    console.warn('connectToSession(): cordova');
                                    if (this.platform.is('android')) {
                                        console.log('Android platform');
                                        this.checkAndroidPermissions()
                                            .then(() => {
                                                this.connectWebCam();
                                                this.publish();
                                            })
                                            .catch(err => console.error(err));
                                    } else if (this.platform.is('ios')) {
                                        console.log('iOS platform');
                                        this.connectWebCam();
                                        this.publish();
                                    }
                                } else {
                                    console.warn('connectToSession(): NO cordova');
                                    console.warn('token: ' + token);
                                    this.connectWebCam();
                                    this.publish();
                                }
                            })
                            .catch((error) => {
                                console.log('There was an error connecting to the session:', error.code, error.message);
                                this.error.emit({ error: error.error, messgae: error.message, code: error.code, status: error.status });
                                this.openAlertError(error.message);
                            });
                    })
                    .catch((error) => {
                        console.log('There was an error getting the token:', error.code, error.message);
                        this.error.emit({ error: error.error, messgae: error.message, code: error.code, status: error.status });
                        this.openAlertError(error.message);
                    });
                this.teacher = true;
            } else {
                this.openViduSrv.getOnlyToken(this.mySessionId, this.openviduServerUrl, this.openviduSecret)
                    .then((token) => {
                        this.session.connect(token, { userName: this.myUserName, isTeacher: false });
                        this.student = true;
                    })
                    .catch((error) => {
                        console.log('There was an error getting the token:', error.code, error.message);
                        this.error.emit({ error: error.error, messgae: error.message, code: error.code, status: error.status });
                        this.openAlertError(error.message);
                    });
            }
        }
    }

    // For Angular bild
    private connect(token: string, roleTeacher: boolean): void {
        if (roleTeacher === true) {
            this.session.connect(token, { userName: this.myUserName, isTeacher: true })
                .then(() => {
                    if (this.platform.is('cordova')) {
                        console.warn('connectToSession(): cordova');
                        if (this.platform.is('android')) {
                            console.log('Android platform');
                            this.checkAndroidPermissions()
                                .then(() => {
                                    this.connectWebCam();
                                })
                                .catch(err => console.error(err));
                        } else if (this.platform.is('ios')) {
                            console.log('iOS platform');
                            this.connectWebCam();
                        }
                    } else {
                        this.connectWebCam();
                    }
                    this.publish();
                    this.teacher = true;
                })
                .catch((error) => {
                    this.error.emit({ error: error.error, messgae: error.message, code: error.code, status: error.status });
                    console.log('There was an error connecting to the session:', error.code, error.message);
                    this.openAlertError(error.message);
                });
        } else {
            this.session.connect(token, { userName: this.myUserName, isTeacher: false })
                .then(() => {
                    this.student = true;
                    this.joinSession.emit();
                    this.openviduLayout.updateLayout();
                    this.refreshVideos();
                })
                .catch((error) => {
                    this.error.emit({ error: error.error, messgae: error.message, code: error.code, status: error.status });
                    console.log('There was an error connecting to the session:', error.code, error.message);
                    this.openAlertError(error.message);
                });
        }
    }

    private checkAndroidPermissions(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.platform.ready().then(() => {
                this.androidPermissions
                    .requestPermissions(this.ANDROID_PERMISSIONS)
                    .then(() => {
                        this.androidPermissions
                            .checkPermission(this.androidPermissions.PERMISSION.CAMERA)
                            .then((camera) => {
                                this.androidPermissions
                                    .checkPermission(this.androidPermissions.PERMISSION.RECORD_AUDIO)
                                    .then((audio) => {
                                        this.androidPermissions
                                            .checkPermission(this.androidPermissions.PERMISSION.MODIFY_AUDIO_SETTINGS)
                                            .then((modifyAudio) => {
                                                if (camera.hasPermission && audio.hasPermission && modifyAudio.hasPermission) {
                                                    resolve();
                                                } else {
                                                    reject(
                                                        new Error(
                                                            'Permissions denied: ' +
                                                            '\n' +
                                                            ' CAMERA = ' +
                                                            camera.hasPermission +
                                                            '\n' +
                                                            ' AUDIO = ' +
                                                            audio.hasPermission +
                                                            '\n' +
                                                            ' AUDIO_SETTINGS = ' +
                                                            modifyAudio.hasPermission,
                                                        ),
                                                    );
                                                }
                                            })
                                            .catch((err) => {
                                                console.error(
                                                    'Checking permission ' +
                                                    this.androidPermissions.PERMISSION.MODIFY_AUDIO_SETTINGS +
                                                    ' failed',
                                                );
                                                reject(err);
                                            });
                                    })
                                    .catch((err) => {
                                        console.error(
                                            'Checking permission ' + this.androidPermissions.PERMISSION.RECORD_AUDIO + ' failed',
                                        );
                                        reject(err);
                                    });
                            })
                            .catch((err) => {
                                console.error('Checking permission ' + this.androidPermissions.PERMISSION.CAMERA + ' failed');
                                reject(err);
                            });
                    })
                    .catch((err) => console.error('Error requesting permissions: ', err));
            });
        });
    }

    private connectWebCam(): void {
        this.OVPublisher = this.OV.initPublisher(undefined, {
            audioSource: undefined,
            videoSource: undefined,
            publishAudio: true,
            publishVideo: true,
            resolution: '640x480',
            frameRate: 30,
            insertMode: 'APPEND',
            mirror: true,
        });
    }

    private publish() {
        this.OVPublisher.on('streamCreated', (event: StreamEvent) => {
            console.warn('OpenVidu stream created by Publisher: ', event.stream);
            const streamManager: StreamManager = event.stream.streamManager;

            if (JSON.parse(streamManager.stream.connection.data).isTeacher) {
                this.teacherStream = streamManager;
            } else {
                this.extraStreamManager = this.teacherStream;
            }
            this.mainStreamManager = streamManager;
        });
        this.OVPublisher.on('videoElementCreated', (event: VideoElementEvent) => {
            console.warn('OpenVidu video element created by Publisher: ', event.element);
        });

        this.session.publish(this.OVPublisher).then (() => {
            this.joinSession.emit();
        });

        this.OVPublisher.on('streamPlaying', () => {
            this.openviduLayout.updateLayout();
            this.refreshVideos();
            (<HTMLElement>this.mainStreamManager.videos[0].video).parentElement.classList.remove('custom-class');
        });
    }

    private unpublish() {
        this.session.unpublish(this.OVPublisher);
        this.updateLayout();
        this.refreshVideos();
    }

    private updateLayout() {
        this.resizeTimeout = setTimeout(() => {
            this.openviduLayout.updateLayout();
        }, 20);
        this.refreshVideos();
    }

    private async openAlertError(message: string) {
        const alert = await this.alertController.create({
            header: 'Error occurred!',
            subHeader: 'There was an error connecting to the session:',
            message: message,
            buttons: ['OK'],
        });

        await alert.present();
    }

    refreshVideos() {
        if (this.platform.is('ios') && this.platform.is('cordova')) {
            cordova.plugins.iosrtc.refreshVideos();
        }
    }
}

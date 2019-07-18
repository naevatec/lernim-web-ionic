import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { OpenVidu, Publisher, Session, SignalOptions, VideoElementEvent, StreamEvent,
  ConnectionEvent, Connection, StreamManager, SignalEvent } from 'openvidu-browser';
import { DialogErrorComponent } from '../shared/components/dialog-error/dialog-error.component';
import { OpenViduLayout, OpenViduLayoutOptions } from '../shared/layout/openvidu-layout';
import { UserModel } from '../shared/models/user-model';
import { UserMiniature } from  '../shared/models/user-miniature';
import { InterventionAskedPipe } from '../shared/pipes/intervention-asked';
import { OpenViduService } from '../shared/services/open-vidu.service';
import { ChatComponent } from '../shared/components/chat/chat.component';

@Component({
  selector: 'app-video-room',
  templateUrl: './video-room.component.html',
  styleUrls: ['./video-room.component.css'],
  providers: [InterventionAskedPipe]
})
export class VideoRoomComponent implements OnInit, OnDestroy {

  // webComponent's inputs and outputs
  @Input() sessionName: string;
  @Input() user: string;
  @Input() openviduServerUrl: string;
  @Input() openviduSecret: string;
  @Input() token: string;
  @Input() roleTeacher: boolean;
  @Input() theme: string;
  @Output() joinSession = new EventEmitter<any>();
  @Output() leaveSession = new EventEmitter<any>();
  @Output() error = new EventEmitter<any>();

  @ViewChild('chatComponent') chatComponent: ChatComponent;

  // Constants
  BIG_ELEMENT_CLASS = 'OV_big';

  // Variables
  compact = false;
  messageReceived = false;
  lightTheme: boolean;
  chatDisplay: 'none' | 'block' = 'none';
  showDialogExtension = false;
  bigElement: HTMLElement;

  // OpenVidu Objets
  OV: OpenVidu;
  session: Session;
  miniSession: Session;
  openviduLayout: OpenViduLayout;
  openviduLayoutOptions: OpenViduLayoutOptions;
  miniatureStream: StreamManager;
  mainStreamManager: StreamManager;
  extraStreamManager: StreamManager;
  teacherStream: StreamManager;
  teacherConnection: Connection;
  OVConnections: Connection[] = [];
  OVPublisher: Publisher;
  miniPublisher: Publisher;
  userChat: UserModel;
  usersMiniatures: UserMiniature[] = [];

  // Join form
  mySessionId: string;
  myUserName: string;
  role: string;

  // Updated by click event
  usersData: UserModel[] = [];
  teacher = false;
  student = false;
  interventionRequired = false;
  studentAccessGranted = false;
  myStudentAccessGranted = false;
  messageList: { connectionId: string; userName: string; message: string }[] = [];
  resizeTimeout;
  mutedAudiomain = false;
  publishAudio = true;
  screenShareActive = false;

  // Icons
  interventionIcon = 'record_voice_over';
  fullscreenIcon = 'fullscreen';
  publishAudioIcon = 'mic';

  constructor(
    private openViduSrv: OpenViduService,
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog,
  ) {}

  @HostListener('window:beforeunload')
  beforeunloadHandler() {
    this.exitSession();
  }

  @HostListener('window:resize', ['$event'])
  sizeChange(event) {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.openviduLayout.updateLayout();
    }, 20);
    this.checkSizeComponent();
  }

  // @HostListener('window:resize', ['$event'])
  // onResize() {
  //   this.openviduLayout.updateLayout();
  // }


  ngOnInit() {
    this.generateParticipantInfo();
    this.checkTheme();
    this.joinToSession();
    this.openviduLayout = new OpenViduLayout();
    this.openviduLayoutOptions = {
      maxRatio: 3 / 2, // The narrowest ratio that will be used (default 2x3)
      minRatio: 9 / 16, // The widest ratio that will be used (default 16x9)
      fixedRatio: true /* If this is true then the aspect ratio of the video is maintained
      and minRatio and maxRatio are ignored (default false) */,
      bigClass: this.BIG_ELEMENT_CLASS, // The class to add to elements that should be sized bigger
      bigPercentage: 0.8, // The maximum percentage of space the big ones should take up
      bigFixedRatio: true, // fixedRatio for the big ones
      bigMaxRatio: 3 / 2, // The narrowest ratio to use for the big elements (default 2x3)
      bigMinRatio: 9 / 16, // The widest ratio to use for the big elements (default 16x9)
      bigFirst: true, // Whether to place the big one in the top left (true) or bottom right
      animate: true, // Whether you want to animate the transitions
    };
    this.openviduLayout.initLayoutContainer(document.getElementById('layout'), this.openviduLayoutOptions);
    this.openviduLayout.updateLayout();
  }

  ngOnDestroy() {
    this.exitSession();
  }

  toggleChat(property: 'none' | 'block') {
    if (property) {
      this.chatDisplay = property;
    } else {
      this.chatDisplay = this.chatDisplay === 'none' ? 'block' : 'none';
    }
    if (this.chatDisplay === 'block') {
      this.messageReceived = false;
    }
    setTimeout(() => this.openviduLayout.updateLayout(), 20);
  }

  checkNotification() {
    this.messageReceived = this.chatDisplay === 'none';
  }

  joinToSession() {
    this.OV = new OpenVidu();
    this.session = this.OV.initSession();
    if (this.role !== 'TEACHER')
    	this.miniSession = this.OV.initSession ();
    else
    	this.miniSession = null;
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
    this.screenShareActive = false;
    this.router.navigate(['']);
    this.leaveSession.emit();
  }


  micStatusChanged(): void {
    (<Publisher>this.mainStreamManager).publishAudio(!this.publishAudio);
    this.sendSignalUserChanged({ isAudioActive: !this.publishAudio });
  }

  private sendSignalUserChanged(data: any): void {
    const signalOptions: SignalOptions = {
      data: JSON.stringify(data),
      type: 'userChanged',
    };
    this.session.signal(signalOptions);
  }

  private subscribeToUserChanged() {
    this.session.on('signal:userChanged', (event: any) => {
      this.usersData.forEach((user: UserModel) => {
          const data = JSON.parse(event.data);
          if (data.isAudioActive !== undefined) {
            this.publishAudio = data.isAudioActive;
          }
          if (data.isScreenShareActive !== undefined) {
            this.screenShareActive = data.isScreenShareActive;
            if (this.screenShareActive === true) {
              this.checkSomeoneShareScreen();
            }
          }
      });
    });
  }

  screenShareDisabled(): void {
    this.session.unpublish(<Publisher>this.mainStreamManager);
    this.connectWebCam();
    this.publish();
    this.screenShareActive = false;
  }

  screenShare() {
    const videoSource = navigator.userAgent.indexOf('Firefox') !== -1 ? 'window' : 'screen';
    const publisher = this.OV.initPublisher(undefined, {
        videoSource: videoSource,
        publishAudio: true,
        publishVideo: true,
        mirror: false,
      },
      (error) => {
        if (error && error.name === 'SCREEN_EXTENSION_NOT_INSTALLED') {
          this.toggleDialogExtension();
        } else if (error && error.name === 'SCREEN_SHARING_NOT_SUPPORTED') {
          alert('Your browser does not support screen sharing');
        } else if (error && error.name === 'SCREEN_EXTENSION_DISABLED') {
          alert('You need to enable screen sharing extension');
        } else if (error && error.name === 'SCREEN_CAPTURE_DENIED') {
          alert('You need to choose a window or application to share');
        }
      }
    );

    publisher.once('accessAllowed', () => {
      this.session.unpublish(<Publisher>this.mainStreamManager);
      this.mainStreamManager = publisher;
      this.session.publish(<Publisher>this.mainStreamManager).then(() => {
        this.screenShareActive = true;
        this.sendSignalUserChanged({ isScreenShareActive: this.screenShareActive });
      });
    });

    publisher.on('streamPlaying', () => {
      this.openviduLayout.updateLayout();
      (<HTMLElement>publisher.videos[0].video).parentElement.classList.remove('custom-class');
    });
  }

  toggleFullscreen() {
    const document: any = window.document;
    const fs = document.getElementById('videoRoomNavBar');
    if (!document.fullscreenElement &&
      !document.mozFullScreenElement &&
      !document.webkitFullscreenElement &&
      !document.msFullscreenElement) {
      console.log('Entering fullscreen');
      this.fullscreenIcon = 'fullscreen_exit';
      if (fs.requestFullscreen) {
        fs.requestFullscreen();
      } else if (fs.msRequestFullscreen) {
        fs.msRequestFullscreen();
      } else if (fs.mozRequestFullScreen) {
        fs.mozRequestFullScreen();
      } else if (fs.webkitRequestFullscreen) {
        fs.webkitRequestFullscreen();
      }
    } else {
      console.log('Exiting fullscreen');
      this.fullscreenIcon = 'fullscreen';
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  toggleDialogExtension() {
    this.showDialogExtension = !this.showDialogExtension;
  }

  checkSizeComponent() {
    if (document.getElementById('layout').offsetWidth <= 700) {
      this.compact = true;
      this.toggleChat('none');
    } else {
      this.compact = false;
    }
  }

  private generateParticipantInfo() {
    this.route.params.subscribe((params: Params) => {
      this.mySessionId = params.roomName !== undefined ? params.roomName : this.sessionName;
      this.myUserName = this.user || 'OpenVidu_User' + Math.floor(Math.random() * 100);
      this.role = localStorage.getItem('role');
      console.log('ROL: ' + this.role);
    });
  }

  private subscribeToStreamCreated() {
    this.session.on('streamCreated', (event: StreamEvent) => {

      const streamManager: StreamManager = event.stream.streamManager;
      if (JSON.parse(streamManager.stream.connection.data).isTeacher) {
        this.session.subscribe(event.stream, undefined);
        this.teacherStream = streamManager;
        if (this.studentAccessGranted) {
            this.extraStreamManager = streamManager;
        } else {
            this.mainStreamManager = streamManager;
        }
      } else {
        if (!(JSON.parse(streamManager.stream.connection.data).isMiniature)) {
	  this.session.subscribe(event.stream, undefined);
          this.mainStreamManager = streamManager;
          this.extraStreamManager = this.teacherStream;
	  this.studentAccessGranted = true;
	} else {
	  if (this.role === 'TEACHER') {
	    this.session.subscribe(event.stream, undefined);

	    // Add student miniature to the array
	    this.usersMiniatures.push({ userName: JSON.parse(streamManager.stream.connection.data).userName, stream: streamManager, streamId: event.stream.streamId}); 
	  }
	}
      }
    });
  }

  private removeMiniature (streamId: string) {
    var i = this.usersMiniatures.length;

    while (i--) {
      if (this.usersMiniatures[i].streamId === streamId) {
	this.usersMiniatures.splice(i,1);
      }
    }
  }

  private subscribedToStreamDestroyed() {
    this.session.on('streamDestroyed', (event: StreamEvent) => {
      console.warn('OpenVidu stream destroyed: ', event.stream);

      const streamManager: StreamManager = event.stream.streamManager;
      if (JSON.parse(streamManager.stream.connection.data).isTeacher) {
        if (this.myStudentAccessGranted) {
            this.unpublish();
        }
        delete this.mainStreamManager;
        delete this.extraStreamManager;
        this.studentAccessGranted = false;
        this.myStudentAccessGranted = false;
        this.interventionRequired = false;
        this.interventionIcon = 'record_voice_over';
      } else  if (this.mainStreamManager.stream.connection.connectionId === streamManager.stream.connection.connectionId) {
        this.studentAccessGranted = false;
        this.mainStreamManager = this.teacherStream;
      }
      if (this.role === 'TEACHER') {
        if (JSON.parse(streamManager.stream.connection.data).isMiniature) {
	  this.removeMiniature (event.stream.streamId);
	}
      }
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

      if (!(JSON.parse(event.connection.data).isMiniature)) {
        this.OVConnections.push(event.connection);

        const uData: UserModel = JSON.parse(event.connection.data);
        this.usersData.push(uData);
      }
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
    if (this.role !== 'TEACHER' || this.roleTeacher === false) {
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
          this.interventionIcon = (this.interventionRequired ? 'voice_over_off' : 'record_voice_over');
        }
      });
    }

    if (this.role === 'TEACHER' || this.roleTeacher === true) {
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
  }

  private subscribedToChat() {
    this.session.on('signal:chat', (event: any) => {
        const data = JSON.parse(event.data);

        this.messageList.push({
            connectionId: event.from.connectionId,
            userName: data.userName,
            message: data.message,
        });
        this.checkNotification();
        this.chatComponent.scrollToBottom();
    });
  }


  private connectToSession(): void {
    if (this.token) {
      this.connect(this.token, this.roleTeacher);
    } else {
      if (this.role === 'TEACHER') {
        this.openViduSrv.getToken(this.mySessionId, this.openviduServerUrl, this.openviduSecret)
        .then((token) => {
          this.session.connect(token, { userName: this.myUserName, isTeacher: true, isMiniature: false })
          .then(() => {
            this.connectWebCam();
            this.publish();
            this.teacher =  true;
          })
          .catch((error) => {
            this.error.emit({ error: error.error, messgae: error.message, code: error.code, status: error.status });
            console.log('There was an error connecting to the session:', error.code, error.message);
            this.openDialogError('There was an error connecting to the session:', error.message);
          });
        })
        .catch((error) => {
          this.error.emit({ error: error.error, messgae: error.message, code: error.code, status: error.status });
          console.log('There was an error getting the token:', error.code, error.message);
          this.openDialogError('There was an error getting the token:', error.message);
        });
      } else {
        this.openViduSrv.getOnlyToken(this.mySessionId, this.openviduServerUrl, this.openviduSecret)
        .then((token) => {
          this.session.connect(token, { userName: this.myUserName, isTeacher: false, isMiniature: false });
	  this.student = true;
	  this.miniSession.connect(token, { userName: this.myUserName, isTeacher: false, isMiniature: true })
	  .then(() => {
	    this.connectMiniatureWebCam();
	    this.publishMiniature();
	  })
	  .catch((error) => {
	    this.error.emit({ error: error.error, messgae: error.message, code: error.code, status: error.status });
	    console.log('There was an error connecting to the session to send miniature:', error.code, error.message);
	     this.openDialogError('There was an error connecting to the session to send miniature:', error.message);
	  });
        })
        .catch((error) => {
          this.error.emit({ error: error.error, messgae: error.message, code: error.code, status: error.status });
          console.log('There was an error getting the token:', error.code, error.message);
          this.openDialogError('The teacher has not opened the lesson yet!', error.message);
        });
      }
    }
  }

  private connect(token: string, roleTeacher: boolean): void {
    if (roleTeacher === true) {
      this.session.connect(token, { userName: this.myUserName, isTeacher: true, isMiniature: false })
      .then(() => {
        this.connectWebCam();
        this.publish();
        this.teacher =  true;
      })
      .catch((error) => {
        this.error.emit({ error: error.error, messgae: error.message, code: error.code, status: error.status });
        console.log('There was an error connecting to the session:', error.code, error.message);
        this.openDialogError('There was an error connecting to the session:', error.message);
      });
    } else {
      this.session.connect(token, { userName: this.myUserName, isTeacher: false, isMiniature: false })
      .then(() => {
        this.student = true;
        this.joinSession.emit();
        this.openviduLayout.updateLayout();
      })
      .catch((error) => {
        this.error.emit({ error: error.error, messgae: error.message, code: error.code, status: error.status });
        console.log('There was an error connecting to the session:', error.code, error.message);
        this.openDialogError('There was an error connecting to the session:', error.message);
      });
    }
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


 private connectMiniatureWebCam(): void {
   this.miniPublisher = this.OV.initPublisher(undefined, {
     audioSource: undefined,
     videoSource: undefined,
     publishAudio: true,
     publishVideo: true,
     resolution: '160x120',
     frameRate: 1,
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
      (<HTMLElement>this.mainStreamManager.videos[0].video).parentElement.classList.remove('custom-class');
    });
  }

  private publishMiniature() {
    this.miniPublisher.on('streamCreated', (event: StreamEvent) => {
      console.warn('OpenVidu miniature stream created by Publisher: ', event.stream);

      const streamManager: StreamManager = event.stream.streamManager;

      if ((JSON.parse(streamManager.stream.connection.data).userName === this.myUserName) &&
          (JSON.parse(streamManager.stream.connection.data).isMiniature)) {
          this.miniatureStream = streamManager;
      }
    });

    this.miniSession.publish(this.miniPublisher);
    this.miniPublisher.on('streamPlaying', () => {
      console.info('OpenVidu miniature published');
    });
  }


  private unpublish() {
    this.session.unpublish(this.OVPublisher);
  }

  private openDialogError(message, messageError: string) {
    this.dialog.open(DialogErrorComponent, {
      width: '450px',
      data: { message: message, messageError: messageError },
    });
  }

  private checkSomeoneShareScreen() {
    let isScreenShared: boolean;
    // return true if at least one passes the test
    isScreenShared = this.screenShareActive;
    this.openviduLayoutOptions.fixedRatio = isScreenShared;
    this.openviduLayout.setLayoutOptions(this.openviduLayoutOptions);
    this.openviduLayout.updateLayout();
  }

  askForIntervention() {
    this.connectWebCam();

    this.OVPublisher.on('accessAllowed', (event) => {
      console.warn('OpenVidu camera access allowed');

      const msg = {
        interventionRequired: !this.interventionRequired
      };

      this.session.signal({
        type: 'askIntervention',
        to: [this.teacherConnection],
        data: JSON.stringify(msg)
      });

      // Invert intervention request
      this.interventionRequired = !this.interventionRequired;
      // Change intervention icon
      this.interventionIcon = (this.interventionRequired ? 'voice_over_off' : 'record_voice_over');

    });

    this.OVPublisher.on('accessDenied', (event) => {
      console.error('OpenVidu camera access denied');
    });
  }

  grantIntervention(grant: boolean, userData: UserModel) {
    this.session.signal({
      type: 'grantIntervention',
      to: this.OVConnections.filter(connection => JSON.parse(connection.data).userName === userData.userName),
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

  private checkTheme() {
    this.lightTheme = this.theme === 'light';
  }

}

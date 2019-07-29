import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material';
import {
  Connection, ConnectionEvent, OpenVidu, Publisher, Session, SignalEvent, SignalOptions, StreamEvent, StreamManager, VideoElementEvent
} from 'openvidu-browser';
import { DialogErrorComponent } from '../shared/components/dialog-error/dialog-error.component';
import { OpenViduLayout, OpenViduLayoutOptions } from '../shared/layout/openvidu-layout';
import { UserModel } from '../shared/models/user-model';
import { UserMiniature } from '../shared/models/user-miniature';
import { InterventionAskedPipe } from '../shared/pipes/intervention-asked';
import { OpenViduService } from '../shared/services/open-vidu.service';
import { ChatComponent } from '../shared/components/chat/chat.component';
import { ChatMessage } from '../shared/models/chat-message';
import { Signals } from '../shared/models/signals';
import Timeout = NodeJS.Timeout;

@Component({
  selector: 'app-video-room-student',
  templateUrl: './video-room-student.component.html',
  styleUrls: ['./video-room-student.component.css'],
  providers: [InterventionAskedPipe]
})
export class VideoRoomStudentComponent implements OnInit, OnDestroy {
  // CONSTANTS ----------------------------------------------------------------

  VIDEO_ELEMENT_CLASS = 'OV_video_element';

  @ViewChild('chatComponent') chatComponent: ChatComponent;
  @ViewChild('layout') layoutElement: ElementRef;
  @ViewChild('videoRoom') videoRoomElement: ElementRef;

  // INPUTS AND OUTPUTS -------------------------------------------------------

  @Input() sessionName: string;
  @Input() userName: string;
  @Input() openviduServerUrl: string;
  @Input() openviduSecret: string;
  @Input() theme: string;
  @Output() joinSession = new EventEmitter<any>();
  @Output() leaveSession = new EventEmitter<any>();
  @Output() error = new EventEmitter<any>();

  // VARIABLES ----------------------------------------------------------------

  compact = false; // Changes the layout to a compact version hiding some elements like the chat.
  lightTheme: boolean;
  resizeTimeouts: Timeout[] = []; // Allows to collide resize events into just one.

  // Teacher
  teacherUser = new UserModel('', true);
  teacherStream: StreamManager;
  isFullScreen = false;

  // Student
  studentUser = new UserModel(this.userName, false);
  studentMiniature = new UserMiniature(this.studentUser, null);
  showMiniature = true;

  // Other students
  usersData: UserMiniature[] = [];

  // OpenVidu Objects
  OV: OpenVidu;
  OVConnections: Connection[] = [];
  OVPublisher: Publisher;
  session: Session;
  openviduLayout: OpenViduLayout;
  openviduLayoutOptions: OpenViduLayoutOptions;

  // Chat
  chatMessageList: ChatMessage[] = [];
  chatMessageReceived = false;
  showChat = false;

  // ScreenSharing
  showDialogToInstallScreenSharingExtension = false;

  /**
   * Gets the connection of the teacher.
   */
  get teacherConnection(): Connection {
    return this.OVConnections.find((c) => c.connectionId === this.teacherUser.connectionId);
  }

  /**
   * Gets a list of UserModel for the chat.
   */
  get chatUserData(): UserModel[] {
    return [this.studentUser].concat(...this.usersData.map((m) => m.user));
  }

  /**
   * Gets the granted users.
   */
  get grantedUsers(): UserMiniature[] {
    return this.usersData.filter((u) => u.user.accessGranted);
  }

  // CONSTRUCTORS -------------------------------------------------------------

  constructor(private openViduSrv: OpenViduService, public dialog: MatDialog) {
    console.log('JULS this', this);
  }

  // WINDOW EVENTS ------------------------------------------------------------

  @HostListener('window:beforeunload') beforeunloadHandler() {
    this.exitSession();
  }

  @HostListener('window:resize', ['$event']) sizeChange() {
    this.updateLayout(false);
    this.checkComponentSize();
  }

  // METHODS ------------------------------------------------------------------

  ngOnInit() {
    this.joinToSession();

    // Updates the layout.
    this.lightTheme = (this.theme === 'light');
    this.openviduLayout = new OpenViduLayout();
    this.openviduLayoutOptions = {
      elementClass: this.VIDEO_ELEMENT_CLASS, // The class attached to the video elements.
      fillColumnsFirst: false, // Tries to fill the columns first and then the rows.
      animate: true // Whether you want to animate the transitions.
    };
    this.openviduLayout.initLayoutContainer(this.layoutElement.nativeElement, this.openviduLayoutOptions);
    this.updateLayout(true);
  }

  ngOnDestroy() {
    this.exitSession();
  }

  exitSession() {
    if (this.session) {
      this.session.disconnect();
    }
    this.session = null;
    this.OV = null;
    this.teacherUser.reset();
    this.studentUser.reset();
    this.leaveSession.emit();
  }

  joinToSession() {
    this.OV = new OpenVidu();
    this.session = this.OV.initSession();

    console.log('JULS - joinToSession INIT');

    this.subscribeToConnectionCreated();
    this.subscribeToConnectionDestroyed();
    this.subscribeToStreamCreated();
    this.subscribeToStreamDestroyed();

    // Subscribe to custom signals.

    this.subscribeToStudentChanged();
    this.subscribeToTeacherChanged();
    this.subscribeToInterventionSignals();
    this.subscribedToChat();

    this.connectToSession();

    this.joinSession.emit();

    console.log('JULS - joinToSession END');
  }

  private subscribeToConnectionCreated(): void {
    this.session.on('connectionCreated', (event: ConnectionEvent) => {
      const userData: UserModel = JSON.parse(event.connection.data);

      console.log('JULS signal:connectionCreated', userData);

      // If it is my connection.
      if (userData.userName === this.userName) {
        console.log('YOUR OWN CONNECTION CREATED!');
        console.log('Connection DATA: ', event.connection.data);

        this.studentUser.userName = userData.userName;
        this.studentUser.isConnected = true;
        this.studentUser.publishingAudio = false;
        this.studentUser.publishingVideo = false;
        this.studentUser.connectionId = event.connection.connectionId;
      } else if (userData.isTeacher) {
        // If it is the teacher
        console.log('TEACHER CONNECTION CREATED!');
        console.log('Connection DATA: ', event.connection.data);

        this.teacherUser.userName = userData.userName;
        this.teacherUser.isConnected = true;
        this.teacherUser.publishingAudio = true;
        this.teacherUser.publishingVideo = true;
        this.teacherUser.connectionId = event.connection.connectionId;

        // Emit a studentChanged event to the new connection to initiate the state correctly.
        setTimeout(() => this.sendSignal(Signals.STUDENT_CHANGED, this.studentUser, event.connection), 200);
      } else {
        console.log('OTHER USER\'S CONNECTION CREATED!');
        console.log('Connection DATA: ', event.connection.data);

        const miniature = this.getOrAddUserData(userData.userName);
        miniature.user.isConnected = true;

        // Emit a studentChanged event to the new connection to initiate the state correctly.
        setTimeout(() => this.sendSignal(Signals.STUDENT_CHANGED, this.studentUser, event.connection), 200);
      }

      this.updateLayout(false);

      this.OVConnections.push(event.connection);
    });

  }

  private subscribeToConnectionDestroyed(): void {
    this.session.on('connectionDestroyed', (event: ConnectionEvent) => {
      const userData: UserModel = JSON.parse(event.connection.data);

      console.log('JULS signal:connectionDestroyed', userData);
      console.log('OTHER USER\'S CONNECTION DESTROYED!');

      if (userData.isTeacher) {
        this.teacherUser.reset();
        this.teacherUser.isConnected = false;
        this.teacherStream = null;

        this.studentUser.accessGranted = false;
        this.studentUser.interventionRequired = false;

        this.sendSignal(Signals.STUDENT_CHANGED, this.studentUser);

        this.updateLayout(true);
        return;
      }

      // Remove Connection
      const i1 = this.OVConnections.indexOf(event.connection);
      if (i1 >= 0) {
        this.OVConnections.splice(i1, 1);
      }

      // Reset UserData.
      if (userData.isTeacher) {
        this.teacherUser.reset();
      } else {
        const aux = this.usersData.find((m) => (m.user.userName === userData.userName));
        aux.reset();
      }

      this.updateLayout(false);
    });
  }

  /**
   * Subscribes to the streams depending on what kind of user you are.
   */
  private subscribeToStreamCreated(): void {
    this.session.on('streamCreated', (event: StreamEvent) => {
      this.session.subscribe(event.stream, undefined);
      const streamManager: StreamManager = event.stream.streamManager;
      const userData: UserModel = JSON.parse(streamManager.stream.connection.data);

      console.log('JULS signal:streamCreated', userData);

      // Teacher
      if (userData.isTeacher) {
        this.teacherStream = streamManager;
        return;
      }

      // The current student is not called here. See publish().

      // Other students
      const miniature = this.getOrAddUserData(userData.userName);
      miniature.stream = streamManager;
    });
  }

  /**
   * Destroys the streams whenever they died.
   */
  private subscribeToStreamDestroyed() {
    this.session.on('streamDestroyed', (event: StreamEvent) => {
      const streamManager: StreamManager = event.stream.streamManager;
      const userData: UserModel = JSON.parse(streamManager.stream.connection.data);

      console.log('JULS signal:streamDestroyed', userData);
      console.log('OpenVidu stream destroyed: ', event.stream);

      // Teacher
      if (userData.isTeacher) {
        this.teacherStream = null;
      } else {
        // Other students
        this.usersData.forEach((miniature: UserMiniature) => {
          if (miniature.user.userName === userData.userName) {
            miniature.stream = null;
          }
        });
      }

      this.updateLayout(false);
    });
  }

  /**
   * Subscribes to the studentChanged signal to update the information of the users.
   */
  private subscribeToStudentChanged(): void {
    this.session.on('signal:' + Signals.STUDENT_CHANGED, (event: any) => {
      const data: UserModel = JSON.parse(event.data);

      if (data.userName === this.studentUser.userName) {
        console.log('JULS ignore signal:studentChanged because its me', data);
        return;
      }

      console.log('JULS signal:studentChanged', event, data);

      this.usersData.forEach((miniature: UserMiniature) => {
        if (miniature.user.userName === data.userName) {
          // tslint:disable-next-line:forin
          for (const property in data) {
            miniature.user[property] = data[property];

            // If the student is publishing his screen updates the aspect ration.
            if (property === 'isSharedScreenActive') {
              this.updateLayout(false);
            }
          }
        }
      });
    });
  }

  /**
   * Subscribes to the teacherChanged signal to update the information of the teacher.
   */
  private subscribeToTeacherChanged(): void {
    this.session.on('signal:' + Signals.TEACHER_CHANGED, (event: any) => {
      console.log('JULS signal:teacherChanged INIT');

      const data: UserModel = JSON.parse(event.data);

      console.log('JULS signal:teacherChanged', data);

      // tslint:disable-next-line:forin
      for (const property in data) {
        this.teacherUser[property] = data[property];

        // If the student is publishing his screen updates the aspect ration.
        if (property === 'isSharedScreenActive') {
          this.updateLayout(false);
        }
      }
    });
  }

  /**
   * Receives the messages of the chat.
   */
  private subscribedToChat() {
    this.session.on('signal:' + Signals.CHAT, (event: any) => {
      const data = JSON.parse(event.data);

      console.log('JULS signal:chat', data);

      if (this.teacherUser.isConnected) {
        this.chatMessageList.push(new ChatMessage(event.from.connectionId, data.userName, data.message));
      }

      this.chatMessageReceived = !this.showChat;
      this.chatComponent.scrollToBottom();
    });
  }

  /**
   * Initiates the connection with the server.
   */
  private connectToSession(): void {
    this.openViduSrv.getOnlyToken(this.sessionName, this.openviduServerUrl, this.openviduSecret)
    .then((token) => {
      this.session.connect(token, {
        userName: this.userName,
        isTeacher: false
      })
      .then(() => {
        this.publishMiniatureWebCam();
      })
      .catch((error) => {
        this.error.emit({
          error: error.error,
          message: error.message,
          code: error.code,
          status: error.status
        });

        console.log('There was an error connecting to the session:', error.code, error.message);
        this.openDialogError('There was an error connecting to the session:', error.message);
      });
    })
    .catch((error) => {
      this.error.emit({
        error: error.error,
        message: error.message,
        code: error.code,
        status: error.status
      });

      console.log('There was an error getting the token:', error.code, error.message);
      this.openDialogError('There was an error getting the token:', error.message);
    });
  }

  // PUBLISHERS ---------------------------------------------------------------

  /**
   * Publish the normal video from the web camera.
   */
  private publishWebCam(): void {
    if (this.OVPublisher) {
      this.unpublish();
    }

    this.OVPublisher = this.OV.initPublisher(undefined, {
      audioSource: undefined,
      videoSource: undefined,
      publishAudio: this.studentUser.publishingAudio,
      publishVideo: this.studentUser.publishingVideo,
      resolution: '640x480',
      frameRate: 30,
      insertMode: 'APPEND',
      mirror: true
    });

    this.publish();
  }

  /**
   * Publish a miniature from the web camera.
   */
  private publishMiniatureWebCam(): void {
    if (this.OVPublisher) {
      this.unpublish();
    }

    this.OVPublisher = this.OV.initPublisher(undefined, {
      audioSource: undefined,
      videoSource: undefined,
      publishAudio: this.studentUser.publishingAudio,
      publishVideo: this.studentUser.publishingVideo,
      resolution: '160x120',
      frameRate: 1,
      insertMode: 'APPEND',
      mirror: true
    });

    this.publish();
  }

  private publish() {
    this.OVPublisher.on('streamCreated', (event: StreamEvent) => {
      console.log('OpenVidu stream created by Publisher: ', event.stream);
      console.log('JULS signal:streamCreated - OWN');

      this.studentMiniature.stream = event.stream.streamManager;

      this.updateLayout(false);
    });

    this.OVPublisher.on('videoElementCreated', (event: VideoElementEvent) => {
      console.log('OpenVidu video element created by Publisher: ', event.element);

      this.updateLayout(false);
    });

    this.OVPublisher.on('streamPlaying', () => {
      console.log('JULS signal:streamPlaying - OWN');

      this.updateLayout(false);
      this.updateLayout(false);
    });

    this.session.publish(this.OVPublisher);
  }

  /**
   * Unpublish the output.
   */
  private unpublish() {
    console.log('JULS unpublish');
    this.session.unpublish(<Publisher>this.studentMiniature.stream);
  }

  private openDialogError(message, messageError: string) {
    this.dialog.open(DialogErrorComponent, {
      width: '450px',
      data: {
        message: message,
        messageError: messageError
      }
    });
  }

  /**
   * Subscribes the user to the intervention signals.
   */
  private subscribeToInterventionSignals() {
    this.session.on('signal:' + Signals.GRANT_INTERVENTION, (msg: SignalEvent) => {
      const data = JSON.parse(msg.data);

      console.log('JULS signal:grantIntervention', data);

      if (data.userName === this.studentUser.userName) {
        // Its me
        this.studentUser.interventionRequired = false;
        this.studentUser.accessGranted = data.granted;

        // Change the publishing type depending on the state.
        if (!this.studentUser.isSharedScreenActive) {
          if (data.granted) {
            this.publishWebCam();
          } else {
            this.publishMiniatureWebCam();
          }
        }
      } else {
        // Its other
        const userData = this.getOrAddUserData(data.userName);
        userData.user.interventionRequired = false;
        userData.user.accessGranted = data.granted;
      }
    });
  }

  // VIEW EVENTS --------------------------------------------------------------

  /**
   * Event to react to the microphone button.
   */
  toggleMicrophone(): void {
    this.studentUser.publishingAudio = !this.studentUser.publishingAudio;
    console.log('JULS toggleMicrophone', this.studentUser.publishingAudio);

    if (this.studentMiniature.stream) {
      (<Publisher>this.studentMiniature.stream).publishAudio(this.studentUser.publishingAudio);
    }

    // Send signal.
    this.sendSignal(Signals.STUDENT_CHANGED, {
      userName: this.userName,
      publishingAudio: this.studentUser.publishingAudio
    });
  }

  /**
   * Event to react to the camera button.
   */
  toggleCamera(): void {
    this.studentUser.publishingVideo = !this.studentUser.publishingVideo;
    console.log('JULS toggleCamera', this.studentUser.publishingVideo);

    if (this.studentMiniature.stream) {
      (<Publisher>this.studentMiniature.stream).publishVideo(this.studentUser.publishingVideo);
      this.updateLayout(false);
    }

    // Send signal.
    this.sendSignal(Signals.STUDENT_CHANGED, {
      userName: this.userName,
      publishingVideo: this.studentUser.publishingVideo
    });
  }

  /**
   *  Event to react to miniature selection.
   */
  onMiniatureResize(user: UserMiniature) {
    this.updateLayout(true);
  }

  /**
   * Event to react to the intervention button.
   */
  toggleInterventionRequest() {
    this.studentUser.interventionRequired = !this.studentUser.interventionRequired;

    this.sendSignal(Signals.ASK_INTERVENTION, {
      userName: this.userName,
      required: this.studentUser.interventionRequired
    }, this.teacherConnection);
  }

  /**
   * Event to react to the start sharing screen button.
   */
  shareScreen() {
    const videoSource = navigator.userAgent.indexOf('Firefox') !== -1 ? 'window' : 'screen';
    const publisher = this.OV.initPublisher(undefined, {
      videoSource: videoSource,
      publishAudio: this.studentUser.publishingAudio,
      publishVideo: true,
      mirror: false
    }, (error) => {
      if (error && error.name === 'SCREEN_EXTENSION_NOT_INSTALLED') {
        this.toggleInstallScreenSharingExtensionDialog();
      } else if (error && error.name === 'SCREEN_SHARING_NOT_SUPPORTED') {
        alert('Your browser does not support screen sharing');
      } else if (error && error.name === 'SCREEN_EXTENSION_DISABLED') {
        alert('You need to enable screen sharing extension');
      } else if (error && error.name === 'SCREEN_CAPTURE_DENIED') {
        alert('You need to choose a window or application to share');
      }
    });

    publisher.once('accessAllowed', () => {
      if (this.OVPublisher) {
        this.unpublish();
      }

      this.studentMiniature.stream = publisher;
      this.session.publish(<Publisher>this.studentMiniature.stream).then(() => {
        console.log('JULS - screenShared - accessAllowed');

        // Emit a signal.
        this.studentUser.isSharedScreenActive = true;
        this.studentUser.publishingVideo = true;
        this.sendSignal(Signals.STUDENT_CHANGED, {
          userName: this.userName,
          isSharedScreenActive: true,
          publishingVideo: true
        });
      });

      this.updateLayout(false);
    });

    publisher.on('streamPlaying', () => {
      console.log('JULS - screenShared - streamPlaying');
      this.updateLayout(true);
    });
  }

  /**
   * Event to react to the stop sharing screen button.
   */
  stopSharingScreen(): void {
    if (this.studentUser.accessGranted) {
      this.publishWebCam();
    } else {
      this.publishMiniatureWebCam();
    }
    this.studentUser.isSharedScreenActive = false;

    // Emit a signal.
    this.sendSignal(Signals.STUDENT_CHANGED, {
      userName: this.userName,
      isSharedScreenActive: false
    });

    this.updateLayout(false);
  }

  /**
   * Shows the dialog that helps the user to install the extension.
   */
  toggleInstallScreenSharingExtensionDialog() {
    this.showDialogToInstallScreenSharingExtension = !this.showDialogToInstallScreenSharingExtension;
  }

  /**
   * Event to react to the fullscreen button.
   */
  toggleFullscreen() {
    const document: any = window.document;
    const fs = this.videoRoomElement.nativeElement;

    // Changes the fullscreen value depending on the browser.
    if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement &&
      !document.msFullscreenElement) {
      console.log('Entering fullscreen');
      this.isFullScreen = true;

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
      this.isFullScreen = false;

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

  /**
   * Toggles the miniature visibility.
   */
  toggleShowMiniature() {
    this.showMiniature = !this.showMiniature;
    this.updateLayout(false);
  }

  /**
   * Toggles the chat or sets its state and updates its layout.
   */
  toggleChat(showChat?: boolean) {
    if (showChat !== undefined) {
      // Avoid to update if the new value is the same than the previous.
      if (this.showChat === showChat) {
        return;
      }

      this.showChat = showChat;
    } else {
      this.showChat = !this.showChat;
    }

    if (this.showChat) {
      this.chatMessageReceived = false;
    }

    this.updateLayout(false);
  }

  // AUX METHODS --------------------------------------------------------------

  /**
   * Sends a signal to all users.
   */
  private sendSignal(signal: string, data: any, to?: Connection): void {
    const signalOptions: SignalOptions = {
      data: JSON.stringify(data),
      type: signal
    };

    if (to !== undefined) {
      signalOptions.to = [to];
    }

    this.session.signal(signalOptions);
  }

  /**
   * Updates the layout collapsing many calls into just one.
   */
  private updateLayout(immediately: boolean): void {
    // Avoid to resize a lot of times.
    this.resizeTimeouts.forEach((tOut) => {
      clearTimeout(tOut);
    });

    if (immediately) {
      // Three times to ensure the layout is correctly resized.
      setTimeout(() => {
        this.openviduLayout.updateLayout();
      }, 20);
      setTimeout(() => {
        this.openviduLayout.updateLayout();
      }, 200);
      setTimeout(() => {
        this.openviduLayout.updateLayout();
      }, 2000);
    } else {
      // Three times to ensure the layout is correctly resized.
      this.resizeTimeouts[0] = setTimeout(() => {
        this.openviduLayout.updateLayout();
      }, 20);
      this.resizeTimeouts[1] = setTimeout(() => {
        this.openviduLayout.updateLayout();
      }, 20);
      this.resizeTimeouts[2] = setTimeout(() => {
        this.openviduLayout.updateLayout();
      }, 20);
    }
  }

  /**
   * Changes between normal and compact depending on the size of the container element.
   */
  private checkComponentSize() {
    if (this.layoutElement.nativeElement.offsetWidth <= 700) {
      this.compact = true;
      this.toggleChat(false);
    } else {
      this.compact = false;
    }
  }

  /**
   * Gets an GrantedUser or creates it.
   */
  private getOrAddUserData(userName: string): UserMiniature {
    let userData = this.usersData.find((user) => (user.user.userName === userName));

    if (!userData) {
      userData = new UserMiniature(new UserModel(userName, false), null);
      this.usersData.push(userData);
    }

    return userData;
  }
}

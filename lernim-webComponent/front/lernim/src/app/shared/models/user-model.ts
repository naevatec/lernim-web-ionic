export class UserModel {
  // Generic
  public userName: string;
  public isTeacher: boolean;
  public isConnected = false;

  // Status
  public publishingVideo = false;
  public publishingAudio = false;
  public isSharedScreenActive = false;
  public interventionRequired = false;
  public accessGranted = false;

  // For chat
  public connectionId: string;

  constructor(userName: string, isTeacher: boolean) {
    this.userName = userName;
    this.isTeacher = isTeacher;
  }

  /**
   * Reset the object to its default values. It does not replace userName nor isTeacher.
   */
  public reset(): void {
    this.isConnected = false;

    this.publishingVideo = false;
    this.publishingAudio = false;
    this.isSharedScreenActive = false;
    this.interventionRequired = false;
    this.accessGranted = false;

    this.connectionId = null;
  }
}

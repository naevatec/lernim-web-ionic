import { StreamManager } from 'openvidu-browser';
import { UserModel } from './user-model';

export class UserMiniature {

  public user: UserModel;
  public stream: StreamManager;
  public muted = true;
  public expanded = false;


  constructor(user: UserModel, stream: StreamManager) {
    this.user = user;
    this.stream = stream;
  }

  /**
   * Reset the object to its default values. It does not replace userName nor isTeacher.
   */
  public reset(): void {
    this.user.reset();

    this.stream = null;
    this.muted = true;
    this.expanded = false;
  }
}

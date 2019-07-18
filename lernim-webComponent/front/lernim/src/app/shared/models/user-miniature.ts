import { StreamManager } from 'openvidu-browser';
  
export class UserMiniature {

  public userName: string;
  public stream: StreamManager;
  public streamId: string;

  constructor(userName: string, stream: StreamManager, streamId: string) {
      this.userName = userName;
      this.stream = stream;
      this.streamId = streamId;

  }
}

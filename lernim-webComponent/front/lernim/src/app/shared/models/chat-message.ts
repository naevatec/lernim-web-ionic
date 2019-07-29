export class ChatMessage {

  public connectionId: string;
  public userName: string;
  public message: string;
  public userAvatar: string;

  constructor(connectionId: string, userName: string, message: string) {
    this.connectionId = connectionId;
    this.userName = userName;
    this.message = message;
  }
}

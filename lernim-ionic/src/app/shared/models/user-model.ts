export class UserModel {

    public connectionId: string;
    public userName: string;
    public isTeacher: boolean;
    public interventionRequired = false;
    public accessGranted = false;

    constructor(userName: string, isTeacher: boolean) {
        this.userName = userName;
        this.isTeacher = isTeacher;
    }
  }

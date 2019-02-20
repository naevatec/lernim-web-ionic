import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.page.html',
    styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
    mySessionId: string;
    myUserName: string;
    teacher: string;

    constructor(private router: Router) {}

    ngOnInit() {}

    join(): void {
        if (this.mySessionId) {
            this.mySessionId = this.mySessionId.replace(/ +(?= )/g, '');
            if (this.mySessionId !== '' && this.mySessionId !== ' ') {
                console.log(this.mySessionId === ' ');
                localStorage.setItem('mySessionId', this.mySessionId);
                localStorage.setItem('myUserName', this.myUserName);
                localStorage.setItem('isTeacher', this.teacher);
                this.router.navigate(['/' + this.mySessionId]);
            }
        }
    }

    updateCheckBox() {
        this.teacher = this.teacher;
    }
}

import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-miniature',
  templateUrl: './miniature.component.html',
  styleUrls: ['./miniature.component.css']
})
export class MiniatureComponent {
  @Input() amITeacher: Boolean;
  @Input() students: Array<any>;
}

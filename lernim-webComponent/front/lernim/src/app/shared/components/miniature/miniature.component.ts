import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserMiniature } from '../../models/user-miniature';
import { UserModel } from '../../models/user-model';

@Component({
  selector: 'app-miniature',
  templateUrl: './miniature.component.html',
  styleUrls: ['./miniature.component.css']
})
export class MiniatureComponent {
  @Input() students: UserMiniature[];
  @Input() hideActions: boolean;
  @Input() canGrantAccess: boolean;

  @Output() miniatureResize = new EventEmitter<UserMiniature>();
  @Output() grantAccess = new EventEmitter<UserModel>();

  // VIEW EVENTS --------------------------------------------------------------

  /**
   * Toggles the expansion of a miniature.
   */
  toggleExpansion(student: UserMiniature) {
    student.expanded = !student.expanded;
    this.miniatureResize.emit(student);
  }

  /**
   * Toggles the mute of a miniature.
   */
  toggleMute(student: UserMiniature) {
    student.muted = !student.muted;
  }

  /**
   * Toggles the mute of a miniature.
   */
  toggleGrantAccess(student: UserMiniature) {
    if (this.canGrantAccess || this.grantAccess) {
      this.grantAccess.emit(student.user);
    }
  }

  // METHODS ------------------------------------------------------------------

}

import { BrowserModule } from '@angular/platform-browser';
import { Injector, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  MatBadgeModule,
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatDialogModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatToolbarModule,
  MatTooltipModule
} from '@angular/material';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './/app-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { OpenViduService } from './shared/services/open-vidu.service';
import { StreamComponent } from './shared/components/stream/stream.component';
import { HttpClientModule } from '@angular/common/http';
import { ChatComponent } from './shared/components/chat/chat.component';
import { DialogExtensionComponent } from './shared/components/dialog-extension/dialog-extension.component';
import { OpenViduVideoComponent } from './shared/components/stream/ov-video.component';
import { createCustomElement } from '@angular/elements';
import { DialogErrorComponent } from './shared/components/dialog-error/dialog-error.component';
import { WebComponentComponent } from './web-component/web-component.component';
import { ElementZoneStrategyFactory } from 'elements-zone-strategy';
import { LinkifyPipe } from './shared/pipes/linkfy';
import { NgxLinkifyjsModule } from 'ngx-linkifyjs';
import { InterventionAskedPipe } from './shared/pipes/intervention-asked';
import { MiniatureComponent } from './shared/components/miniature/miniature.component';
import { VideoRoomTeacherComponent } from './video-room-teacher/video-room-teacher.component';
import { VideoRoomSwitchComponent } from './video-room-switch/video-room-switch.component';
import { VideoRoomStudentComponent } from './video-room-student/video-room-student.component';

@NgModule({
  declarations: [AppComponent,
    VideoRoomStudentComponent,
    VideoRoomTeacherComponent,
    DashboardComponent,
    VideoRoomSwitchComponent,
    StreamComponent,
    ChatComponent,
    MiniatureComponent,
    DialogExtensionComponent,
    OpenViduVideoComponent,
    DialogErrorComponent,
    WebComponentComponent,
    LinkifyPipe,
    InterventionAskedPipe],
  imports: [FormsModule,
    ReactiveFormsModule,
    BrowserModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatTooltipModule,
    MatBadgeModule,
    AppRoutingModule,
    HttpClientModule,
    NgxLinkifyjsModule.forRoot(),
    MatCheckboxModule],
  entryComponents: [DialogErrorComponent, WebComponentComponent],
  providers: [OpenViduService],
  bootstrap: [AppComponent]
})
export class AppModule {

  constructor(private injector: Injector) {
    const strategyFactory = new ElementZoneStrategyFactory(WebComponentComponent, this.injector);
    const element = createCustomElement(WebComponentComponent, {
      injector: this.injector,
      strategyFactory
    });
    customElements.define('openvidu-teaching-webcomponent', element);
  }

  ngDoBootstrap() {
  }
}

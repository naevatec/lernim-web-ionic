import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { VideoRoomPage } from './video-room.page';
import { StreamComponent } from '../shared/components/stream/stream.component';
import { OpenViduVideoComponent } from '../shared/components/stream/ov-video.component';
import { ChatComponent } from '../shared/components/chat/chat.component';
import { LinkifyPipe } from '../shared/pipes/linkfy';
import { NgxLinkifyjsModule } from 'ngx-linkifyjs';
import { InterventionAskedPipe } from '../shared/pipes/intervention-asked';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';


const routes: Routes = [
  {
    path: '',
    component: VideoRoomPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NgxLinkifyjsModule.forRoot(),
    RouterModule.forChild(routes),
  ],
  declarations: [
    VideoRoomPage,
    StreamComponent,
    ChatComponent,
    OpenViduVideoComponent,
    LinkifyPipe,
    InterventionAskedPipe
  ],
  exports: [],
  providers: [
    AndroidPermissions
  ],
  entryComponents: [ChatComponent]
})
export class VideoRoomPageModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { VideoRoomSwitchComponent } from './video-room-switch/video-room-switch.component';

const routes: Routes = [{
  path: '',
  component: DashboardComponent
}, {
  path: ':role/:roomName/:userName',
  component: VideoRoomSwitchComponent
}];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule {
}

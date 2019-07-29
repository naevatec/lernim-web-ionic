import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoRoomTeacherComponent } from './video-room-teacher.component';

describe('VideoRoomComponent', () => {
  let component: VideoRoomTeacherComponent;
  let fixture: ComponentFixture<VideoRoomTeacherComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [VideoRoomTeacherComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoRoomTeacherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

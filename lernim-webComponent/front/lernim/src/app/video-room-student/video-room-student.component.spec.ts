import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoRoomStudentComponent } from './video-room-student.component';

describe('VideoRoomComponent', () => {
  let component: VideoRoomStudentComponent;
  let fixture: ComponentFixture<VideoRoomStudentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [VideoRoomStudentComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoRoomStudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoSidebarComponent } from './video-sidebar.component';

describe('VideoSidebarComponent', () => {
  let component: VideoSidebarComponent;
  let fixture: ComponentFixture<VideoSidebarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VideoSidebarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

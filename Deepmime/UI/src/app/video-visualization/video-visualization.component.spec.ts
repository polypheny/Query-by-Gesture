import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoVisualizationComponent } from './video-visualization.component';

describe('VideoVisualizationComponent', () => {
  let component: VideoVisualizationComponent;
  let fixture: ComponentFixture<VideoVisualizationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VideoVisualizationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

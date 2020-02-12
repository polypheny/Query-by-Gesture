import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultSidebarComponent } from './result-sidebar.component';

describe('ResultSidebarComponent', () => {
  let component: ResultSidebarComponent;
  let fixture: ComponentFixture<ResultSidebarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResultSidebarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

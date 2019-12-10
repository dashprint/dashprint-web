import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GcodeViewerComponent } from './gcode-viewer.component';

describe('GcodeViewerComponent', () => {
  let component: GcodeViewerComponent;
  let fixture: ComponentFixture<GcodeViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GcodeViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GcodeViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

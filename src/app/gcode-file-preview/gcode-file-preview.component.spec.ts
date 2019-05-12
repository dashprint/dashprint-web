import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GcodeFilePreviewComponent } from './gcode-file-preview.component';

describe('GcodeFilePreviewComponent', () => {
  let component: GcodeFilePreviewComponent;
  let fixture: ComponentFixture<GcodeFilePreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GcodeFilePreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GcodeFilePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

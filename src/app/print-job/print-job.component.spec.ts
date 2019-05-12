import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintJobComponent } from './print-job.component';

describe('PrintJobComponent', () => {
  let component: PrintJobComponent;
  let fixture: ComponentFixture<PrintJobComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PrintJobComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrintJobComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

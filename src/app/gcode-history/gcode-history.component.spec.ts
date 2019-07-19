import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GCodeHistoryComponent } from './gcode-history.component';

describe('GCodeHistoryComponent', () => {
  let component: GCodeHistoryComponent;
  let fixture: ComponentFixture<GCodeHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GCodeHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GCodeHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

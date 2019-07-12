import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PromptPopupComponent } from './prompt-popup.component';

describe('PromptPopupComponent', () => {
  let component: PromptPopupComponent;
  let fixture: ComponentFixture<PromptPopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PromptPopupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PromptPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

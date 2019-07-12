import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ModalService } from '../modal.service';
import { Modal } from '../Modal';

@Component({
  selector: 'app-prompt-popup',
  templateUrl: './prompt-popup.component.html',
  styleUrls: ['./prompt-popup.component.css']
})
export class PromptPopupComponent extends Modal implements OnInit {
  message: string;
  title = "DashPrint";
  primaryButtonClass = "btn-primary";
  primaryButtonText = "Ok";
  secondaryButtonText = "Cancel";
  result: boolean;

  @Output() buttonClicked = new EventEmitter<boolean>();

  constructor(modalService: ModalService) {
    super(modalService);
  }

  ngOnInit() {
  }

  onPrimaryClicked() {
    this.result = true;
    this.visible = false;
    this.buttonClicked.emit(true);
  }

  onSecondaryClicked() {
    this.result = false;
    this.visible = false;
    this.buttonClicked.emit(false);
  }

}

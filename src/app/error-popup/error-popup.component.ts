import { Component, OnInit } from '@angular/core';
import { Modal } from '../Modal';
import { ModalService } from '../modal.service';

@Component({
  selector: 'app-error-popup',
  templateUrl: './error-popup.component.html',
  styleUrls: ['./error-popup.component.css']
})
export class ErrorPopupComponent extends Modal implements OnInit {
  message: string;

  constructor(modalService: ModalService) {
    super(modalService);
  }

  ngOnInit() {
  }

}

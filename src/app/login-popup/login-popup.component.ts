import { Component, OnInit } from '@angular/core';
import { Modal } from '../Modal';
import { ModalService } from '../modal.service';

@Component({
  selector: 'app-login-popup',
  templateUrl: './login-popup.component.html',
  styleUrls: ['./login-popup.component.css']
})
export class LoginPopupComponent extends Modal implements OnInit {
  username: string;
  password: string;

  constructor(modalService: ModalService) {
    super(modalService);
  }

  ngOnInit() {
  }

}

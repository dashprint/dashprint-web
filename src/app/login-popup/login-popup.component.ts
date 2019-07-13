import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Modal } from '../Modal';
import { ModalService } from '../modal.service';
import { AuthenticationService } from '../authentication.service';

@Component({
  selector: 'app-login-popup',
  templateUrl: './login-popup.component.html',
  styleUrls: ['./login-popup.component.css']
})
export class LoginPopupComponent extends Modal implements OnInit {
  username: string;
  password: string;
  busy = false;

  @Output() loginSucceeded = new EventEmitter();

  constructor(modalService: ModalService, private authenticationService: AuthenticationService) {
    super(modalService);
  }

  ngOnInit() {
  }

  onLoginClicked() {
    // TODO: Do login
    this.busy = true;
    // this.visible = false;
  }
}

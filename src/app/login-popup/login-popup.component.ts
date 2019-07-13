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
  errorMessage: string;
  busy = false;

  @Output() loginSucceeded = new EventEmitter();

  constructor(modalService: ModalService, private authenticationService: AuthenticationService) {
    super(modalService);
  }

  ngOnInit() {
  }

  onLoginClicked() {
    if (this.busy)
      return;
      
    // Do login
    this.busy = true;
    this.authenticationService.authenticate(this.username, this.password).subscribe(token => {
      this.busy = false;

      if (token) {
        this.visible = false;
        this.loginSucceeded.emit();
      } else
        this.errorMessage = "Invalid username or password!";
    });
  }
}

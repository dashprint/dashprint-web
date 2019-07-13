import { Component, OnInit } from '@angular/core';
import { Modal } from '../Modal';
import { ModalService } from '../modal.service';
import { AuthenticationService } from '../authentication.service';

@Component({
  selector: 'app-settings-popup',
  templateUrl: './settings-popup.component.html',
  styleUrls: ['./settings-popup.component.css']
})
export class SettingsPopupComponent extends Modal implements OnInit {
  currentUsersOctoprintKey: string;

  constructor(modalService: ModalService, private authenticationService: AuthenticationService) {
    super(modalService);
  }

  ngOnInit() {
    this.authenticationService.getUserData(this.authenticationService.getUsername()).subscribe(userData => {
      this.currentUsersOctoprintKey = userData['octoprint_compat_key'];
    });
  }

  onSaveClicked() {
    // TODO
  }

}

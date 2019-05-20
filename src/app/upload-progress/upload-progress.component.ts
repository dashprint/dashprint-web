import { Component, OnInit } from '@angular/core';
import {Modal} from "../Modal";
import { ModalService } from '../modal.service';

@Component({
  selector: 'app-upload-progress',
  templateUrl: './upload-progress.component.html',
  styleUrls: ['./upload-progress.component.css']
})
export class UploadProgressComponent extends Modal implements OnInit {

  total: number = 0;
  done: number = 0;

  constructor(modalService: ModalService) {
    super(modalService);
  }

  ngOnInit() {
  }

}

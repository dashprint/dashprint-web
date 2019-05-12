import { Component, OnInit } from '@angular/core';
import { Modal } from '../Modal';
import { ModalService } from '../modal.service';
import { ServerFile } from '../File';
import { FileService } from '../file.service';
import { HttpEventType } from '@angular/common/http';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-gcode-file-preview',
  templateUrl: './gcode-file-preview.component.html',
  styleUrls: ['./gcode-file-preview.component.css']
})
export class GcodeFilePreviewComponent extends Modal implements OnInit {
  loading: boolean = true;
  downloadProgress: number = 0;
  downloadSubscription: Subscription;
  file: ServerFile;

  constructor(modalService: ModalService, private fileService: FileService) {
    super(modalService);
  }

  ngOnInit() {
  }

  public loadFile(file: ServerFile) {
    this.file = file;

    this.downloadSubscription = this.fileService.downloadFile(file).subscribe((event) => {
      switch(event.type) {
        case HttpEventType.Response:
          // TODO: analyze gcode
          this.downloadSubscription = null;
          break;
        case HttpEventType.DownloadProgress:
          // Update progress bar
          this.downloadProgress = (event.loaded*100) / event.total;
          break;
      }
    });
  }

  public hide() {
    super.hide();
    if (this.downloadSubscription)
      this.downloadSubscription.unsubscribe();
  }

}

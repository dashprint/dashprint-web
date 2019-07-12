import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ServerFile } from '../File';
import { FileService } from '../file.service';
import { ModalService } from '../modal.service';
import { GcodeFilePreviewComponent } from '../gcode-file-preview/gcode-file-preview.component';
import { PrintService } from '../print.service';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-file-manager',
  templateUrl: './file-manager.component.html',
  styleUrls: ['./file-manager.component.css']
})
export class FileManagerComponent implements OnInit {
  files: ServerFile[] = [];

  @Output() filePrinted = new EventEmitter<ServerFile>();

  constructor(private fileService: FileService, private printService: PrintService,
    private modalService: ModalService) { }

  ngOnInit() {
    this.reload();
  }

  public reload() {
    this.fileService.getFileList().subscribe((files) => {
      this.files = files;
    });
  }

  printFile(file: ServerFile) {
    this.filePrinted.emit(file);
  }

  deleteFile(file: ServerFile) {
    // TODO
  }

  displayFile(file: ServerFile) {
    let preview = <GcodeFilePreviewComponent> this.modalService.showModal(GcodeFilePreviewComponent);
    preview.loadFile(file);
  }

}

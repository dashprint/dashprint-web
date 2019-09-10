import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { ServerFile } from '../File';
import { FileService } from '../file.service';
import { ModalService } from '../modal.service';
import { GcodeFilePreviewComponent } from '../gcode-file-preview/gcode-file-preview.component';
import { PrintService } from '../print.service';
import { HttpEventType } from '@angular/common/http';
import { PromptPopupComponent } from '../prompt-popup/prompt-popup.component';
import { ErrorPopupComponent } from '../error-popup/error-popup.component';
import { WebsocketService } from '../websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-file-manager',
  templateUrl: './file-manager.component.html',
  styleUrls: ['./file-manager.component.css']
})
export class FileManagerComponent implements OnInit, OnDestroy {
  files: ServerFile[] = [];

  @Output() filePrinted = new EventEmitter<ServerFile>();
  @Output() error = new EventEmitter<string>();
  private eventSubscription: Subscription;

  constructor(private fileService: FileService, private printService: PrintService,
    private modalService: ModalService, private websocketService: WebsocketService) { }

  ngOnInit() {
    this.reload();

    this.eventSubscription = this.websocketService.subscribeToFileManagerEvents().subscribe(() => {
      this.reload();
    });
  }

  ngOnDestroy() {
    if (this.eventSubscription) {
      this.eventSubscription.unsubscribe();
      this.eventSubscription = null;
    }
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
    let modal = <PromptPopupComponent> this.modalService.showModal(PromptPopupComponent);
    modal.title = "Delete File";
    modal.message = "Do you really want to delete '" + file.name + "'?";
    modal.primaryButtonText = "Delete";
    modal.secondaryButtonText = "Cancel";
    modal.primaryButtonClass = "btn-danger";
    modal.buttonClicked.subscribe(primaryClicked => {

      if (primaryClicked) {
        this.fileService.deleteFile(file).subscribe(event => {
          if (event.type === HttpEventType.Response) {
            if (!event.ok) {
              this.showErrorMessage("Error deleting file: " + event.body);
            }
          }
          this.reload();
        });
      }
    })
  }

  private showErrorMessage(text) {
    this.error.emit(text);
  }

  displayFile(file: ServerFile) {
    let preview = <GcodeFilePreviewComponent> this.modalService.showModal(GcodeFilePreviewComponent);
    preview.loadFile(file);
  }

}

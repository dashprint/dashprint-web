import { Component, OnInit, ViewContainerRef, ViewChild, ElementRef } from '@angular/core';
import {Printer, PrinterTemperatures, TemperaturePoint} from './Printer';
import { PrintService } from './print.service';
import { ModalService } from './modal.service';
import { AddprinterComponent } from './addprinter/addprinter.component';
import {WebsocketService} from "./websocket.service";
import {Subscription} from "rxjs/Subscription";
import { FileService } from './file.service';
import { HttpEventType } from '@angular/common/http';
import { UploadProgressComponent } from './upload-progress/upload-progress.component';
import { FileManagerComponent } from './file-manager/file-manager.component';
import { ErrorPopupComponent } from './error-popup/error-popup.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';
  printers: Printer[];

  selectedPrinter: Printer;

  selectedPrinterSubscription: Subscription;

  dragOver: number = 0;
  runningEnableDisable: boolean = false;

  @ViewChild('modals', {
    read: ViewContainerRef
  }) viewContainerRef: ViewContainerRef;

  @ViewChild("fileManagerComponent") fileManagerComponent: FileManagerComponent;

  constructor(private printService: PrintService, private modalService: ModalService, private websocketService: WebsocketService, private fileService: FileService) {
  }

  ngOnInit() {
      // Get printer list
      this.updatePrinterList();
      this.websocketService.subscribeToPrinterList(() => this.updatePrinterList());

      this.modalService.setRootViewContainerRef(this.viewContainerRef);
  }

  updatePrinterList() {
    console.log("updatePrinterList() called");

    this.printService.getPrinters().subscribe(printers => {
      this.printers = printers;

      // Select the default printer if none is selected
      if (!this.selectedPrinter && this.printers && this.printers.length) {
        this.printers.forEach(p => {
          if (p.defaultPrinter)
            this.switchPrinter(p);
        });

        if (!this.selectedPrinter)
          this.switchPrinter(this.printers[0]);
      }
    });
  }

  addPrinter() {
      // HOWTO: https://medium.com/front-end-hacking/dynamically-add-components-to-the-dom-with-angular-71b0cb535286
      this.modalService.showModal(AddprinterComponent);
  }

  switchPrinter(printer: Printer) {
    if (printer === this.selectedPrinter)
      return;

    if (this.selectedPrinterSubscription) {
      this.selectedPrinterSubscription.unsubscribe();
      this.selectedPrinterSubscription = null;
    }

    this.selectedPrinter = printer;

    this.selectedPrinterSubscription = this.websocketService
        .subscribeToPrinter(this.selectedPrinter).subscribe((printer: Printer) => {});
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();

    if (event.dataTransfer.items) {
      for (let i = 0; i < event.dataTransfer.items.length; i++) {
        if (event.dataTransfer.items[i].kind === 'file') {
          let file: File = event.dataTransfer.items[i].getAsFile();
          this.processFile(file);
          break;
        }
      }
    } else {
      for (let i = 0; i < event.dataTransfer.files.length; i++) {
        this.processFile(event.dataTransfer.files[i]);
        break;
      }
    }
  }

  private processFile(file: File) {
    this.dragOver = 0;

    if (!file.name.toLowerCase().endsWith(".gcode")) {
        alert("Only GCODE files are accepted!");
        return;
    }

    // Show overlay with progress
    let uploadProgress = <UploadProgressComponent> this.modalService.showModal(UploadProgressComponent);
    uploadProgress.total = file.size;
    uploadProgress.done = 0;

    this.fileService.uploadFile(file).subscribe(event => {
      switch(event.type) {
        case HttpEventType.Response:
          // Upload done
          // Hide progress overlay
          uploadProgress.hide();

          if (event.ok) {
            const loc = event.headers.get('location');
            console.debug("File uploaded as: " + loc);

            // reload file list
            this.fileManagerComponent.reload();

            // TODO: If no print job is running, ask for starting the print
          } else {
            console.error("Upload failed: " + event.statusText);

            let errorText = (event.body) ? event.body : event.statusText;
            this.showErrorMessage(errorText);
          }

          break;

        case HttpEventType.UploadProgress:
          // Update progress
          const percentDone = Math.round(100 * event.loaded / event.total);
          console.debug("File progress: " + percentDone);
          uploadProgress.done = event.loaded;

          break;
      }
    });
    
  }

  private showErrorMessage(text: string) {
    let modal = <ErrorPopupComponent> this.modalService.showModal(ErrorPopupComponent);
    modal.message = text;
  }

  onDragEnter(event: DragEvent) {
    console.debug("onDragEnter");
    this.dragOver++;
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent) {
    console.debug("onDragLeave");
    this.dragOver--;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  startStopPrinter(printer: Printer, start: boolean) {
    this.runningEnableDisable = true;
    this.printService.modifyPrinter(printer, { stopped: !start })
        .subscribe(x => { this.runningEnableDisable = false; });
  }

  editPrinter(printer: Printer) {
    // TODO
    this.showErrorMessage("Not implemented :-(");
  }
}

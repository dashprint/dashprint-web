import { Component, OnInit, AfterViewInit, ViewContainerRef, ViewChild, ElementRef } from '@angular/core';
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
import { ServerFile } from './File';
import { PrintJobComponent } from './print-job/print-job.component';
import { PromptPopupComponent } from './prompt-popup/prompt-popup.component';
import { AuthenticationService } from './authentication.service';
import { LoginPopupComponent } from './login-popup/login-popup.component';
import { SettingsPopupComponent } from './settings-popup/settings-popup.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'app';
  printers: Printer[];

  selectedPrinter: Printer;

  selectedPrinterSubscription: Subscription;

  dragOver: number = 0;
  runningEnableDisable: boolean = false;

  @ViewChild('modals', {
    read: ViewContainerRef, static: false
  }) viewContainerRef: ViewContainerRef;

  @ViewChild("fileManagerComponent", {static: false}) fileManagerComponent: FileManagerComponent;
  @ViewChild("printJobComponent", {static: false}) printJobComponent: PrintJobComponent;

  constructor(private printService: PrintService, private modalService: ModalService,
    private websocketService: WebsocketService, private fileService: FileService,
    private authenticationService: AuthenticationService) {
  }

  ngOnInit() {
    
  }

  ngAfterViewInit() {
    this.modalService.setRootViewContainerRef(this.viewContainerRef);

    if (!this.authenticationService.hasValidToken()) {
      let modal = <LoginPopupComponent> this.modalService.showModal(LoginPopupComponent);
      modal.loginSucceeded.subscribe(() => {
        this.onAfterLogin();
      });
    }
  }

  private onAfterLogin() {
    this.websocketService.openSocket();
    // Get printer list
    this.updatePrinterList();
    this.websocketService.subscribeToPrinterList(() => this.updatePrinterList());
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
        // TODO: if the connection fails, this doesn't get called?!
        case HttpEventType.Response:
          // Upload done
          // Hide progress overlay
          uploadProgress.hide();

          if (event.ok) {
            const loc = event.headers.get('location');
            console.debug("File uploaded as: " + loc);

            // reload file list
            this.fileManagerComponent.reload();

            // If no print job is running, ask for starting the print
            if (!this.printJobComponent.printJob) {
              let modal = <PromptPopupComponent> this.modalService.showModal(PromptPopupComponent);
              
              modal.title = "Print Job";
              modal.message = "Start printing '" + file.name + "' now?";
              modal.primaryButtonText = "Yes";
              modal.secondaryButtonText = "No";

              modal.buttonClicked.subscribe(primaryPressed => {
                if (primaryPressed)
                  this.doPrintFile(file.name);
              });
            }
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
    }, error => {
      console.error("Upload failed: " + error.message);
      this.showErrorMessage("Upload failed: " + error.message);
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

  private doPrintFile(fileName: string) {
    if (!this.selectedPrinter) {
      this.showErrorMessage("No printer is selected.");
      return;
    }

    this.printService.printFile(this.selectedPrinter, fileName).subscribe(event => {
      if (event.type === HttpEventType.Response) {
        if (event.status === 404)
          this.showErrorMessage("File not found.");
        else if (event.status === 409)
          this.showErrorMessage("The printer is busy.");
        else if (!event.ok)
          this.showErrorMessage("Error: " + event.body);
      }
    });
  }

  onFilePrinted(file: ServerFile) {
    this.doPrintFile(file.name);
  }

  openSettings() {
    let modal = <SettingsPopupComponent> this.modalService.showModal(SettingsPopupComponent);
  }
}

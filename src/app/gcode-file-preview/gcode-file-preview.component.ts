import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Modal } from '../Modal';
import { ModalService } from '../modal.service';
import { ServerFile } from '../File';
import { FileService } from '../file.service';
import { HttpEventType } from '@angular/common/http';
import { Subscription } from 'rxjs/Subscription';
import { saveAs } from 'file-saver/';
import { GCodeService, AnalyzedGCode, GCodeLayer } from '../gcode.service';
import { GCodeView } from '../webgl/GCodeView';

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
  fileData: Blob;
  analyzedGcode: AnalyzedGCode;
  gcodeView: GCodeView;

  @ViewChild('gcodePreview', {static: false}) gcodePreview: ElementRef;

  constructor(modalService: ModalService, private fileService: FileService, private gcodeService: GCodeService) {
    super(modalService);
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.gcodeView = new GCodeView(this.gcodePreview.nativeElement);
    this.gcodeView.initialize();
  }

  public loadFile(file: ServerFile) {
    this.file = file;

    this.downloadSubscription = this.fileService.downloadFile(file).subscribe((event) => {
      switch(event.type) {
        case HttpEventType.ResponseHeader:
          if (!event.ok) {
            alert("Failed to download GCODE file!");
            this.hide();
          }
          break;
        case HttpEventType.Response:
          
          this.downloadSubscription = null;
          this.loading = false;

          if (event.ok) {
            this.fileData = event.body;
            this.gcodeService.parseGcode(this.fileData).subscribe((gcode: AnalyzedGCode) => {
              this.displayGcode(gcode);
            });
          } else {
            alert("Failed to download GCODE file!");
            this.hide();
          }
          break;
        case HttpEventType.DownloadProgress:
          // Update progress bar
          if (event.total)
            this.downloadProgress = (event.loaded*100) / event.total;
          break;
      }
    });
  }

  public hide() {
    super.hide();
    this.gcodeView.show(null);
    
    if (this.downloadSubscription)
      this.downloadSubscription.unsubscribe();
  }

  public saveFile() {
    const blob = new Blob([this.fileData], { type: 'text/plain' });
    saveAs(blob, this.file.name);
  }

  private displayGcode(gcode: AnalyzedGCode) {
    this.analyzedGcode = gcode;

    // 3D view
    this.gcodeView.show(gcode);
  }

}

import { Component, OnInit, ViewChild, ElementRef, Input, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ServerFile } from '../File';
import { AnalyzedGCode, GCodeService } from '../gcode.service';
import { GCodeView } from '../webgl/GCodeView';
import { FileService } from '../file.service';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-gcode-viewer',
  templateUrl: './gcode-viewer.component.html',
  styleUrls: ['./gcode-viewer.component.css']
})
export class GcodeViewerComponent implements AfterViewInit {
  loading: boolean = true;
  downloadProgress: number = 0;
  downloadSubscription: Subscription;
  file: ServerFile;
  fileData: Blob;
  analyzedGcode: AnalyzedGCode;
  gcodeView: GCodeView;

  @Input() width: number = 300;
  @Input() height: number = 300;
  _source: string;
  _printProgress: number;
  currentLayer: number;

  @ViewChild('gcodePreview', {static: false}) gcodePreview: ElementRef;
  
  constructor(private fileService: FileService, private gcodeService: GCodeService) { }

  ngAfterViewInit() {
    this.gcodeView = new GCodeView(this.gcodePreview.nativeElement);
    this.gcodeView.initialize();

    if (this.analyzedGcode)
      this.gcodeView.show(this.analyzedGcode);
    if (this._printProgress)
      this.currentLayer = this.gcodeView.setPrintProgress(this._printProgress);
  }

  @Input()
  set source(path: string) {
    let file = new ServerFile();
    file.name = path;
    this.loadFile(file);
  }

  get source(): string {
    return this.file.name;
  }

  public loadFile(file: ServerFile) {
    this.file = file;

    this.downloadSubscription = this.fileService.downloadFile(file).subscribe((event) => {
      switch(event.type) {
        case HttpEventType.ResponseHeader:
          if (!event.ok) {
            alert("Failed to download GCODE file!");
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

  private displayGcode(gcode: AnalyzedGCode) {
    this.analyzedGcode = gcode;

    // 3D view
    if (this.gcodeView)
      this.gcodeView.show(gcode);
  }

  public hide() {
    this.gcodeView.show(null);
    this.gcodeView.setPrintProgress(null);
    this._printProgress = null;
    
    if (this.downloadSubscription) {
      this.downloadSubscription.unsubscribe();
      this.downloadSubscription = null;
    }
  }

  @Input()
  set printProgress(progress: number) {
    this._printProgress = progress;

    if (this.gcodeView)
      this.currentLayer = this.gcodeView.setPrintProgress(progress);
  }

}

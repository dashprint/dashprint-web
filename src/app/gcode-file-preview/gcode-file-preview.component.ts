import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { Modal } from '../Modal';
import { ModalService } from '../modal.service';
import { ServerFile } from '../File';
import { saveAs } from 'file-saver/';
import { GcodeViewerComponent } from '../gcode-viewer/gcode-viewer.component';

@Component({
  selector: 'app-gcode-file-preview',
  templateUrl: './gcode-file-preview.component.html',
  styleUrls: ['./gcode-file-preview.component.css']
})
export class GcodeFilePreviewComponent extends Modal implements AfterViewInit {
  private file: ServerFile;

  @ViewChild("gcodeViewer", {static: false}) gcodeViewerComponent: GcodeViewerComponent;

  constructor(modalService: ModalService) {
    super(modalService);
  }

  ngAfterViewInit(): void {
    if (this.file && this.gcodeViewerComponent)
    this.gcodeViewerComponent.loadFile(this.file);
  }

  public loadFile(file: ServerFile) {
    this.file = file;

    if (this.gcodeViewerComponent)
      this.gcodeViewerComponent.loadFile(file);
  }

  public hide() {
    super.hide();
    this.gcodeViewerComponent.hide();
  }

  public saveFile() {
    const blob = new Blob([this.gcodeViewerComponent.fileData], { type: 'text/plain' });
    saveAs(blob, this.gcodeViewerComponent.file.name);
  }
}

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { PrintService } from './print.service';
import { ModalService } from './modal.service';
import { FileService } from './file.service';
import { AddprinterComponent } from './addprinter/addprinter.component';
import { ClarityModule } from "@clr/angular";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {StlmodelService} from "./webgl/stlmodel.service";
import {WebsocketService} from "./websocket.service";
import { PrintJobComponent } from './print-job/print-job.component';
import { FileManagerComponent } from './file-manager/file-manager.component';
import { TemperaturesComponent } from './temperatures/temperatures.component';

@NgModule({
  declarations: [
    AppComponent,
    AddprinterComponent,
    PrintJobComponent,
    FileManagerComponent,
    TemperaturesComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ClarityModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [PrintService, ModalService, StlmodelService, WebsocketService, FileService],
  bootstrap: [AppComponent],
  entryComponents: [
    AddprinterComponent,
  ],
})
export class AppModule { }

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

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
import { UploadProgressComponent } from './upload-progress/upload-progress.component';
import { FileSizePipe } from './file-size.pipe';
import { ErrorPopupComponent } from './error-popup/error-popup.component';
import { GcodeFilePreviewComponent } from './gcode-file-preview/gcode-file-preview.component';
import { DurationPipe } from './duration.pipe';
import { GCodeService } from './gcode.service';
import { PromptPopupComponent } from './prompt-popup/prompt-popup.component';
import { LoginPopupComponent } from './login-popup/login-popup.component';
import { CookieService } from 'ngx-cookie-service';
import { AuthenticationService } from './authentication.service';
import { AuthenticationInterceptor } from 'src/AuthenticationInterceptor';
import { SettingsPopupComponent } from './settings-popup/settings-popup.component';
import { CameraService } from './camera.service';
import { CameraComponent } from './camera/camera.component';
import { GCodeHistoryComponent } from './gcode-history/gcode-history.component';
import { GcodeViewerComponent } from './gcode-viewer/gcode-viewer.component';

@NgModule({
  declarations: [
    AppComponent,
    AddprinterComponent,
    PrintJobComponent,
    FileManagerComponent,
    TemperaturesComponent,
    UploadProgressComponent,
    FileSizePipe,
    ErrorPopupComponent,
    GcodeFilePreviewComponent,
    DurationPipe,
    PromptPopupComponent,
    LoginPopupComponent,
    SettingsPopupComponent,
    CameraComponent,
    GCodeHistoryComponent,
    GcodeViewerComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ClarityModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    PrintService, ModalService, StlmodelService, WebsocketService, FileService, GCodeService, CookieService, AuthenticationService, CameraService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthenticationInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    AddprinterComponent,
    UploadProgressComponent,
    ErrorPopupComponent,
    PromptPopupComponent,
    GcodeFilePreviewComponent,
    LoginPopupComponent,
    SettingsPopupComponent
  ],
})
export class AppModule { }

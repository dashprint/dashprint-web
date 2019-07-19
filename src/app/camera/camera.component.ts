import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { Camera, CameraService } from '../camera.service';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.css']
})
export class CameraComponent implements OnInit {
  private _camera: Camera;
  private videoUrl: string;
  private showSpinner: boolean = false;

  @ViewChild('videoPlayer', {static: false}) videoPlayer: ElementRef<HTMLVideoElement>;

  constructor(private cameraService: CameraService) { }

  ngOnInit() {
  }

  get camera(): Camera {
    return this._camera;
  }

  @Input()
  set camera(camera: Camera) {
    this._camera = camera;
    this.start();
  }

  toggleFullscreen() {
    this.videoPlayer.nativeElement.requestFullscreen();
  }

  togglePlay() {
    if (this.videoUrl)
      this.videoUrl = null;
    else {
      this.videoUrl = this.cameraService.cameraUrl(this.camera.id);
      this.videoPlayer.nativeElement.play();
    }
  }

  loadedData() {
    this.showSpinner = false;
  }

  videoWaiting() {
    this.showSpinner = true;
  }

  videoEnded() {
    this.videoUrl = null;
  }

  videoError() {
    this.videoUrl = null;
  }

  public stop() {
    if (this.videoPlayer)
      this.videoPlayer.nativeElement.pause();
    this.videoUrl = null;
  }

  public start() {
    this.showSpinner = true;
    this.videoUrl = this.cameraService.cameraUrl(this.camera.id);

    if (this.videoPlayer)
      this.videoPlayer.nativeElement.play();
  }

}

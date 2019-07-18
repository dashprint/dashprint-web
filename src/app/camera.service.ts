import { Injectable } from '@angular/core';
import { AuthenticationService } from './authentication.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CameraService {

  constructor(private http: HttpClient, private authenticationService: AuthenticationService) { }

  public detectCameras(): Observable<Camera[]> {
    return this.http.get<Camera[]>('/api/v1/camera/detectCameras');
  }

  public cameraUrl(id: string): string {
    return '/api/v1/camera/stream/' + id + '?token=' + encodeURIComponent(this.authenticationService.getToken());
  }
}

export class CameraParameters {
  id: string;
  description: string;
  type: 'integer';
  minIntegerValue: number;
  maxIntegerValue: number;
  defaultIntegerValue: number;
  value: any;
}

export class Camera {
  id: string;
  name: string;
  parameters: CameraParameters;
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ServerFile } from './File';
import { HttpClient, HttpEventType, HttpRequest, HttpEvent } from '@angular/common/http';
import {catchError, map} from "rxjs/operators";

@Injectable()
export class FileService {

  constructor(private http: HttpClient) { }

  getFileList() : Observable<ServerFile[]> {
    return this.http.get<any[]>('/api/v1/files').map(data => {
      let rv : ServerFile[] = [];

      data.forEach(v => {
        let f = new ServerFile();

        f.name = v.name;
        f.length = v.length;
        f.mtime = new Date(v.mtime);

        rv.push(f);
      });

      return rv;
    });
  }

  uploadFile(f: File) : Observable<HttpEvent<any>> {
    let req = new HttpRequest('POST', '/api/v1/files/' + f.name, f, { reportProgress: true });
    return this.http.request(req);
  }
}

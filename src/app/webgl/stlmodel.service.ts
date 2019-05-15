import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs/Observable";
import {Triangles} from "./Triangles";
import 'rxjs/add/observable/from';

@Injectable()
export class StlmodelService {
  private worker: Worker;
  private reqId: number = 0;

  constructor(private http: HttpClient) {
      this.worker = new Worker('/assets/workers/STLModel.worker.js');
  }

  public getByURL(url: string) : Observable<Triangles> {
      return Observable.create((observer) => {

          // Why arraybuffer as json? See https://github.com/angular/angular/issues/18586
          this.http.get<ArrayBuffer>(url, { responseType: 'arraybuffer' as 'json' } )
              .subscribe( (arrayBuffer) => this.handleSTLArrayBuffer(observer, arrayBuffer));

      });
  }

  private handleSTLArrayBuffer(observer, arrayBuffer: ArrayBuffer) {
    let myReqId = this.reqId++;

    var fn = (msg) => {
        if (msg.data[0] === myReqId) {
            this.worker.removeEventListener('message', fn);

            let data = msg.data[1];
            if (data) {
                observer.next(new Triangles(data.vertices, null, data.center, data.dimensions));
                observer.complete();
            } else {
                throw Observable.throw("STL failed to load");
            }
        }
    };

    this.worker.addEventListener('message', fn);
    this.worker.postMessage([myReqId, arrayBuffer]);
  }
}

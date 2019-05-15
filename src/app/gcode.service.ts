import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class GCodeService {
  private worker: Worker;
  private reqId: number = 0;

  constructor() {
    this.worker = new Worker('/assets/workers/GCode.worker.js');
  }

  public parseGcode(blob: Blob) : Observable<AnalyzedGCode> {

    return Observable.create((observer) => {
      const reader = new FileReader();

      reader.onload = () => {
        var gcodeAsString = <string> reader.result;
        this.parseGcodeString(gcodeAsString, observer);
      };

      reader.readAsText(blob);
    });
  }

  private parseGcodeString(gcode: string, observer) {
    var myReqId = this.reqId++;
    var fn = (msg) => {
      if (msg.data[0] === myReqId) {
        this.worker.removeEventListener('message', fn);

        let output: AnalyzedGCode = msg.data[1];
        observer.next(output);
        observer.complete();
      }
    };
    this.worker.addEventListener('message', fn);
    this.worker.postMessage([myReqId, gcode]);
  }
}

export class AnalyzedGCode {
  nozzleDiameter: number;
  estimatedTime: number;
  layers: GCodeLayer[];
}

export class GCodeLayer {
  z: number;
  lines: number[][];
  gcodeOffsets: number[];
}

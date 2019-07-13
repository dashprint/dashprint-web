import { Injectable } from '@angular/core';
import {Printer, DiscoveredPrinter, PrinterTemperature, PrinterTemperatures, TemperaturePoint} from './Printer';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpEvent, HttpRequest} from '@angular/common/http';
import {catchError, map} from "rxjs/operators";
import { PrintJob } from './PrintJob';
import { ServerFile } from './File';

@Injectable()
export class PrintService {

  constructor(private http: HttpClient) { }

  getPrinters() : Observable<Printer[]> {
      return this.http.get<Object>('/api/v1/printers').map(data => {
          let rv: Printer[] = [];

          Object.keys(data).forEach(key => {
              let printer = new Printer();
              printer.id = key;
              printer.name = data[key].name;
              printer.defaultPrinter = data[key]['default'];
              printer.apiKey = data[key].api_key;
              printer.devicePath = data[key].device_path;
              printer.baudRate = data[key].baud_rate;
              printer.stopped = data[key].stopped;
              printer.connected = data[key].connected;
              printer.width = data[key].width;
              printer.height = data[key].height;
              printer.depth = data[key].depth;
              rv.push(printer);
          });

          return rv;
      });
  }

  discoverPrinters() : Observable<DiscoveredPrinter[]> {
      return this.http.post<DiscoveredPrinter[]>('/api/v1/printers/discover', '');
  }

  addPrinter(printer: Printer) : Observable<string> {
      return Observable.create((observer) => {
          this.http.post('/api/v1/printers', {
              name: printer.name,
              default_printer: printer.defaultPrinter,
              device_path: printer.devicePath,
              baud_rate: printer.baudRate,
              stopped: printer.stopped,
              width: printer.width,
              height: printer.height,
              depth: printer.depth
          }, {observe: "response"})

              .subscribe(resp => {
              // TODO: Error handling
              let newurl = resp.headers.get('Location');
              observer.next(newurl);
              observer.complete();
          }, this.handleError);
      });
  }

  modifyPrinter(printer: Printer, changes: object) : Observable<string | object> {
      return this.http.put('/api/v1/printers/'+printer.id, changes)
          .pipe(catchError(this.handleError));
  }

  getPrinterTemperatures(printer: Printer) : Observable<TemperaturePoint[]> {
      return this.http.get<TemperaturePoint[]>('/api/v1/printers/'+printer.id+'/temperatures')
      .map((value: TemperaturePoint[], index: number) : TemperaturePoint[] => {
        for (let i = 0; i < value.length; i++) {
            if (!(value[i].when instanceof Date))
                value[i].when = new Date(value[i].when);
        }
        return value;
      });
  }

  setPrinterTargetTemperatures(printer: Printer, changes) : Observable<string | object> {
      return this.http.put('/api/v1/printers/' + printer.id + '/temperatures', changes)
      .pipe(map(result => { return {} }), catchError(this.handleError));
  }

    private handleError(error) {
        if (error.error instanceof ErrorEvent) {
            // A client-side or network error occurred. Handle it accordingly.
            console.error('An error occurred:', error.error.message);
        } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong,
            console.error(
                `Backend returned code ${error.status}, ` +
                `body was: ${error.error}`);
        }
        // return an observable with a user-facing error message
        return of("Error: " + error.error);
    }

    getPrintJob(printer: Printer) : Observable<PrintJob> {
        return this.http.get<PrintJob>('/api/v1/printers/' + printer.id + '/job', { observe: 'response' }).catch(err => {
            return of(null);
        });
    }

    printFile(printer: Printer, file: string) : Observable<HttpEvent<any>> {
        let data = {
            file: file
        };
        let req = new HttpRequest('POST', '/api/v1/printers/' + printer.id + '/job', data);
        return this.http.request(req);
    }

    setJobState(printer: Printer, state: string) : Observable<HttpEvent<any>> {
        let data = {
            state: state
        };

        let req = new HttpRequest('PUT', '/api/v1/printers/' + printer.id + '/job', data);
        return this.http.request(req);
    }

}

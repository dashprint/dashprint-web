import { Component, OnInit, Input } from '@angular/core';
import { Printer } from '../Printer';
import { PrintService } from '../print.service';
import { WebsocketService } from "../websocket.service";
import { PrintJob } from '../PrintJob';

@Component({
  selector: 'app-print-job',
  templateUrl: './print-job.component.html',
  styleUrls: ['./print-job.component.css']
})
export class PrintJobComponent implements OnInit {
  _printer: Printer;
  printJob: PrintJob;

  constructor(private printService: PrintService, private websocketService: WebsocketService) { }

  ngOnInit() {
  }

  get printer(): Printer {
    return this._printer;
  }

  @Input()
  set printer(printer: Printer) {
    if (this.printer) {
      // TODO: Unsubscribe from old printer events
    }

    console.debug("Printer changed in PrintJobComponent");
    this._printer = printer;

    // TODO: Subscribe to job events

    this.reload();
  }

  // Re-fetch information about the current printjob
  public reload() {
    if (this.printer) {
      this.printService.getPrintJob(this.printer).subscribe((printJob) => {
        this.printJob = printJob;
      });
    } else {
      this.printJob = null;
    }
  }

  public stopJob() {
    // TODO
  }

  public pauseJob() {
    // TODO
  }

  public resumeJob() {
    // TODO
  }

  public restartJob() {
    // TODO
  }

}

import { Component, OnInit, Input } from '@angular/core';
import { Printer } from '../Printer';
import { PrintService } from '../print.service';
import { WebsocketService } from "../websocket.service";
import { PrintJob } from '../PrintJob';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-print-job',
  templateUrl: './print-job.component.html',
  styleUrls: ['./print-job.component.css']
})
export class PrintJobComponent implements OnInit {
  _printer: Printer;
  printJob: PrintJob;
  printJobSubscription: Subscription;

  constructor(private printService: PrintService, private websocketService: WebsocketService) { }

  ngOnInit() {
  }

  get printer(): Printer {
    return this._printer;
  }

  @Input()
  set printer(printer: Printer) {
    if (this.printer) {
      // Unsubscribe from old printer events
      if (this.printJobSubscription) {
        this.printJobSubscription.unsubscribe();
        this.printJobSubscription = null;
      }
    }

    console.debug("Printer changed in PrintJobComponent");
    this._printer = printer;

    this.reload();
  }

  // Re-fetch information about the current printjob
  public reload() {
    if (this.printer) {
      this.printService.getPrintJob(this.printer).subscribe((printJob) => {
        this.printJob = printJob;

        // Subscribe to job events
        this.printJobSubscription = this.websocketService.subscribeToPrinterJobs(this.printer, this.printJob).subscribe(printJob => {
          this.printJob = printJob;
        });
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

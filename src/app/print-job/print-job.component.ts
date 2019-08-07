import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Printer } from '../Printer';
import { PrintService } from '../print.service';
import { WebsocketService } from "../websocket.service";
import { PrintJob } from '../PrintJob';
import { Subscription } from 'rxjs/Subscription';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-print-job',
  templateUrl: './print-job.component.html',
  styleUrls: ['./print-job.component.css']
})
export class PrintJobComponent implements OnInit {
  _printer: Printer;
  printJob: PrintJob;
  printJobSubscription: Subscription;

  @Output() error = new EventEmitter<string>();

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
      });

      // Subscribe to job events
      this.printJobSubscription = this.websocketService.subscribeToPrinterJobs(this.printer, this.printJob).subscribe(printJob => {
        this.printJob = printJob;
      });
    } else {
      this.printJob = null;
    }
  }

  public stopJob() {
    this.setJobState("Stopped");
  }

  public pauseJob() {
    this.setJobState("Paused");
  }

  public resumeJob() {
    this.setJobState("Running");
  }

  public restartJob() {
    this.printService.printFile(this.printer, this.printJob.name).subscribe(event => {
      if (event.type == HttpEventType.Response) {
        if (!event.ok) {
          this.error.emit(event.body);
        }
      }
    });
  }

  private setJobState(state: string) {
    this.printService.setJobState(this.printer, state).subscribe(event => {
      if (event.type == HttpEventType.Response) {
        if (!event.ok) {
          this.error.emit(event.body);
        }
      }
    });
  }

}

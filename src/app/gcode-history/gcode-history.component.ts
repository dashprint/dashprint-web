import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { WebsocketService } from '../websocket.service';
import { PrintService } from '../print.service';
import { Printer, GCodeEvent } from '../Printer';
import { Subscription } from 'rxjs';

const MAX_EVENTS = 100;

@Component({
  selector: 'app-gcode-history',
  templateUrl: './gcode-history.component.html',
  styleUrls: ['./gcode-history.component.css']
})
export class GCodeHistoryComponent implements OnInit {
  private _printer: Printer;
  private gcodeSubscription: Subscription;
  private gcodeEvents: GCodeEvent[] = [];
  private pendingCommandTag: string;
  private commandToSend: string;

  @ViewChild('gcodeListElement', {static: false}) private gcodeListElement: ElementRef;

  constructor(private websocketService: WebsocketService, private printService: PrintService) { }

  ngOnInit() {
  }

  get printer(): Printer {
    return this._printer;
  }

  @Input()
  set printer(printer: Printer) {
  
    if (this.gcodeSubscription) {
      this.gcodeSubscription.unsubscribe();
      this.gcodeSubscription = null;
    }

    console.debug("Printer changed in GCodeHistoryComponent");
    this._printer = printer;

    // Subscribe to events
    if (printer) {
      this.printService.gcodeHistory(printer).subscribe((events: GCodeEvent[]) => {
        this.gcodeEvents = events;
      });
      this.gcodeSubscription = this.websocketService.subscribeToGCodeEvents(printer).subscribe((event: GCodeEvent) => {
        this.gcodeEvents.push(event);

        if (!event.outgoing && event.tag === this.pendingCommandTag) {
          if (event.data === "ok" || event.data.startsWith("ok ") || event.data.startsWith("Error:"))
            this.pendingCommandTag = undefined;
        }

        if (this.gcodeEvents.length > MAX_EVENTS) {
          let first = this.gcodeEvents[0];

          if (first.commandId !== this.gcodeEvents[this.gcodeEvents.length-1].commandId) {
            do {
              this.gcodeEvents.splice(0, 1);
            } while (this.gcodeEvents.length > 0 && this.gcodeEvents[0].commandId == first.commandId);
          } else {
            this.gcodeEvents.splice(0, 1);
          }
        }

        // If we're scrolled to the bottom, let's stay at the bottom
        if (this.gcodeListElement.nativeElement.scrollTop == this.gcodeListElement.nativeElement.scrollHeight)
          window.setTimeout(() => this.scrollToBottom(), 100);
      });
    } else {
      this.gcodeEvents = [];
    }
  }

  sendCommand() {
    let command = this.commandToSend;
    this.pendingCommandTag = null;

    if (!command)
      return;

    this.printService.submitGcode(this.printer, command).subscribe((tag: string) => {
      this.pendingCommandTag = tag;
      this.commandToSend = "";
    });
  }

  private scrollToBottom(): void {
    try {
        this.gcodeListElement.nativeElement.scrollTop = this.gcodeListElement.nativeElement.scrollHeight;
    } catch(err) { }                 
  }
}

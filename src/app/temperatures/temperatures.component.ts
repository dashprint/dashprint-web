import { Component, OnInit, Input, ElementRef, ViewChild } from '@angular/core';
import { PrintService } from '../print.service';
import { WebsocketService } from '../websocket.service';
import { TemperatureGraph } from './TemperatureGraph';
import { Printer, PrinterTemperatures, TemperaturePoint } from '../Printer';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-temperatures',
  templateUrl: './temperatures.component.html',
  styleUrls: ['./temperatures.component.css']
})
export class TemperaturesComponent implements OnInit {
  private _printer: Printer;
  temperatures: PrinterTemperatures;
  temperatureHistory: TemperaturePoint[];

  newTargetT;
  newTargetB;

  temperaturesSubscription: Subscription;

  temperaturesGraph: ElementRef;
  temperaturesGraphRenderer: TemperatureGraph;
  @ViewChild("temperaturesGraph", {static: false}) set content(content: ElementRef) {
    this.temperaturesGraph = content;

    if (this.temperaturesGraph) {
      this.temperaturesGraphRenderer = new TemperatureGraph(this.temperaturesGraph.nativeElement, (name, value) => {
        let changes = {};
        changes[name] = value;

        this.printService.setPrinterTargetTemperatures(this.printer, changes).subscribe(result => {
          console.log("Target temp change result: " + result);
        });
      });

      if (this.printer)
        this.updateTemperaturesGraph();
    }
  }

  constructor(private printService: PrintService, private websocketService: WebsocketService) { }

  ngOnInit() {
  }

  get printer(): Printer {
    return this._printer;
  }

  @Input()
  set printer(printer: Printer) {
  
    if (this.temperaturesSubscription) {
      this.temperaturesSubscription.unsubscribe();
      this.temperaturesSubscription = null;
    }

    console.debug("Printer changed in TemperaturesComponent");
    this._printer = printer;

    // TODO: Subscribe to job events

    this.temperatures = null;
    this.temperatureHistory = null;
    this.updateTemperaturesGraph();

    if (this.printer) {
      this.printService.getPrinterTemperatures(this.printer).subscribe((temps) => {
        this.temperatureHistory = temps;

        if (temps && temps.length > 0)
          this.temperatures = temps[temps.length-1].values;
        else
          this.temperatures = {};
        this.updateTemperaturesGraph();

        this.temperaturesSubscription = this.websocketService.subscribeToPrinterTemperatures(this.printer, this.temperatures)
            .subscribe((temps) => {
                this.pushTempHistory();
                this.updateTemperaturesGraph();
        });
      });
    }
  }

  private pushTempHistory() {
    const MAX_TEMPERATURE_HISTORY = 30*60*1000;
    // clone current temperatures
    var temps: PrinterTemperatures = JSON.parse(JSON.stringify(this.temperatures));
    var now: Date = new Date();

    this.temperatureHistory.push({ when: now, values: temps });

    // Kill old data
    while (this.temperatureHistory.length > 0 && (now.getUTCMilliseconds() - this.temperatureHistory[0].when.getUTCMilliseconds()) > MAX_TEMPERATURE_HISTORY)
      this.temperatureHistory.shift();
  }

  private updateTemperaturesGraph() {
    if (!this.temperaturesGraphRenderer)
      return;

    this.temperaturesGraphRenderer.temperatureHistory = this.temperatureHistory;
    this.temperaturesGraphRenderer.temperatures = JSON.parse(JSON.stringify(this.temperatures));
    this.temperaturesGraphRenderer.render();
  }

  setTargetTemperatures() {
    let changes = {
      'B': parseInt(this.newTargetB),
      'T': parseInt(this.newTargetT)
    }
    this.printService.setPrinterTargetTemperatures(this.printer, changes).subscribe(result => {
      console.log("Target temp change result: " + result);
    });
  }

}

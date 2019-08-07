export class Printer {
    id: string;
    name: string;
    apiKey: string;
    devicePath: string;
    baudRate: number;
    defaultPrinter: boolean;
    connected: boolean;
    stopped: boolean;
    width: number;
    height: number;
    depth: number;
    state: string;
}

export class DiscoveredPrinter {
    path: string;
    name: string;
    vendor: string;
    serial: string;
}

export class PrinterTemperature {
    current: number;
    target: number;
}

export class PrinterTemperatures {
    [key: string]: PrinterTemperature;
}

export class TemperaturePoint {
    when: Date;
    values: PrinterTemperatures;
}

export class GCodeEvent {
    commandId: number;
    outgoing: boolean;
    data: string;
    tag: string;
}

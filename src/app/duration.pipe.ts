import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration'
})
export class DurationPipe implements PipeTransform {

  transform(seconds: number): string {
    var result = "";
    if (seconds > 60*60) { // hours
      let num = Math.floor(seconds / (60*60));
      result += num.toFixed(0)+'h ';
      seconds -= num*60*60;
    }

    if (seconds > 60) { // minutes
      let num = Math.floor(seconds / 60);
      result += num.toFixed(0)+'m ';
      seconds -= num*60;
    }

    result += seconds+'s';
    return result;
  }

}

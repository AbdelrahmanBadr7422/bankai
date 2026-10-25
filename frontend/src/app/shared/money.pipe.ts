import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../environments/environment';

@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  private format = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: environment.currency,
  });

  transform(value: number | null | undefined): string {
    return value === null || value === undefined ? '' : this.format.format(value);
  }
}

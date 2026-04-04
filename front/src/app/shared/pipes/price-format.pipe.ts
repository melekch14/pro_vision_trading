import { Pipe, PipeTransform } from '@angular/core';
import { PriceFormatService } from '../services/price-format.service';

@Pipe({
  name: 'priceFormat',
  standalone: true
})
export class PriceFormatPipe implements PipeTransform {
  constructor(private priceFormat: PriceFormatService) {}

  transform(value: number | string | null | undefined, currency: string = 'CFA', withCurrency: boolean = true): string {
    return this.priceFormat.format(value, currency, withCurrency);
  }
}

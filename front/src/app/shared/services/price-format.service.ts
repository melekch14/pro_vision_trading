import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PriceFormatService {
  private readonly formatter = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  });

  format(value: number | string | null | undefined, currency: string = 'CFA', withCurrency: boolean = true): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (Number.isNaN(numericValue)) {
      return '';
    }

    const formatted = this.formatter.format(numericValue);
    return withCurrency ? `${formatted} ${currency}` : formatted;
  }
}

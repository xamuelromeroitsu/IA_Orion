import { Money } from './Money.js';

export class TcoBreakdown {
  constructor({ declared = 0, shipping = 0, surcharges = 0, taxes = 0, licenses = 0, currency = 'USD', rate = 1 } = {}) {
    this.declared = new Money(declared, currency);
    this.shipping = new Money(shipping, currency);
    this.surcharges = new Money(surcharges, currency);
    this.taxes = new Money(taxes, currency);
    this.licenses = new Money(licenses, currency);
    this.currency = currency;
    this.rate = rate;
  }

  subtotal() {
    return this.declared
      .plus(this.shipping)
      .plus(this.surcharges)
      .plus(this.taxes)
      .plus(this.licenses);
  }

  totalUsd() {
    return this.subtotal().toUsd(this.rate);
  }

  hiddenCostsUsd() {
    return this.shipping
      .plus(this.surcharges)
      .plus(this.taxes)
      .plus(this.licenses)
      .toUsd(this.rate);
  }

  toJSON() {
    return {
      declared: this.declared.toNumber(),
      shipping: this.shipping.toNumber(),
      surcharges: this.surcharges.toNumber(),
      taxes: this.taxes.toNumber(),
      licenses: this.licenses.toNumber(),
      currency: this.currency,
      rate: this.rate,
      hiddenCostsUsd: this.hiddenCostsUsd().toNumber(),
      totalUsd: this.totalUsd().toNumber()
    };
  }
}

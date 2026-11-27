import Decimal from 'decimal.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export class Money {
  constructor(amount, currency = 'USD') {
    this.amount = new Decimal(amount ?? 0);
    this.currency = currency;
  }

  static from(amount, currency = 'USD') {
    return new Money(amount, currency);
  }

  static zero(currency = 'USD') {
    return new Money(0, currency);
  }

  plus(other) {
    return new Money(this.amount.plus(other.amount), this.currency);
  }

  minus(other) {
    return new Money(this.amount.minus(other.amount), this.currency);
  }

  times(factor) {
    return new Money(this.amount.times(factor), this.currency);
  }

  toUsd(rate) {
    if (this.currency === 'USD') return new Money(this.amount, 'USD');
    const safeRate = new Decimal(rate ?? 0);
    if (safeRate.lte(0)) return Money.zero('USD');
    return new Money(this.amount.div(safeRate), 'USD');
  }

  toNumber() {
    return Number(this.amount.toDecimalPlaces(2).toString());
  }

  toString() {
    return `${this.currency} ${this.amount.toDecimalPlaces(2).toString()}`;
  }
}

import { ExchangeRatePort } from '../../domain/ports/ExchangeRatePort.js';

export class BcvRateProvider extends ExchangeRatePort {
  constructor({ sourceUrl = 'https://www.bcv.org.ve/', fallbackRate = 130 } = {}) {
    super();
    this.sourceUrl = sourceUrl;
    this.fallbackRate = Number(fallbackRate) || 130;
    this.cache = null;
  }

  async getRate() {
    if (this.cache && Date.now() - this.cache.fetchedAt < 1000 * 60 * 60 * 6) return this.cache.value;
    let value = {
      rateUsd: this.fallbackRate,
      effectiveDate: new Date().toISOString().slice(0, 10),
      source: 'fallback'
    };
    try {
      const response = await fetch(this.sourceUrl, { signal: AbortSignal.timeout(8000) });
      if (response.ok) {
        const html = await response.text();
        const match = html.match(/id="dolar"[\s\S]{0,400}?<strong>[\s\S]{0,80}?([\d.,]+)/i)
          ?? html.match(/USD[\s\S]{0,300}?([\d]{2,4}[.,]\d{2})/i);
        if (match) {
          value = {
            rateUsd: Number(match[1].replace(/\./g, '').replace(',', '.')),
            effectiveDate: new Date().toISOString().slice(0, 10),
            source: this.sourceUrl
          };
        }
      }
    } catch {
      value.source = 'fallback';
    }
    this.cache = { value, fetchedAt: Date.now() };
    return value;
  }
}

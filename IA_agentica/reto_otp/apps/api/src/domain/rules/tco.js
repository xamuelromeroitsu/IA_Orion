import { TcoBreakdown } from '../valueObjects/TcoBreakdown.js';

function findAmount(text, keywords) {
  for (const keyword of keywords) {
    const match = text.match(new RegExp(`${keyword}[^0-9]{0,30}([0-9][0-9.,]*)`, 'i'));
    if (match) return Number(match[1].replace(/\./g, '').replace(',', '.'));
  }
  return 0;
}

export function computeTco(analysis, rate = 1) {
  const text = [
    ...(analysis.finePrint ?? []),
    ...(analysis.hiddenCosts ?? []),
    analysis.summary ?? '',
    analysis.conclusion ?? ''
  ].join(' ');
  const declared = analysis.calculatedTotal || analysis.declaredTotal || 0;
  const hasBcvSurcharge = /\+?\s*4\s*%\s*(?:por\s*)?(?:pago\s+en\s+)?bs|recargo\s+(?:de\s+)?4\s*%|tasa\s+bcv\s*\+?\s*4/i.test(text);
  const hasAnnualLicense = /licencia[^.]{0,80}(?:\/|por\s+)a[nñ]o|windows[^.]{0,80}evaluaci[oó]n/i.test(text);
  const hasVatExcluded = /(?:iva|impuesto)[^.]{0,40}(?:no\s+incluido|se\s+cobra|adicional|mas\s+iva)/i.test(text);

  const breakdown = new TcoBreakdown({
    declared,
    shipping: findAmount(text, ['flete', 'env[ií]o', 'transporte']),
    surcharges: hasBcvSurcharge ? declared * 0.04 : 0,
    taxes: hasVatExcluded ? declared * 0.16 : 0,
    licenses: hasAnnualLicense ? findAmount(text, ['licencia', 'windows']) : 0,
    currency: analysis.currency ?? 'USD',
    rate: analysis.currency === 'VES' ? rate : 1
  });

  return breakdown;
}

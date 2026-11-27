import Decimal from 'decimal.js';
import { AuditFinding } from '../entities/AuditFinding.js';

export function validateArithmetic(items = [], declaredTotal = 0, prefix = 'arith') {
  const calculatedTotal = items.reduce(
    (total, item) => total.plus(new Decimal(item.qty ?? 0).times(item.unitPrice ?? 0)),
    new Decimal(0)
  );
  const declared = new Decimal(declaredTotal ?? 0);
  const discrepancy = calculatedTotal.minus(declared).abs();
  const discrepancyPct = declared.isZero()
    ? 0
    : Number(discrepancy.div(declared).times(100).toDecimalPlaces(2).toString());
  const findings = [];

  if (discrepancy.gt('0.01')) {
    findings.push(new AuditFinding({
      id: `${prefix}_total_mismatch`,
      category: 'arithmetic',
      severity: discrepancyPct > 5 ? 'critical' : 'high',
      title: 'El total declarado no coincide con la suma de los ítems',
      detail: `Total declarado ${declared.toFixed(2)} vs. recalculado ${calculatedTotal.toFixed(2)} (${discrepancyPct}% de diferencia).`,
      evidence: `Suma de ${items.length} items recalculada con decimal.js`,
      amountImpactUsd: Number(discrepancy.toFixed(2))
    }));
  }

  items.forEach((item, index) => {
    const expected = new Decimal(item.qty ?? 0).times(item.unitPrice ?? 0);
    const stated = item.declaredSubtotal == null ? null : new Decimal(item.declaredSubtotal);
    if (stated != null && expected.minus(stated).abs().gt('0.01')) {
      findings.push(new AuditFinding({
        id: `${prefix}_item_${index}`,
        category: 'arithmetic',
        severity: 'medium',
        title: `Subtotal incorrecto en «${item.description}»`,
        detail: `Cantidad × precio unitario = ${expected.toFixed(2)}; declarado ${stated.toFixed(2)}.`,
        evidence: item.sourceCell ?? `Ítem ${index + 1}`,
        amountImpactUsd: Number(expected.minus(stated).abs().toFixed(2))
      }));
    }
  });

  return {
    calculatedTotal: Number(calculatedTotal.toFixed(2)),
    discrepancy: Number(discrepancy.toFixed(2)),
    discrepancyPct,
    findings
  };
}

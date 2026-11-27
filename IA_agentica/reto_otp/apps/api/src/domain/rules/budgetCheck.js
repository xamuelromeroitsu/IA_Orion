import Decimal from 'decimal.js';
import { AuditFinding } from '../entities/AuditFinding.js';

// Compara el costo total real contra el presupuesto sin usar números flotantes.
export function checkBudget(analysis, requirement) {
  const budgetUsd = new Decimal(Number(requirement?.budgetReferenceUsd ?? 0));
  if (budgetUsd.lte(0)) {
    return { isWithinBudget: true, reasons: [], findings: [], budgetUsd: 0, remainingUsd: null };
  }

  const tcoUsd = new Decimal(Number(analysis?.tcoUsd ?? 0));
  const isWithinBudget = tcoUsd.lte(budgetUsd);
  if (isWithinBudget) {
    return {
      isWithinBudget: true,
      reasons: [],
      findings: [],
      budgetUsd: Number(budgetUsd.toFixed(2)),
      remainingUsd: Number(budgetUsd.minus(tcoUsd).toFixed(2))
    };
  }

  const excessUsd = tcoUsd.minus(budgetUsd);
  const reason = 'El TCO supera el presupuesto disponible';
  const finding = new AuditFinding({
    id: 'budget_exceeded',
    category: 'general',
    severity: 'high',
    title: reason,
    detail: `TCO ${tcoUsd.toFixed(2)} USD frente a presupuesto ${budgetUsd.toFixed(2)} USD.`,
    evidence: `Exceso presupuestario de ${excessUsd.toFixed(2)} USD`,
    amountImpactUsd: Number(excessUsd.toFixed(2))
  });
  return {
    isWithinBudget: false,
    reasons: [reason],
    findings: [finding],
    budgetUsd: Number(budgetUsd.toFixed(2)),
    remainingUsd: Number(budgetUsd.minus(tcoUsd).toFixed(2))
  };
}

import Decimal from 'decimal.js';

function qualityScore(analysis, findings = []) {
  const warranty = Number(analysis.warrantyMonths ?? 0);
  const hasSupport = /soporte|mantenimiento|presencial/i.test(
    [analysis.summary ?? '', analysis.conclusion ?? '', ...(analysis.finePrint ?? [])].join(' ')
  );
  const penalties = findings.reduce((total, finding) => {
    if (finding.severity === 'critical') return total + 2;
    if (finding.severity === 'high') return total + 1;
    if (finding.severity === 'medium') return total + 0.25;
    return total;
  }, 0);
  return warranty / 12 + (hasSupport ? 1 : 0) - penalties;
}

export function rankAnalyses(analyses = [], evaluations = []) {
  const rows = analyses.map((analysis) => {
    const evaluation = evaluations.find((entry) => entry.analysisId === analysis.id) ?? {};
    const tcoUsd = Number(evaluation.tcoUsd ?? analysis.tcoUsd ?? analysis.realTotalUsd ?? 0);
    const declaredTotal = Number(analysis.declaredTotal ?? 0);
    return {
      analysisId: analysis.id,
      supplier: analysis.supplier ?? 'Proveedor sin identificar',
      fileName: analysis.fileName ?? '',
      kind: analysis.kind ?? 'unknown',
      declaredTotal,
      calculatedTotal: Number(analysis.calculatedTotal ?? declaredTotal),
      hiddenCostsUsd: Number(evaluation.hiddenCostsUsd ?? 0),
      tcoUsd,
      deviationPct: declaredTotal > 0 ? Number((((tcoUsd - declaredTotal) / declaredTotal) * 100).toFixed(2)) : 0,
      decision: evaluation.isDiscarded ? 'descartada' : 'valida',
      reason: evaluation.reasons?.join('; ') ?? '',
      score: qualityScore(analysis, evaluation.findings ?? []),
      pros: analysis.pros ?? [],
      cons: analysis.cons ?? []
    };
  });

  const validRows = rows.filter((row) => row.decision === 'valida');
  const discardedRows = rows.filter((row) => row.decision === 'descartada');

  validRows.sort((first, second) => {
    const byScore = new Decimal(second.score).minus(first.score);
    if (!byScore.isZero()) return byScore.toNumber();
    return new Decimal(first.tcoUsd).minus(second.tcoUsd).toNumber();
  });
  discardedRows.sort((first, second) => new Decimal(first.tcoUsd).minus(second.tcoUsd).toNumber());

  if (validRows.length > 0) validRows[0].decision = 'recomendada';
  const ranked = [...validRows, ...discardedRows];

  return {
    rows,
    ranking: ranked.map((row) => row.analysisId),
    recommendedId: validRows[0]?.analysisId ?? null,
    summary: validRows.length > 0
      ? `Se recomienda ${validRows[0].supplier} con un TCO de ${validRows[0].tcoUsd.toFixed(2)} USD. Se evaluaron ${rows.length} propuestas y se descartaron ${discardedRows.length}.`
      : `Ninguna propuesta cumple los criterios mínimos. Se evaluaron ${rows.length} propuestas.`
  };
}

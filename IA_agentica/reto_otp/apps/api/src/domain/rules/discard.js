import { AuditFinding } from '../entities/AuditFinding.js';

const technicalPatterns = [
  {
    pattern: /(?:ryzen\s*5\s*7600|ryzen\s*7\s*7700)[^.]{0,80}(?:b550|am4|ddr4)|(?:b550|am4|ddr4)[^.]{0,80}(?:ryzen\s*5\s*7600|ryzen\s*7\s*7700)/i,
    title: 'Incompatibilidad de socket y memoria',
    detail: 'Procesador AM5/DDR5 con placa AM4/DDR4: la combinación no es compatible.'
  },
  {
    pattern: /(?:64\s*gb)[^.]{0,80}(?:h610|2\s*dimm|m[aá]x\.?\s*32\s*gb)|(?:h610|2\s*dimm)[^.]{0,80}64\s*gb/i,
    title: 'Capacidad de memoria incompatible',
    detail: '64 GB declarados sobre placa con 2 slots DIMM y máximo 32 GB.'
  }
];

const qualityPatterns = [
  {
    pattern: /xeon|x99|reciclad|reacondicionad|segunda mano|usado/i,
    title: 'Equipos obsoletos o reciclados',
    detail: 'La propuesta ofrece hardware de segunda mano o plataformas descartadas para el uso requerido.'
  },
  {
    pattern: /windows[^.]{0,80}evaluaci[oó]n|licencia[^.]{0,60}(?:6[.,]600|se cobra|vence|despu[eé]s de 30)/i,
    title: 'Licencia temporal cobrada como permanente',
    detail: 'Software en modo evaluación con cargo anual posterior; no cumple el requisito de software libre.'
  },
  {
    pattern: /garant[ií]a[^.]{0,60}(?:solo|únicamente|exterior|30\s*d[ií]as)/i,
    title: 'Garantía insuficiente',
    detail: 'La garantía no cubre las necesidades del proyecto en condiciones claras.'
  }
];

export function evaluateDiscard(analysis, arithmeticResult, scopeResult) {
  const text = [
    ...(analysis.items ?? []).map((item) => item.description ?? ''),
    ...(analysis.finePrint ?? []),
    ...(analysis.hiddenCosts ?? []),
    analysis.summary ?? '',
    analysis.conclusion ?? ''
  ].join(' ');
  const reasons = [];
  const findings = [];

  if (analysis.injectionDetected) {
    reasons.push('Prompt injection detectado en el documento');
  }
  if (arithmeticResult.discrepancyPct > 1) {
    reasons.push(`Error aritmético del ${arithmeticResult.discrepancyPct}%`);
  }
  if (arithmeticResult.discrepancy > 0 && arithmeticResult.discrepancyPct > 1) {
    findings.push(...arithmeticResult.findings);
  }
  if (!scopeResult.scopeComplete) {
    reasons.push('Alcance incompleto frente a los requerimientos');
  }
  findings.push(...scopeResult.findings);

  for (const rule of technicalPatterns) {
    if (rule.pattern.test(text)) {
      reasons.push(rule.title);
      findings.push(new AuditFinding({
        id: `technical_${reasons.length}`,
        category: 'compatibility',
        severity: 'critical',
        title: rule.title,
        detail: rule.detail,
        evidence: rule.pattern.source,
        amountImpactUsd: 0
      }));
    }
  }

  for (const rule of qualityPatterns) {
    if (rule.pattern.test(text)) {
      reasons.push(rule.title);
      findings.push(new AuditFinding({
        id: `quality_${reasons.length}`,
        category: 'warranty',
        severity: 'high',
        title: rule.title,
        detail: rule.detail,
        evidence: rule.pattern.source,
        amountImpactUsd: 0
      }));
    }
  }

  const upsMatch = text.match(/(?:ups|protector)[^0-9]{0,30}(\d{3,4})\s*va/i);
  if (upsMatch && Number(upsMatch[1]) < 1200) {
    findings.push(new AuditFinding({
      id: 'ups_capacity_low',
      category: 'compatibility',
      severity: 'medium',
      title: 'Protección eléctrica de capacidad limitada',
      detail: `UPS de ${upsMatch[1]} VA puede ser insuficiente para 11 estaciones de trabajo.`,
      evidence: `${upsMatch[1]} VA`,
      amountImpactUsd: 0
    }));
  }

  return { isDiscarded: reasons.length > 0, reasons, findings };
}

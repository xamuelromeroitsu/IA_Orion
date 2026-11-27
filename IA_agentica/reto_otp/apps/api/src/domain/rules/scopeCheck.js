import { AuditFinding } from '../entities/AuditFinding.js';
import { defaultRequiredItems } from '../entities/ProjectRequirement.js';

const itemKeywords = {
  gabinete: ['gabinete', 'case', 'torre'],
  monitor: ['monitor', 'pantalla', 'display'],
  teclado: ['teclado', 'keyboard'],
  raton: ['rat[oó]n', 'mouse'],
  'protector electrico': ['protector', 'ups', 'regulador', 'estabilizador'],
  entrega: ['entrega', 'delivery'],
  instalacion: ['instalaci[oó]n', 'instalar', 'setup'],
  garantia: ['garant[ií]a', 'warranty']
};

function normalizedText(analysis) {
  const parts = [
    ...(analysis.items ?? []).map((item) => item.description ?? ''),
    ...(analysis.hiddenCosts ?? []),
    ...(analysis.finePrint ?? []),
    analysis.extractedText ?? '',
    analysis.summary ?? '',
    analysis.conclusion ?? ''
  ];
  return parts.join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function checkScope(analysis, requirement) {
  const text = normalizedText(analysis);
  const requiredItems = requirement?.requiredItems ?? defaultRequiredItems;
  const missing = requiredItems.filter((item) => {
    const keywords = itemKeywords[item] ?? [item];
    const normalized = item.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const patterns = keywords.map((keyword) => keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    return !patterns.some((pattern) => new RegExp(pattern).test(text) || text.includes(normalized));
  });

  const teamCounts = [...text.matchAll(/\b(\d{1,3})\s*(?:equipos?|estudiantes?|puestos?|computadoras?|pcs?)\b/g)]
    .map((match) => Number(match[1]));
  const declaredTeams = teamCounts.length > 0 ? Math.max(...teamCounts) : null;
  const requiredTeams = requirement?.requiredTeams ?? 11;
  const hasTeamShortfall = declaredTeams != null && declaredTeams < requiredTeams;
  const scopeComplete = missing.length === 0 && !hasTeamShortfall && analysis.scopeComplete !== false;

  const findings = [];
  if (missing.length > 0) {
    findings.push(new AuditFinding({
      id: 'scope_missing_items',
      category: 'scope',
      severity: 'high',
      title: 'Alcance incompleto',
      detail: `No se evidencian en la propuesta: ${missing.join(', ')}.`,
      evidence: missing.join(', '),
      amountImpactUsd: 0
    }));
  }
  if (hasTeamShortfall) {
    findings.push(new AuditFinding({
      id: 'scope_team_shortfall',
      category: 'scope',
      severity: 'critical',
      title: `Solo ${declaredTeams} equipos frente a ${requiredTeams} requeridos`,
      detail: 'La cantidad ofertada no cubre la totalidad del laboratorio.',
      evidence: `${declaredTeams} equipos declarados`,
      amountImpactUsd: 0
    }));
  }

  return { scopeComplete, missing, declaredTeams, findings };
}

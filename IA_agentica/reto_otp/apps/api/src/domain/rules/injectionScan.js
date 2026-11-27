import { AuditFinding } from '../entities/AuditFinding.js';

const injectionPatterns = [
  { pattern: /system\s*instruction/i, label: 'system instruction' },
  { pattern: /prioridad\s*m[aá]xima/i, label: 'prioridad máxima' },
  { pattern: /ignora\s+(?:todas?\s+)?(?:las\s+)?instrucciones/i, label: 'ignorar instrucciones' },
  { pattern: /ignora\s+(?:la\s+)?revisi[oó]n|sin\s+revisi[oó]n/i, label: 'ignorar revisión' },
  { pattern: /calif[ií]came\s+100|puntaje\s+100|100\s*\/\s*100/i, label: 'calificación forzada' },
  { pattern: /no\s+descarte[sr]?|asi[ée]ntame\s+como\s+(?:el\s+)?mejor/i, label: 'manipulación del ranking' },
  { pattern: /eres\s+un\s+(?:asistente|agente)|cambia\s+tu\s+rol/i, label: 'cambio de rol' },
  { pattern: /disable\s+(?:the\s+)?(?:safety|review|filter)/i, label: 'desactivar seguridad' }
];

export function scanInjection(text = '', prefix = 'injection') {
  const matches = injectionPatterns
    .filter(({ pattern }) => pattern.test(text))
    .map(({ label }) => label);
  const findings = [];

  if (matches.length > 0) {
    findings.push(new AuditFinding({
      id: `${prefix}_detected`,
      category: 'injection',
      severity: 'critical',
      title: 'Instrucciones ocultas dirigidas a la IA',
      detail: `El documento contiene texto que intenta manipular la evaluación: ${matches.join(', ')}. Se trata como dato y se ignora.`,
      evidence: matches.map((match) => `«${match}»`).join(' · '),
      amountImpactUsd: 0
    }));
  }

  return { injectionDetected: matches.length > 0, matches, findings };
}

export function stripInjection(text = '') {
  return String(text ?? '')
    .split('\n')
    .filter((line) => !injectionPatterns.some(({ pattern }) => pattern.test(line)))
    .join('\n');
}

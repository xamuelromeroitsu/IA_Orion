import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { scanInjection } from '../../domain/rules/injectionScan.js';
import { validateArithmetic } from '../../domain/rules/arithmetic.js';
import { checkScope } from '../../domain/rules/scopeCheck.js';
import { evaluateDiscard } from '../../domain/rules/discard.js';
import { computeTco } from '../../domain/rules/tco.js';

const extractionSchema = z.object({
  supplier: z.string().default('Proveedor sin identificar'),
  currency: z.enum(['USD', 'VES']).default('USD'),
  declaredTotal: z.coerce.number().nonnegative().default(0),
  items: z.array(z.object({
    description: z.string(),
    qty: z.coerce.number().nonnegative(),
    unitPrice: z.coerce.number().nonnegative(),
    declaredSubtotal: z.coerce.number().nullable().optional(),
    sourceCell: z.string().nullable().optional()
  })).default([]),
  hiddenCosts: z.array(z.string()).default([]),
  warrantyMonths: z.number().nonnegative().default(0),
  scopeComplete: z.boolean().default(true),
  injectionDetected: z.boolean().default(false),
  summary: z.string().default(''),
  conclusion: z.string().default(''),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  finePrint: z.array(z.string()).default([]),
  findings: z.array(z.object({
    category: z.enum(['arithmetic', 'hidden_cost', 'injection', 'scope', 'compatibility', 'market_price', 'warranty', 'general']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    title: z.string(),
    detail: z.string(),
    evidence: z.string().default(''),
    amountImpactUsd: z.number().default(0),
    sourceUrl: z.string().nullable().optional()
  })).default([]),
  confidence: z.number().min(0).max(1).default(0.7)
});

function buildItems(rawItems, arithmeticResult) {
  return rawItems.map((item, index) => ({
    description: item.description,
    qty: Number(item.qty ?? 0),
    unitPrice: Number(item.unitPrice ?? 0),
    declaredSubtotal: item.declaredSubtotal == null ? null : Number(item.declaredSubtotal),
    calculatedSubtotal: arithmeticResult.calculatedItems[index] ?? Number(item.qty ?? 0) * Number(item.unitPrice ?? 0),
    sourceCell: item.sourceCell ?? null
  }));
}

export class AnalyzeDocumentUseCase {
  constructor({ aiAuditor, analysisRepository, eventPublisher, exchangeRatePort }) {
    this.aiAuditor = aiAuditor;
    this.analysisRepository = analysisRepository;
    this.eventPublisher = eventPublisher;
    this.exchangeRatePort = exchangeRatePort;
  }

  async execute({ projectId, document, requirement }) {
    this.eventPublisher.publish({
      phase: 'reading',
      tool: 'document_parser',
      message: `Leyendo ${document.fileName}`,
      level: 'info'
    });

    const rawExtraction = await this.aiAuditor.analyze({
      fileName: document.fileName,
      mimeType: document.mime,
      kind: document.kind,
      text: document.extractedText,
      sheets: document.sheets ?? []
    });
    const extraction = extractionSchema.parse(rawExtraction);

    this.eventPublisher.publish({
      phase: 'audit',
      tool: 'injection_scan',
      message: `Escaneo anti-injection: ${extraction.injectionDetected ? 'instrucciones detectadas' : 'sin instrucciones'}`,
      level: extraction.injectionDetected ? 'warning' : 'info'
    });

    const scan = scanInjection(document.extractedText ?? '', document.id);
    const injectionDetected = extraction.injectionDetected || scan.injectionDetected;

    const arithmeticResult = validateArithmetic(extraction.items, extraction.declaredTotal, document.id);
    arithmeticResult.calculatedItems = extraction.items.map(
      (item) => Number(item.qty ?? 0) * Number(item.unitPrice ?? 0)
    );
    this.eventPublisher.publish({
      phase: 'audit',
      tool: 'calculator',
      message: `Total declarado ${extraction.declaredTotal.toFixed(2)} vs. recalculado ${arithmeticResult.calculatedTotal.toFixed(2)}`,
      level: arithmeticResult.discrepancy > 0 ? 'warning' : 'info'
    });

    const scope = checkScope({ ...extraction, injectionDetected }, requirement);
    this.eventPublisher.publish({
      phase: 'audit',
      tool: 'scope_check',
      message: scope.scopeComplete ? 'Alcance cubierto' : `Alcance incompleto: ${scope.missing.join(', ')}`,
      level: scope.scopeComplete ? 'info' : 'warning'
    });

    const discard = evaluateDiscard({ ...extraction, injectionDetected }, arithmeticResult, scope);
    const rate = await this.exchangeRatePort.getRate();
    const tco = computeTco({ ...extraction, injectionDetected }, rate.rateUsd);
    const items = buildItems(extraction.items, arithmeticResult);

    const findings = [
      ...extraction.findings.map((finding, index) => ({
        ...finding,
        id: finding.id || `${document.id}_ai_${index}`
      })),
      ...scan.findings.map((finding) => finding.toJSON()),
      ...arithmeticResult.findings.map((finding) => finding.toJSON()),
      ...scope.findings.map((finding) => finding.toJSON()),
      ...discard.findings.map((finding) => finding.toJSON())
    ];

    const analysis = {
      id: randomUUID(),
      documentId: document.id,
      projectId,
      fileName: document.fileName,
      supplier: extraction.supplier,
      kind: document.kind,
      currency: extraction.currency,
      declaredTotal: extraction.declaredTotal,
      calculatedTotal: arithmeticResult.calculatedTotal,
      realTotalUsd: tco.totalUsd().toNumber(),
      tcoUsd: tco.totalUsd().toNumber(),
      hiddenCosts: extraction.hiddenCosts,
      warrantyMonths: extraction.warrantyMonths,
      injectionDetected,
      scopeComplete: scope.scopeComplete,
      summary: extraction.summary,
      conclusion: extraction.conclusion,
      pros: extraction.pros,
      cons: extraction.cons.length > 0 ? extraction.cons : discard.reasons,
      finePrint: extraction.finePrint,
      items,
      findings,
      confidence: extraction.confidence,
      source: this.aiAuditor.source,
      analyzedAt: new Date().toISOString(),
      discardReasons: discard.reasons
    };

    await this.analysisRepository.save(analysis);
    this.eventPublisher.publish({
      phase: 'done',
      tool: 'document_analyzed',
      message: `Análisis de ${document.fileName} completado (${findings.length} hallazgos)`,
      level: discard.isDiscarded ? 'warning' : 'success'
    });

    return analysis;
  }
}

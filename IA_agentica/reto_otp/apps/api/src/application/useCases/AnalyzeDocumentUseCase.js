import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { Money } from '../../domain/valueObjects/Money.js';
import { scanInjection } from '../../domain/rules/injectionScan.js';
import { validateArithmetic } from '../../domain/rules/arithmetic.js';
import { checkScope } from '../../domain/rules/scopeCheck.js';
import { evaluateDiscard } from '../../domain/rules/discard.js';
import { computeTco } from '../../domain/rules/tco.js';

const extractionSchema = z.object({
  supplier: z.string(),
  isAnalyzable: z.boolean(),
  analysisIssue: z.string().default(''),
  isLegalDocument: z.boolean().default(false),
  legalEvidence: z.string().default(''),
  suspiciousFraud: z.boolean().default(false),
  fraudEvidence: z.string().default(''),
  currency: z.enum(['USD', 'VES']),
  declaredTotal: z.coerce.number().nonnegative(),
  items: z.array(z.object({
    description: z.string(),
    qty: z.coerce.number().nonnegative(),
    unitPrice: z.coerce.number().nonnegative(),
    declaredSubtotal: z.coerce.number().nullable().optional(),
    sourceCell: z.string().nullable().optional()
  })),
  hiddenCosts: z.array(z.string()).default([]),
  warrantyMonths: z.number().nonnegative().default(0),
  scopeComplete: z.boolean(),
  injectionDetected: z.boolean().default(false),
  summary: z.string(),
  conclusion: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  finePrint: z.array(z.string()),
  findings: z.array(z.object({
    category: z.enum(['arithmetic', 'hidden_cost', 'injection', 'scope', 'compatibility', 'market_price', 'warranty', 'general']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    title: z.string(),
    detail: z.string(),
    evidence: z.string().default(''),
    amountImpactUsd: z.number().default(0),
    sourceUrl: z.string().nullable().optional()
  })).default([]),
  confidence: z.number().min(0).max(1)
});

function documentNotAnalyzableError() {
  const error = new Error(
    'No se pudo analizar el documento porque no es legible o no contiene información suficiente. Verifique el archivo y vuelva a intentarlo.'
  );
  error.status = 422;
  error.code = 'document_not_analyzable';
  return error;
}

function normalizeEvidence(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function evidenceIsGrounded(evidence, text) {
  const normalizedEvidence = normalizeEvidence(evidence);
  if (!normalizedEvidence) return false;
  const normalizedText = normalizeEvidence(text);
  return normalizedText ? normalizedText.includes(normalizedEvidence) : true;
}

function containsLegalIndicator(evidence) {
  return /\b(contrato|clausulas?|marco legal|terminos y condiciones|bases legales|acuerdo legal|politica de privacidad|normativa)\b/
    .test(normalizeEvidence(evidence));
}

function containsFraudIndicator(evidence) {
  return /\b(estafa|fraude|suplantacion|phishing|pago a cuenta personal|transferir a un tercero)\b/
    .test(normalizeEvidence(evidence)) || scanInjection(evidence).injectionDetected;
}

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
    // Publicar inicio permite rastrear qué archivo entra al pipeline.
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
      sheets: document.sheets ?? [],
      requirement
    });
    // Zod rechaza respuestas incompletas antes de ejecutar reglas de negocio.
    const extractionResult = extractionSchema.safeParse(rawExtraction);
    if (!extractionResult.success || !extractionResult.data.isAnalyzable) throw documentNotAnalyzableError();
    const isSpreadsheet = document.kind === 'spreadsheet';
    if (isSpreadsheet && extractionResult.data.items.length === 0) throw documentNotAnalyzableError();
    const extraction = extractionResult.data;
    const extractedItems = isSpreadsheet
      ? extraction.items.map((item) => ({ ...item, qty: 1, declaredSubtotal: null }))
      : extraction.items;
    // Un XLSX usa una unidad por artículo; no suma cantidades de inventario.
    const declaredTotal = isSpreadsheet
      ? Number(extractedItems.reduce((total, item) => total + Number(item.unitPrice), 0).toFixed(2))
      : extraction.declaredTotal;
    const normalizedExtraction = { ...extraction, items: extractedItems, declaredTotal };
    const sourceText = document.extractedText ?? '';
    const isLegalDocument = containsLegalIndicator(sourceText)
      || extraction.isLegalDocument
        && containsLegalIndicator(extraction.legalEvidence)
        && evidenceIsGrounded(extraction.legalEvidence, sourceText);
    const suspiciousFraud = containsFraudIndicator(sourceText)
      || extraction.suspiciousFraud
        && containsFraudIndicator(extraction.fraudEvidence)
        && evidenceIsGrounded(extraction.fraudEvidence, sourceText);
    const canShowFinePrint = isLegalDocument || suspiciousFraud;
    const finePrint = canShowFinePrint
      ? extraction.finePrint.filter((item) => evidenceIsGrounded(item, sourceText))
      : [];
    const hiddenCosts = canShowFinePrint
      ? extraction.hiddenCosts.filter((item) => evidenceIsGrounded(item, sourceText))
      : [];
    const cons = canShowFinePrint
      ? extraction.cons
      : extraction.cons.filter((item) =>
        !/letra pequeña|clausul|costo (?:oculto|adicional)|recargo|flete|env[ií]o|garant[ií]a|condici[oó]n/i.test(item)
        && evidenceIsGrounded(item, sourceText));

    this.eventPublisher.publish({
      phase: 'audit',
      tool: 'injection_scan',
      message: `Escaneo anti-injection: ${extraction.injectionDetected ? 'instrucciones detectadas' : 'sin instrucciones'}`,
      level: extraction.injectionDetected ? 'warning' : 'info'
    });

    const scan = scanInjection(document.extractedText ?? '', document.id);
    const injectionDetected = extraction.injectionDetected || scan.injectionDetected;

    const arithmeticResult = validateArithmetic(normalizedExtraction.items, declaredTotal, document.id);
    arithmeticResult.calculatedItems = normalizedExtraction.items.map(
      (item) => Number(item.qty ?? 0) * Number(item.unitPrice ?? 0)
    );
    this.eventPublisher.publish({
      phase: 'audit',
      tool: 'calculator',
      message: isSpreadsheet
        ? `Precios unitarios de ${normalizedExtraction.items.length} artículo(s); cantidades disponibles ignoradas`
        : `Total declarado ${declaredTotal.toFixed(2)} vs. recalculado ${arithmeticResult.calculatedTotal.toFixed(2)}`,
      level: arithmeticResult.discrepancy > 0 ? 'warning' : 'info'
    });

    const scope = checkScope(
      { ...normalizedExtraction, hiddenCosts, finePrint, injectionDetected, extractedText: sourceText },
      requirement
    );
    // El alcance y la aritmética son evidencia; el ranking permanece determinista.
    this.eventPublisher.publish({
      phase: 'audit',
      tool: 'scope_check',
      message: scope.scopeComplete ? 'Alcance cubierto' : `Alcance incompleto: ${scope.missing.join(', ')}`,
      level: scope.scopeComplete ? 'info' : 'warning'
    });

    const discard = evaluateDiscard({ ...normalizedExtraction, injectionDetected }, arithmeticResult, scope);
    const rate = await this.exchangeRatePort.getRate();
    const tco = computeTco({ ...normalizedExtraction, hiddenCosts, finePrint, injectionDetected }, rate.rateUsd);
    const budgetReferenceUsd = Number(requirement?.budgetReferenceUsd ?? 0);
    const items = buildItems(normalizedExtraction.items, arithmeticResult).map((item) => {
      if (!isSpreadsheet) return item;
      const unitPriceUsd = extraction.currency === 'USD'
        ? item.unitPrice
        : rate.rateUsd > 0
          ? new Money(item.unitPrice, extraction.currency).toUsd(rate.rateUsd).toNumber()
          : null;
      return {
        ...item,
        unitPriceUsd,
        withinBudget: budgetReferenceUsd > 0 && unitPriceUsd != null
          ? unitPriceUsd <= budgetReferenceUsd
          : null
      };
    });

    const findings = [
      ...extraction.findings
        .filter((finding) => finding.category !== 'hidden_cost'
          || canShowFinePrint && evidenceIsGrounded(finding.evidence, sourceText))
        .map((finding, index) => ({
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
      declaredTotal,
      calculatedTotal: arithmeticResult.calculatedTotal,
      realTotalUsd: tco.totalUsd().toNumber(),
      tcoUsd: tco.totalUsd().toNumber(),
      hiddenCosts,
      warrantyMonths: extraction.warrantyMonths,
      injectionDetected,
      scopeComplete: scope.scopeComplete,
      summary: isSpreadsheet
        ? `Lista de precios analizada por unidad: ${items.length} artículo(s). Las cantidades de inventario no se suman; total mostrado corresponde a una unidad de cada artículo.`
        : extraction.summary,
      conclusion: isSpreadsheet
        ? budgetReferenceUsd > 0
          ? `Cada precio unitario se compara individualmente con el presupuesto disponible de USD ${budgetReferenceUsd.toFixed(2)}.`
          : 'No se indicó presupuesto disponible; se muestran los precios unitarios sin comparación presupuestaria.'
        : extraction.conclusion,
      pros: extraction.pros,
      cons: cons.length > 0 ? cons : discard.reasons,
      finePrint,
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

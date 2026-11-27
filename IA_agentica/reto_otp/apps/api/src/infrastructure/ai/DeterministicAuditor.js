import { scanInjection } from '../../domain/rules/injectionScan.js';
import { AiAuditorPort } from '../../domain/ports/AiAuditorPort.js';

function stripAccents(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function parseAmount(raw) {
  if (raw == null) return 0;
  let text = String(raw).trim().replace(/[^\d.,]/g, '');
  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');
  if (lastComma >= 0 && lastDot >= 0) {
    text = lastComma > lastDot
      ? text.replace(/\./g, '').replace(',', '.')
      : text.replace(/,/g, '');
  } else if (lastComma >= 0) {
    text = /^\d{1,3}(,\d{3})+$/.test(text) ? text.replace(/,/g, '') : text.replace(',', '.');
  } else if (lastDot >= 0 && /^\d{1,3}(\.\d{3})+$/.test(text)) {
    text = text.replace(/\./g, '');
  }
  const amount = Number(text);
  return Number.isFinite(amount) ? amount : 0;
}

function supplierFromFileName(fileName) {
  const match = String(fileName ?? '').match(/^Propuesta_(\d+)_(.+?)(?:_CA)?(?:\.[^.]+)?$/i);
  return match ? match[2].replace(/_/g, ' ') : 'Proveedor sin identificar';
}

function itemsFromSheets(sheets = []) {
  const items = [];
  for (const sheet of sheets) {
    for (const row of sheet.rows ?? []) {
      const entries = Object.entries(row);
      const descriptionEntry = entries.find(([key]) => /descripcion|detalle|item|equipo|producto|articulo|nombre/i.test(stripAccents(key).toLowerCase()));
      const priceEntry = entries.find(([key]) => /precio|unitario|p\.?u\.?/i.test(stripAccents(key).toLowerCase()));
      if (!descriptionEntry || !priceEntry) continue;
      const description = String(descriptionEntry[1] ?? '').trim();
      if (!description || /total|subtotal/i.test(description)) continue;
      const unitPrice = parseAmount(priceEntry[1]);
      if (unitPrice <= 0) continue;
      items.push({
        description,
        qty: 1,
        unitPrice,
        declaredSubtotal: null,
        sourceCell: `${sheet.name}:${descriptionEntry[0]}`
      });
    }
  }
  return items;
}

function itemsFromText(text) {
  const items = [];
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const simple = line.match(/^(.{3,70}?)\s*(\d{1,3})\s*(?:x|×|\*)\s*([\d.,]+)/i);
    if (simple) {
      items.push({
        description: simple[1].replace(/[:|]/g, '').trim(),
        qty: Number(simple[2]),
        unitPrice: parseAmount(simple[3]),
        declaredSubtotal: null,
        sourceCell: null
      });
      continue;
    }
    const columns = line.match(/^(.{3,60}?)[\s|]+(\d{1,3})[\s|]+([\d.,]{3,})[\s|]+([\d.,]{3,})/);
    if (columns) {
      items.push({
        description: columns[1].replace(/[:|]/g, '').trim(),
        qty: Number(columns[2]),
        unitPrice: parseAmount(columns[3]),
        declaredSubtotal: parseAmount(columns[4]),
        sourceCell: null
      });
    }
  }
  return items;
}

function findDeclaredTotal(text, sheets, calculatedTotal) {
  if (calculatedTotal > 0) return calculatedTotal;
  const normalized = stripAccents(text).toLowerCase();
  const candidates = [];
  for (const match of normalized.matchAll(/(?:total|monto|presupuesto|gran\s+total)[^0-9\n]{0,40}([\d.,]{3,})/g)) {
    candidates.push(parseAmount(match[1]));
  }
  const withCurrency = [...normalized.matchAll(/(?:usd|bs\.?|bolivares)\s*([\d.,]{3,})/g)].map((match) => parseAmount(match[1]));
  candidates.push(...withCurrency);
  const plausible = candidates.filter((amount) => amount >= 100);
  return plausible.length > 0 ? Math.max(...plausible) : 0;
}

function findWarranty(text) {
  const match = stripAccents(text).match(/(\d{1,3})\s*meses?/i);
  return match ? Number(match[1]) : 0;
}

function findFinePrint(text) {
  const keywords = /flete|envio|transporte|recargo|gestion|iva|impuesto|licencia|seguro|evaluacion|tasa\s+bcv|condicion|nota|observacion|garantia|pagos?\s+en\s+bs/i;
  return text.split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 8 && keywords.test(stripAccents(line)))
    .slice(0, 12);
}

function findEvidenceLine(text, pattern) {
  return text.split('\n').map((line) => line.trim()).find((line) => pattern.test(stripAccents(line).toLowerCase())) ?? '';
}

function isLegalFramework(text) {
  return /\b(contrato|clausulas?|marco legal|terminos y condiciones|bases legales|acuerdo legal|politica de privacidad|normativa)\b/i
    .test(stripAccents(text).toLowerCase());
}

function findFraudEvidence(text, injectionDetected) {
  if (injectionDetected) {
    return text.split('\n').map((line) => line.trim()).find((line) => scanInjection(line).injectionDetected) ?? '';
  }
  return findEvidenceLine(text, /\b(estafa|fraude|suplantacion|phishing|pago a cuenta personal|transferir a un tercero)\b/i);
}

function buildPros(text) {
  const normalized = stripAccents(text).toLowerCase();
  const pros = [];
  if (/24\s*meses|garantia\s+extendeda/.test(normalized)) pros.push('Garantía de 24 meses');
  if (/soporte|mantenimiento|presencial/.test(normalized)) pros.push('Soporte y mantenimiento incluidos');
  if (/ddr5|am5/.test(normalized)) pros.push('Plataforma AM5/DDR5 actualizable');
  if (/rtx\s*40|rx\s*7600/.test(normalized)) pros.push('GPU adecuada para diseño 3D y video');
  if (/ubuntu|software\s+libre/.test(normalized)) pros.push('Software libre sin licencias recurrentes');
  if (/ups|protector/.test(normalized)) pros.push('Protección eléctrica incluida');
  return pros;
}

export class DeterministicAuditor extends AiAuditorPort {
  constructor() {
    super();
    this.source = 'deterministic';
  }

  async analyze({ fileName, text = '', sheets = [] }) {
    const normalized = stripAccents(text).toLowerCase();
    const items = [...itemsFromSheets(sheets), ...itemsFromText(text)];
    const declaredTotal = findDeclaredTotal(text, sheets, 0);
    if ((text.trim().length < 30 && items.length === 0) || (items.length === 0 && declaredTotal <= 0)) {
      const error = new Error(
        'No se pudo analizar el documento porque no es legible o no contiene información suficiente. Verifique el archivo y vuelva a intentarlo.'
      );
      error.status = 422;
      error.code = 'document_not_analyzable';
      throw error;
    }
    const injection = scanInjection(text, fileName);
    const legalEvidence = findEvidenceLine(
      text,
      /\b(contrato|clausulas?|marco legal|terminos y condiciones|bases legales|acuerdo legal|politica de privacidad|normativa)\b/i
    );
    const fraudEvidence = findFraudEvidence(text, injection.injectionDetected);
    const isLegalDocument = Boolean(legalEvidence) || isLegalFramework(text);
    const suspiciousFraud = Boolean(fraudEvidence) || injection.injectionDetected;
    const finePrint = isLegalDocument || suspiciousFraud ? findFinePrint(text) : [];
    const hiddenCosts = finePrint.filter((line) => /flete|recargo|gestion|iva|licencia|seguro|tasa\s+bcv/i.test(stripAccents(line)));
    const warrantyMonths = findWarranty(text);
    const currency = /bs\.?|bolivares|ves\b/.test(normalized) ? 'VES' : 'USD';
    const scopeComplete = !(/\b10\s*(?:equipos|pcs|computadoras)/.test(normalized));
    const pros = buildPros(text);
    const cons = [...hiddenCosts];
    if (injection.injectionDetected) cons.push('Contiene instrucciones ocultas dirigidas a la IA');

    return {
      supplier: supplierFromFileName(fileName),
      isAnalyzable: true,
      analysisIssue: '',
      isLegalDocument,
      legalEvidence,
      suspiciousFraud,
      fraudEvidence,
      currency,
      declaredTotal,
      items,
      hiddenCosts,
      warrantyMonths,
      scopeComplete,
      injectionDetected: injection.injectionDetected,
      summary: `Proveedor: ${supplierFromFileName(fileName)}. ${declaredTotal > 0 ? `Total declarado detectado: ${currency} ${declaredTotal.toFixed(2)}.` : 'No se detectó un total declarado.'} Se extrajeron ${items.length} renglones y ${finePrint.length} cláusulas relevantes del texto.`,
      conclusion: injection.injectionDetected
        ? 'El documento incluye instrucciones ocultas: se procesa solo como dato y se marca para descarte.'
        : hiddenCosts.length > 0
          ? 'El texto extraído menciona costos adicionales que deben incluirse en el TCO antes de comparar.'
          : 'No se detectaron costos adicionales en el texto extraído; esto no confirma su ausencia.',
      pros,
      cons,
      finePrint,
      findings: [],
      confidence: text.length > 40 ? 0.62 : 0.45
    };
  }

  async ask({ question, analyses = [] }) {
    const terms = question.toLowerCase().split(/\s+/).filter((term) => term.length > 3);
    const selected = analyses.filter((analysis) =>
      terms.some((term) => [analysis.supplier, analysis.summary, analysis.conclusion].join(' ').toLowerCase().includes(term))
    );
    const source = selected.length > 0 ? selected : analyses;
    const answer = source.length === 0
      ? 'No hay documentos analizados todavía.'
      : source.slice(0, 4).map((analysis) =>
        `- ${analysis.supplier}: TCO ${analysis.tcoUsd.toFixed(2)} USD. ${analysis.conclusion}`
      ).join('\n');
    return { answer, sources: source.slice(0, 4).map((analysis) => analysis.fileName) };
  }
}

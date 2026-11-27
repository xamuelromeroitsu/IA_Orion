import { scanInjection } from '../../domain/rules/injectionScan.js';
import { AiAuditorPort } from '../../domain/ports/AiAuditorPort.js';

function stripAccents(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function parseAmount(raw) {
  if (raw == null) return 0;
  let text = String(raw).trim();
  if (text.includes(',') && text.includes('.')) {
    text = text.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    text = text.replace(/\./g, '');
  } else if (text.includes(',')) {
    text = text.replace(',', '.');
  }
  const amount = Number(text.replace(/[^\d.]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
}

function supplierFromFileName(fileName) {
  const match = String(fileName ?? '').match(/^Propuesta_(\d+)_(.+?)(?:_CA)?(?:\.[^.]+)?$/i);
  if (!match) return String(fileName ?? '').replace(/\.[^.]+$/, '').replace(/_/g, ' ');
  return match[2].replace(/_/g, ' ');
}

function itemsFromSheets(sheets = []) {
  const items = [];
  for (const sheet of sheets) {
    for (const row of sheet.rows ?? []) {
      const entries = Object.entries(row);
      const descriptionEntry = entries.find(([key]) => /descripcion|detalle|item|equipo|producto/i.test(key));
      const qtyEntry = entries.find(([key]) => /cantidad|qty|unidades/i.test(key));
      const priceEntry = entries.find(([key]) => /precio|unitario|p\.?u\.?/i.test(key));
      const subtotalEntry = entries.find(([key]) => /subtotal|importe|total/i.test(key));
      if (!descriptionEntry || !qtyEntry || !priceEntry) continue;
      const description = String(descriptionEntry[1] ?? '').trim();
      if (!description || /total|subtotal/i.test(description)) continue;
      const qty = parseAmount(qtyEntry[1]);
      const unitPrice = parseAmount(priceEntry[1]);
      if (qty <= 0 || unitPrice <= 0) continue;
      items.push({
        description,
        qty,
        unitPrice,
        declaredSubtotal: subtotalEntry ? parseAmount(subtotalEntry[1]) || qty * unitPrice : qty * unitPrice,
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
        declaredSubtotal: Number(simple[2]) * parseAmount(simple[3]),
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

function buildPros(text) {
  const normalized = stripAccents(text).toLowerCase();
  const pros = [];
  if (/24\s*meses|garantia\s+extendeda/.test(normalized)) pros.push('Garantía de 24 meses');
  if (/soporte|mantenimiento|presencial/.test(normalized)) pros.push('Soporte y mantenimiento incluidos');
  if (/ddr5|am5/.test(normalized)) pros.push('Plataforma AM5/DDR5 actualizable');
  if (/rtx\s*40|rx\s*7600/.test(normalized)) pros.push('GPU adecuada para diseño 3D y video');
  if (/ubuntu|software\s+libre/.test(normalized)) pros.push('Software libre sin licencias recurrentes');
  if (/ups|protector/.test(normalized)) pros.push('Protección eléctrica incluida');
  if (pros.length === 0) pros.push('Cotización recibida y disponible para revisión');
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
    const calculatedTotalFromItems = items.reduce((total, item) => total + item.qty * item.unitPrice, 0);
    const declaredTotal = findDeclaredTotal(text, sheets, 0) || calculatedTotalFromItems;
    const finePrint = findFinePrint(text);
    const hiddenCosts = finePrint.filter((line) => /flete|recargo|gestion|iva|licencia|seguro|tasa\s+bcv/i.test(stripAccents(line)));
    const injection = scanInjection(text, fileName);
    const warrantyMonths = findWarranty(text);
    const currency = /bs\.?|bolivares|ves\b/.test(normalized) ? 'VES' : 'USD';
    const scopeComplete = !(/\b10\s*(?:equipos|pcs|computadoras)/.test(normalized));
    const pros = buildPros(text);
    const cons = [...hiddenCosts];
    if (warrantyMonths === 0) cons.push('No se especifica garantía clara');
    if (injection.injectionDetected) cons.push('Contiene instrucciones ocultas dirigidas a la IA');

    return {
      supplier: supplierFromFileName(fileName),
      currency,
      declaredTotal,
      items,
      hiddenCosts,
      warrantyMonths,
      scopeComplete,
      injectionDetected: injection.injectionDetected,
      summary: `Propuesta de ${supplierFromFileName(fileName)} por ${currency} ${declaredTotal.toFixed(2)}. Se extrajeron ${items.length} renglones y ${finePrint.length} cláusulas relevantes del texto.`,
      conclusion: injection.injectionDetected
        ? 'El documento incluye instrucciones ocultas: se procesa solo como dato y se marca para descarte.'
        : hiddenCosts.length > 0
          ? 'La oferta tiene costos adicionales en letra pequeña que deben incluirse en el TCO antes de comparar.'
          : 'La oferta es comparable después de validar aritmética, alcance y garantía.',
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

import { createRequire } from 'node:module';
import { parseXlsx } from './XlsxReader.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const spreadsheetMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Identifica el tipo de archivo por su MIME para seleccionar la ruta de lectura.
export function classifyDocument(mime = '') {
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('image/')) return 'image';
  if (mime === spreadsheetMime || mime === 'application/vnd.ms-excel') return 'spreadsheet';
  return 'unknown';
}

// Normaliza el texto PDF; conserva saltos útiles y elimina espacios defectuosos.
function normalizeExtractedText(text) {
  return String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Extrae texto de PDF o XLSX y deja las imágenes para análisis visual posterior.
export async function extractDocument({ buffer, mime, fileName, pdfParser = pdfParse }) {
  const kind = classifyDocument(mime);
  let extractedText = '';
  let sheets = [];
  let calculatedTotal = 0;

  if (kind === 'pdf') {
    try {
      const result = await pdfParser(buffer);
      extractedText = normalizeExtractedText(result.text);
    } catch {
      extractedText = '';
    }
  } else if (kind === 'spreadsheet') {
    const parsed = parseXlsx(buffer, fileName);
    extractedText = parsed.text;
    sheets = parsed.sheets;
    calculatedTotal = parsed.calculatedTotal;
  }

  return { kind, extractedText, sheets, calculatedTotal };
}

import { createRequire } from 'node:module';
import { parseXlsx } from './XlsxReader.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const spreadsheetMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export function classifyDocument(mime = '') {
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('image/')) return 'image';
  if (mime === spreadsheetMime || mime === 'application/vnd.ms-excel') return 'spreadsheet';
  return 'unknown';
}

export async function extractDocument({ buffer, mime, fileName }) {
  const kind = classifyDocument(mime);
  let extractedText = '';
  let sheets = [];
  let calculatedTotal = 0;

  if (kind === 'pdf') {
    try {
      const result = await pdfParse(buffer);
      extractedText = result.text ?? '';
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

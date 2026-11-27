import { beforeEach, describe, expect, it, vi } from 'vitest';
import XLSX from 'xlsx';

vi.mock('pdf-parse', () => ({
  default: vi.fn()
}));

describe('extractDocument', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('clasifica PDF y devuelve el texto nativo extraído', async () => {
    const { extractDocument, classifyDocument } = await import('./TextExtractor.js');
    const pdfParser = vi.fn().mockResolvedValue({ text: 'Propuesta por 10 equipos' });

    const result = await extractDocument({
      buffer: Buffer.from('%PDF-1.4'),
      mime: 'application/pdf',
      fileName: 'propuesta.pdf',
      pdfParser
    });

    expect(classifyDocument('application/pdf')).toBe('pdf');
    expect(result.kind).toBe('pdf');
    expect(result.extractedText).toBe('Propuesta por 10 equipos');
  });

  it('clasifica XLSX y adjunta hojas normalizadas', async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([['Producto', 'Precio'], ['Laptop', 1200]]),
      'Oferta'
    );
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const { extractDocument, classifyDocument } = await import('./TextExtractor.js');

    const result = await extractDocument({
      buffer,
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileName: 'propuesta.xlsx'
    });

    expect(classifyDocument('application/vnd.ms-excel')).toBe('spreadsheet');
    expect(result.kind).toBe('spreadsheet');
    expect(result.sheets[0].rows[0].Producto).toBe('Laptop');
    expect(result.extractedText).toContain('Laptop');
  });

  it('marca como ilegible un PDF sin texto extraído', async () => {
    const { extractDocument } = await import('./TextExtractor.js');
    const pdfParser = vi.fn().mockResolvedValue({ text: '' });

    const result = await extractDocument({
      buffer: Buffer.from('%PDF-escaner'),
      mime: 'application/pdf',
      fileName: 'escaneado.pdf',
      pdfParser
    });

    expect(result.kind).toBe('pdf');
    expect(result.extractedText).toBe('');
  });
});

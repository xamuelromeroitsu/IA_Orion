import { describe, expect, it } from 'vitest';
import { DeterministicAuditor } from './DeterministicAuditor.js';

describe('DeterministicAuditor', () => {
  it('rejects documents without readable proposal data', async () => {
    const auditor = new DeterministicAuditor();

    await expect(auditor.analyze({ fileName: 'ilegible.pdf', text: '' }))
      .rejects.toMatchObject({ status: 422, code: 'document_not_analyzable' });
  });

  it('does not present calculated subtotals or filenames as extracted facts', async () => {
    const auditor = new DeterministicAuditor();
    const result = await auditor.analyze({
      fileName: 'cotizacion-123.pdf',
      text: 'Monitores 2 x 100 USD\nTotal declarado USD 200'
    });

    expect(result.isAnalyzable).toBe(true);
    expect(result.supplier).toBe('Proveedor sin identificar');
    expect(result.declaredTotal).toBe(200);
    expect(result.items[0].declaredSubtotal).toBeNull();
  });

  it('only extracts fine print for legal documents or suspicious fraud evidence', async () => {
    const auditor = new DeterministicAuditor();
    const priceList = await auditor.analyze({
      fileName: 'prices.xlsx',
      text: 'Lista de precios: total USD 200. Garantía 12 meses. Envío disponible.'
    });
    const legalDocument = await auditor.analyze({
      fileName: 'contrato.txt',
      text: 'Contrato legal. Total declarado USD 200.\nCláusula: envío con costo adicional.'
    });

    expect(priceList.finePrint).toEqual([]);
    expect(priceList.hiddenCosts).toEqual([]);
    expect(legalDocument.finePrint).toContain('Cláusula: envío con costo adicional.');
  });

  it('uses one unit for spreadsheet price-list rows regardless of stock quantity', async () => {
    const auditor = new DeterministicAuditor();
    const result = await auditor.analyze({
      fileName: 'prices.xlsx',
      text: '',
      sheets: [{
        name: 'Precios',
        rows: [{ 'Descripción': 'Teléfono', 'Precio unitario': '$1,250.00', 'Disponibles': 40 }]
      }]
    });

    expect(result.items).toEqual([
      expect.objectContaining({ description: 'Teléfono', qty: 1, unitPrice: 1250, declaredSubtotal: null })
    ]);
  });
});

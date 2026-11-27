import { describe, expect, it } from 'vitest';
import XLSX from 'xlsx';
import { parseXlsx } from './XlsxReader.js';

describe('parseXlsx', () => {
  it('lee encabezados, filas y recalcula fórmulas SIN usar valores en caché', () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ['Descripción', 'Cantidad', 'Precio unitario', 'Subtotal'],
      ['Monitor', 2, 300, null],
      ['Teclado', 5, 40, null]
    ]);
    sheet.D2 = { t: 'n', f: 'B2*C2', v: 999 };
    sheet.D3 = { t: 'n', f: 'B3*C3', v: 888 };
    XLSX.utils.book_append_sheet(workbook, sheet, 'Precios');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const parsed = parseXlsx(buffer, 'presupuesto.xlsx');

    expect(parsed.sheets).toHaveLength(1);
    expect(parsed.sheets[0].rows).toHaveLength(2);
    expect(parsed.sheets[0].rows[0]).toMatchObject({
      Descripción: 'Monitor',
      Cantidad: 2,
      'Precio unitario': 300
    });
    expect(parsed.sheets[0].recalculated).toContainEqual({
      cell: 'D2',
      formula: 'B2*C2',
      value: 600
    });
    expect(parsed.calculatedTotal).toBe(600);
  });

  it('devuelve texto vacío para un libro XLSX sin filas', () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([]), 'Vacía');

    const parsed = parseXlsx(
      XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
      'vacia.xlsx'
    );

    expect(parsed.text).toBe('');
    expect(parsed.sheets[0].rows).toEqual([]);
  });

  it('detecta la fila de encabezados después de un título y una cabecera comercial', () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ['COTIZACIÓN — TECNOANDES SOLUCIONES C.A.'],
      ['Cliente:', 'Instituto Nacional'],
      ['Ítem / Componente', 'Especificación Técnica', 'Cant.', 'Precio Unit. (USD)', 'Subtotal (USD)'],
      ['Gabinete', 'ATX RGB', 1, 350, 350],
      ['Monitor', '27 pulgadas', 11, 180, 1980]
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Cotizacion');

    const parsed = parseXlsx(
      XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
      'tecnoandes.xlsx'
    );

    expect(parsed.sheets[0].rows).toHaveLength(2);
    expect(parsed.sheets[0].rows[0]['Ítem / Componente']).toBe('Gabinete');
    expect(parsed.sheets[0].rows[1]['Precio Unit. (USD)']).toBe(180);
  });
});

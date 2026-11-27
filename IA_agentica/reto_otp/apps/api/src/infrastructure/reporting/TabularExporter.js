import * as XLSX from 'xlsx';
import { stringify } from 'csv-stringify/sync';

const headers = [
  ['Proveedor', 'Archivo', 'Declarado', 'Recalculado', 'Costos ocultos USD', 'TCO USD', 'Desviación %', 'Decisión', 'Razón']
];

function rowsFrom(evaluation) {
  return evaluation.comparison.map((row) => [
    row.supplier,
    row.fileName,
    row.declaredTotal.toFixed(2),
    row.calculatedTotal.toFixed(2),
    row.hiddenCostsUsd.toFixed(2),
    row.tcoUsd.toFixed(2),
    row.deviationPct.toFixed(2),
    row.decision,
    row.reason
  ]);
}

export function buildComparisonCsv(evaluation) {
  return stringify([...headers, ...rowsFrom(evaluation)]);
}

export function buildComparisonXlsx(evaluation) {
  const worksheet = XLSX.utils.aoa_to_sheet([...headers, ...rowsFrom(evaluation)]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Comparativa');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

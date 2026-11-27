import XLSX from 'xlsx';

function cellValue(sheet, address) {
  const cell = sheet[address];
  if (!cell) return 0;
  if (cell.v != null) return Number(String(cell.v).replace(/[^\d.-]/g, '')) || 0;
  if (cell.f) return evaluateFormula(sheet, cell.f);
  return 0;
}

function evaluateFormula(sheet, formula, depth = 0) {
  if (depth > 8) return 0;
  const expression = String(formula ?? '').replace(/^=/, '').replace(/\$/g, '').toUpperCase().trim();
  const sumRange = expression.match(/^SUM\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
  if (sumRange) {
    const [start, end] = sumRange.slice(1);
    const startCol = start.match(/^[A-Z]+/)[0];
    const endCol = end.match(/^[A-Z]+/)[0];
    const startRow = Number(start.match(/\d+$/)[0]);
    const endRow = Number(end.match(/\d+$/)[0]);
    let total = 0;
    for (let row = startRow; row <= endRow; row += 1) {
      for (let col = startCol.charCodeAt(0); col <= endCol.charCodeAt(0); col += 1) {
        const address = `${String.fromCharCode(col)}${row}`;
        total += cellValue(sheet, address);
      }
    }
    return total;
  }
  const product = expression.match(/^([A-Z]+\d+)\*([A-Z]+\d+)$/);
  if (product) return cellValue(sheet, product[1]) * cellValue(sheet, product[2]);
  const addition = expression.match(/^([A-Z]+\d+)\+([A-Z]+\d+)$/);
  if (addition) return cellValue(sheet, addition[1]) + cellValue(sheet, addition[2]);
  const rangeSum = expression.match(/^SUM\(([A-Z]+\d+(?:,[A-Z]+\d+)+)\)$/);
  if (rangeSum) {
    return rangeSum[1].split(',').reduce((total, address) => total + cellValue(sheet, address), 0);
  }
  const literal = expression.match(/^\d+(?:\.\d+)?$/);
  if (literal) return Number(literal[0]);
  return 0;
}

function sheetRows(sheet) {
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
  if (matrix.length === 0) return [];
  const headers = matrix[0].map((value, index) => String(value || `columna_${index + 1}`));
  return matrix.slice(1)
    .filter((row) => row.some((cell) => cell !== '' && cell != null))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
}

export function parseXlsx(buffer, fileName = 'propuesta.xlsx') {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellFormula: true, cellNF: true });
  const sheets = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const rows = sheetRows(sheet);
    const recalculated = Object.keys(sheet)
      .filter((address) => !address.startsWith('!') && sheet[address]?.f)
      .map((address) => ({ cell: address, formula: sheet[address].f, value: evaluateFormula(sheet, sheet[address].f) }));
    return { name, rows, recalculated };
  });

  const allRows = sheets.flatMap((sheet) => sheet.rows);
  const text = allRows.map((row) => Object.values(row).join(' | ')).join('\n');
  const calculatedTotal = Math.max(
    0,
    ...sheets.flatMap((sheet) => sheet.recalculated.map((entry) => entry.value))
  );

  return { fileName, text, sheets, calculatedTotal };
}

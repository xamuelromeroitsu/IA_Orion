import XLSX from 'xlsx';

// Convierte el valor visible de una celda sin confiar en el resultado cacheado.
function cellValue(sheet, address) {
  const cell = sheet[address];
  if (!cell) return 0;
  if (cell.f) return evaluateFormula(sheet, cell.f);
  if (cell.v != null) {
    const text = String(cell.v).trim();
    if (/^\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?$/.test(text)) {
      return Number(text.replace(/\./g, '').replace(',', '.'));
    }
    return Number(text.replace(/[^\d.-]/g, '')) || 0;
  }
  return 0;
}

// Convierte columnas Excel como AA, AB o AAA a índices numéricos.
function columnNumber(address) {
  const column = address.match(/^[A-Z]+/)?.[0] ?? 'A';
  return [...column].reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0);
}

// Convierte un índice numérico a una columna Excel.
function columnAddress(number) {
  let value = number;
  let address = '';
  while (value > 0) {
    const remainder = (value - 1) % 26;
    address = String.fromCharCode(65 + remainder) + address;
    value = Math.floor((value - 1) / 26);
  }
  return address;
}

// Recorre rangos continuos y suma cada celda recalculada.
function evaluateFormula(sheet, formula, depth = 0) {
  if (depth > 8) return 0;
  const expression = String(formula ?? '').replace(/^=/, '').replace(/\$/g, '').toUpperCase().trim();
  const sumRange = expression.match(/^SUM\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
  if (sumRange) {
    const [start, end] = sumRange.slice(1);
    const startColumn = start.match(/^[A-Z]+/)[0];
    const endColumn = end.match(/^[A-Z]+/)[0];
    const startRow = Number(start.match(/\d+$/)[0]);
    const endRow = Number(end.match(/\d+$/)[0]);
    let total = 0;
    for (let row = Math.min(startRow, endRow); row <= Math.max(startRow, endRow); row += 1) {
      for (let column = columnNumber(startColumn); column <= columnNumber(endColumn); column += 1) {
        const address = `${columnAddress(column)}${row}`;
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

// Convierte una hoja en filas con nombres de columna y descarta filas totalmente vacías.
function sheetRows(sheet) {
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
  if (matrix.length === 0) return [];

  // Una cotización puede tener título, datos comerciales y luego la tabla real.
  const headerIndex = matrix.findIndex((row, index) => {
    if (index > 25) return false;
    const normalized = row.map((value) => String(value ?? '').normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase());
    const hasDescription = normalized.some((value) => /descripcion|detalle|item|componente|producto|articulo|nombre/.test(value));
    const hasPrice = normalized.some((value) => /precio|unitario|p\.?u\.?|subtotal|total/.test(value));
    return hasDescription && hasPrice;
  });
  if (headerIndex < 0) {
    const headers = matrix[0].map((value, index) => String(value || `columna_${index + 1}`));
    return matrix.slice(1)
      .filter((row) => row.some((cell) => cell !== '' && cell != null))
      .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
  }

  const headers = matrix[headerIndex].map((value, index) => String(value || `columna_${index + 1}`));
  return matrix.slice(headerIndex + 1)
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

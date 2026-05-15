import { Workbook } from 'exceljs';

// Read a single cell value from an Excel workbook. Coordinates are 1-indexed to match ExcelJS conventions.
export async function readCell(
  filePath: string,
  sheetName: string,
  row: number,
  col: number,
): Promise<string> {
  const workbook = new Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found in ${filePath}.`);
  }
  return String(sheet.getRow(row).getCell(col).value ?? '');
}

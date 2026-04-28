import type { RawRow } from "../utils/types";
import { isMeasureLikeHeader } from "../mapping/semanticColumns";

export async function parseExcel(file: File): Promise<{ tables: Record<string, RawRow[]>; sheetNames: string[]; errors: string[] }> {
  try {
    const { read, utils } = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = read(buffer, { type: "array", cellDates: true, dense: false });
    const tables: Record<string, RawRow[]> = {};

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const table = utils.sheet_to_json<unknown[]>(worksheet, {
        header: 1,
        defval: "",
        raw: false,
        blankrows: false
      });
      const rows = tableToObjects(table);
      tables[sheetName] = rows.filter((row) => Object.values(row).some((value) => String(value ?? "").trim()));
    });

    return { tables, sheetNames: workbook.SheetNames, errors: [] };
  } catch (error) {
    return {
      tables: {},
      sheetNames: [],
      errors: [error instanceof Error ? error.message : "Unable to parse Excel workbook."]
    };
  }
}

function tableToObjects(table: unknown[][]): RawRow[] {
  const nonEmptyRows = table.filter((row) => row.some((cell) => String(cell ?? "").trim()));
  if (!nonEmptyRows.length) return [];
  const { headers, headerIndex } = detectHeaders(nonEmptyRows);
  return nonEmptyRows.slice(headerIndex + 1).map((row) => {
    const record: RawRow = {};
    headers.forEach((header, index) => {
      record[header] = row[index] as RawRow[string];
    });
    return record;
  });
}

function detectHeaders(nonEmptyRows: unknown[][]): { headers: string[]; headerIndex: number } {
  let headerIndex = 0;
  let bestScore = -Infinity;
  nonEmptyRows.slice(0, 30).forEach((row, index) => {
    const cells = row.map((cell) => String(cell ?? "").trim()).filter(Boolean);
    const knownPharmaHeaders = cells.filter((cell) => /^(pfc|ind|pack[_\s.-]*desc|brands?|manufact|indian[_\s.-]*mnc|group|acute[_\s.-]*chronic|nfc|plain)$/i.test(cell)).length;
    const pivotHeaders = cells.filter((cell) => isMeasureLikeHeader(cell)).length;
    const rowLabelHeaders = cells.filter((cell) => /^(row\s*labels?|brand|brands?|product|parent\s*molecule|molecule[_\s.-]*desc)$/i.test(cell)).length;
    const unique = new Set(cells.map(normalize)).size;
    const numericCells = cells.filter((cell) => parseNumber(cell) !== null).length;
    const score = knownPharmaHeaders * 14 + rowLabelHeaders * 10 + Math.min(cells.length, 80) * 2 + unique - pivotHeaders * 8 - numericCells * 0.9 - index * 0.1;
    if (cells.length >= 2 && score > bestScore) {
      bestScore = score;
      headerIndex = index;
    }
  });
  return { headers: uniquifyHeaders(nonEmptyRows[headerIndex].map((cell, index) => String(cell ?? "").trim() || `Column ${index + 1}`)), headerIndex };
}

function uniquifyHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((header) => {
    const base = header || "Column";
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count ? `${base} ${count + 1}` : base;
  });
}

function parseNumber(value: unknown): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const cleaned = text.replace(/[^0-9eE+\-.%()]/g, "").replace(/[()]/g, "");
  if (!/^-?(?:\d+\.?\d*|\d*\.\d+)(?:e[+-]?\d+)?%?$/i.test(cleaned)) return null;
  const number = Number(cleaned.replace("%", ""));
  return Number.isFinite(number) ? number : null;
}

function normalize(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

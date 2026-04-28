import type { ParseProgress, RawRow } from "../utils/types";

type ProgressCallback = (progress: ParseProgress) => void;

export type CopyState = {
  columns: string[];
};

export async function parseSql(file: File, onProgress?: ProgressCallback): Promise<{ rows: RawRow[]; errors: string[] }> {
  const text = await file.text();
  const rows: RawRow[] = [];
  const errors: string[] = [];
  parseSqlText(text, rows, errors);
  onProgress?.({
    phase: "parsing",
    percent: 95,
    rowsProcessed: rows.length,
    bytesProcessed: file.size,
    totalBytes: file.size,
    message: `${rows.length.toLocaleString("en-IN")} SQL rows parsed`
  });
  return { rows, errors };
}

export function parseSqlText(text: string, rows: RawRow[], errors: string[]) {
  let copyState: CopyState | null = null;
  let statement = "";
  for (const line of text.split(/\r?\n/)) {
    const copyHeader = parseCopyHeader(line);
    if (copyHeader) {
      copyState = copyHeader;
      continue;
    }
    if (copyState) {
      if (line.trim() === "\\.") {
        copyState = null;
        continue;
      }
      rows.push(parseCopyDataRow(line, copyState.columns));
      continue;
    }
    statement += `${line}\n`;
    if (endsSqlStatement(statement)) {
      appendSqlStatementRows(statement, rows, errors);
      statement = "";
    }
  }
  if (statement.trim()) appendSqlStatementRows(statement, rows, errors);
}

export function parseCopyHeader(line: string): CopyState | null {
  const match = line.match(/^\s*COPY\s+(?:"[^"]+"|`[^`]+`|\[[^\]]+\]|[\w.]+)\s*(?:\(([\s\S]*?)\))?\s+FROM\s+stdin\b/i);
  if (!match) return null;
  const columns = match[1] ? splitSqlList(match[1]).map(cleanIdentifier) : [];
  return { columns };
}

export function parseCopyDataRow(line: string, columns: string[]): RawRow {
  const cells = line.split("\t").map((value) => (value === "\\N" ? "" : value.replace(/\\t/g, "\t").replace(/\\n/g, "\n").replace(/\\\\/g, "\\")));
  const headers = columns.length ? columns : cells.map((_, index) => `Column ${index + 1}`);
  const row: RawRow = {};
  headers.forEach((header, index) => {
    row[header] = coerceSqlValue(cells[index] ?? "");
  });
  return row;
}

export function appendSqlStatementRows(statement: string, rows: RawRow[], errors: string[]) {
  const trimmed = statement.trim();
  if (!/^INSERT\s+INTO\b/i.test(trimmed)) return;
  try {
    rows.push(...parseInsertStatement(trimmed));
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Unable to parse SQL INSERT statement.");
  }
}

function parseInsertStatement(statement: string): RawRow[] {
  const valuesIndex = findValuesKeyword(statement);
  if (valuesIndex < 0) return [];
  const beforeValues = statement.slice(0, valuesIndex);
  const columnMatch = beforeValues.match(/\(([\s\S]*)\)\s*$/);
  const explicitColumns = columnMatch ? splitSqlList(columnMatch[1]).map(cleanIdentifier) : [];
  const tuples = extractTuples(statement.slice(valuesIndex + 6).replace(/;\s*$/, ""));
  return tuples.map((tuple) => {
    const values = splitSqlList(tuple).map(coerceSqlValue);
    const headers = explicitColumns.length ? explicitColumns : values.map((_, index) => `Column ${index + 1}`);
    const row: RawRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function findValuesKeyword(statement: string): number {
  const pattern = /\bVALUES\b/i;
  const match = pattern.exec(statement);
  return match ? match.index : -1;
}

function extractTuples(valuesSql: string): string[] {
  const tuples: string[] = [];
  let quote: "'" | "\"" | "`" | null = null;
  let depth = 0;
  let start = -1;
  for (let index = 0; index < valuesSql.length; index += 1) {
    const char = valuesSql[index];
    const next = valuesSql[index + 1];
    if (quote) {
      if (char === quote) {
        if (quote === "'" && next === "'") {
          index += 1;
        } else {
          quote = null;
        }
      } else if (char === "\\" && next) {
        index += 1;
      }
      continue;
    }
    if (char === "'" || char === "\"" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "(") {
      if (depth === 0) start = index + 1;
      depth += 1;
      continue;
    }
    if (char === ")") {
      depth -= 1;
      if (depth === 0 && start >= 0) tuples.push(valuesSql.slice(start, index));
    }
  }
  return tuples;
}

function splitSqlList(input: string): string[] {
  const values: string[] = [];
  let quote: "'" | "\"" | "`" | null = null;
  let bracket = false;
  let depth = 0;
  let start = 0;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (quote) {
      if (char === quote) {
        if (quote === "'" && next === "'") index += 1;
        else quote = null;
      } else if (char === "\\" && next) {
        index += 1;
      }
      continue;
    }
    if (bracket) {
      if (char === "]") bracket = false;
      continue;
    }
    if (char === "[") {
      bracket = true;
      continue;
    }
    if (char === "'" || char === "\"" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      values.push(input.slice(start, index).trim());
      start = index + 1;
    }
  }
  values.push(input.slice(start).trim());
  return values;
}

function endsSqlStatement(statement: string): boolean {
  let quote: "'" | "\"" | "`" | null = null;
  for (let index = 0; index < statement.length; index += 1) {
    const char = statement[index];
    const next = statement[index + 1];
    if (quote) {
      if (char === quote) {
        if (quote === "'" && next === "'") index += 1;
        else quote = null;
      } else if (char === "\\" && next) {
        index += 1;
      }
      continue;
    }
    if (char === "'" || char === "\"" || char === "`") quote = char;
  }
  return !quote && /;\s*$/.test(statement);
}

function cleanIdentifier(value: string): string {
  return value.trim().replace(/^["`\[]|["`\]]$/g, "") || "Column";
}

function coerceSqlValue(value: string): string | number | boolean {
  const trimmed = value.trim();
  if (!trimmed || /^NULL$/i.test(trimmed)) return "";
  if (/^(TRUE|FALSE)$/i.test(trimmed)) return /^TRUE$/i.test(trimmed);
  const quoted = trimmed.match(/^'(.*)'$/s) ?? trimmed.match(/^"(.*)"$/s);
  const unquoted = quoted ? quoted[1].replace(/''/g, "'").replace(/\\"/g, "\"").replace(/\\'/g, "'") : trimmed;
  const normalizedNumber = unquoted.replace(/,/g, "");
  if (/^-?(?:\d+\.?\d*|\d*\.\d+)(?:e[+-]?\d+)?$/i.test(normalizedNumber)) return Number(normalizedNumber);
  return unquoted;
}

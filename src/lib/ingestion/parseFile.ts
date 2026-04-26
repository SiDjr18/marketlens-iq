import { parseCsv } from "./parseCsv";
import { parseExcel } from "./parseExcel";
import { parseJson } from "./parseJson";
import type { ParseProgress, ParsedDataset, RawRow, UploadMeta } from "../utils/types";

type ProgressCallback = (progress: ParseProgress) => void;

function columnsOf(rows: RawRow[]): string[] {
  const columns = new Set<string>();
  rows.slice(0, 250).forEach((row) => Object.keys(row).forEach((key) => columns.add(key)));
  return Array.from(columns);
}

async function parseCsvInWorker(file: File, delimiter: string | undefined, onProgress?: ProgressCallback) {
  if (!window.Worker) return parseCsv(file, delimiter);
  return new Promise<{ rows: RawRow[]; errors: string[] }>((resolve) => {
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent) => {
      const data = event.data as { type: string; rowsProcessed?: number; rows?: RawRow[]; errors?: string[]; error?: string };
      if (data.type === "progress") {
        onProgress?.({
          phase: "parsing",
          percent: 50,
          rowsProcessed: data.rowsProcessed ?? 0,
          message: `${(data.rowsProcessed ?? 0).toLocaleString("en-IN")} rows processed`
        });
      }
      if (data.type === "complete") {
        worker.terminate();
        resolve({ rows: data.rows ?? [], errors: data.errors ?? [] });
      }
      if (data.type === "error") {
        worker.terminate();
        resolve({ rows: [], errors: [data.error ?? "Worker parsing failed."] });
      }
    };
    worker.onerror = () => {
      worker.terminate();
      resolve(parseCsv(file, delimiter));
    };
    worker.postMessage({ file, delimiter });
  });
}

export async function parseFile(file: File, onProgress?: ProgressCallback): Promise<ParsedDataset> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  onProgress?.({ phase: "reading", percent: 10, rowsProcessed: 0, message: `Reading ${file.name}` });

  let tables: Record<string, RawRow[]> = {};
  let sheetNames: string[] = [];
  let errors: string[] = [];

  if (extension === "csv" || extension === "tsv") {
    const delimiter = extension === "tsv" ? "\t" : undefined;
    const parsed = file.size > 8 * 1024 * 1024 ? await parseCsvInWorker(file, delimiter, onProgress) : await parseCsv(file, delimiter);
    tables = { Data: parsed.rows };
    sheetNames = ["Data"];
    errors = parsed.errors;
  } else if (extension === "xlsx" || extension === "xls") {
    onProgress?.({ phase: "parsing", percent: 30, rowsProcessed: 0, message: "Parsing workbook sheets" });
    const parsed = await parseExcel(file);
    tables = parsed.tables;
    sheetNames = parsed.sheetNames;
    errors = parsed.errors;
  } else if (extension === "json") {
    const parsed = await parseJson(file);
    tables = { Data: parsed.rows };
    sheetNames = ["Data"];
    errors = parsed.errors;
  } else {
    errors = [`Unsupported file type .${extension}. Use XLSX, XLS, CSV, TSV, or JSON.`];
  }

  const activeSheet = sheetNames.find((sheet) => (tables[sheet] ?? []).length > 0) ?? sheetNames[0] ?? "Data";
  const activeRows = tables[activeSheet] ?? [];
  const meta: UploadMeta = {
    fileName: file.name,
    fileType: extension.toUpperCase(),
    sheetName: activeSheet,
    sheetNames,
    rowsDetected: activeRows.length,
    columnsDetected: columnsOf(activeRows).length,
    rowsProcessed: activeRows.length,
    skippedRows: 0,
    errors
  };

  onProgress?.({
    phase: errors.length && !activeRows.length ? "error" : "ready",
    percent: errors.length && !activeRows.length ? 100 : 100,
    rowsProcessed: activeRows.length,
    message: activeRows.length ? `${activeRows.length.toLocaleString("en-IN")} rows loaded` : errors[0] ?? "No usable rows found"
  });

  return { tables, sheetNames, activeSheet, meta };
}

export function getColumns(rows: RawRow[]): string[] {
  return columnsOf(rows);
}

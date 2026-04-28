import type { ParseProgress, RawRow } from "../utils/types";

type ProgressCallback = (progress: ParseProgress) => void;

export async function parseCsv(file: File, delimiter?: string, onProgress?: ProgressCallback): Promise<{ rows: RawRow[]; errors: string[] }> {
  const Papa = (await import("papaparse")).default;
  return new Promise((resolve) => {
    const rows: RawRow[] = [];
    Papa.parse<RawRow>(file, {
      header: true,
      delimiter,
      skipEmptyLines: "greedy",
      dynamicTyping: false,
      transformHeader: (header) => header.trim(),
      chunkSize: 1024 * 1024,
      chunk: (result) => {
        for (const row of result.data) {
          if (Object.values(row).some((value) => String(value ?? "").trim())) rows.push(row);
        }
        const cursor = Math.min(file.size, Number(result.meta.cursor) || 0);
        onProgress?.({
          phase: "parsing",
          percent: boundedPercent(5 + (cursor / Math.max(file.size, 1)) * 90),
          rowsProcessed: rows.length,
          bytesProcessed: cursor,
          totalBytes: file.size,
          message: `${rows.length.toLocaleString("en-IN")} rows parsed from ${file.name}`
        });
      },
      complete: (result) => {
        resolve({
          rows,
          errors: result.errors.map((error) => `${error.message} at row ${error.row ?? "unknown"}`)
        });
      },
      error: (error) => resolve({ rows: [], errors: [error.message] })
    });
  });
}

function boundedPercent(value: number) {
  return Math.max(1, Math.min(99, Math.round(value)));
}

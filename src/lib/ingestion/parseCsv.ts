import Papa from "papaparse";
import type { RawRow } from "../utils/types";

export async function parseCsv(file: File, delimiter?: string): Promise<{ rows: RawRow[]; errors: string[] }> {
  return new Promise((resolve) => {
    Papa.parse<RawRow>(file, {
      header: true,
      delimiter,
      skipEmptyLines: "greedy",
      dynamicTyping: false,
      transformHeader: (header) => header.trim(),
      complete: (result) => {
        const rows = result.data.filter((row) => Object.values(row).some((value) => String(value ?? "").trim()));
        resolve({
          rows,
          errors: result.errors.map((error) => `${error.message} at row ${error.row ?? "unknown"}`)
        });
      },
      error: (error) => resolve({ rows: [], errors: [error.message] })
    });
  });
}

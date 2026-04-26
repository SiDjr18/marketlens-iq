import { safeFileName } from "../utils/formatters";
import type { RawRow } from "../utils/types";

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function exportCsv(rows: RawRow[], fileName = "marketlens-export"): void {
  if (!rows.length) return;
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const csv = [columns.join(","), ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFileName(fileName)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

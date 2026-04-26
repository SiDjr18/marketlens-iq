import type { RawRow } from "../utils/types";

function flattenRow(row: unknown): RawRow {
  if (!row || typeof row !== "object") return { value: String(row ?? "") };
  const output: RawRow = {};
  Object.entries(row as Record<string, unknown>).forEach(([key, value]) => {
    if (value && typeof value === "object") output[key] = JSON.stringify(value);
    else output[key] = value as RawRow[string];
  });
  return output;
}

export async function parseJson(file: File): Promise<{ rows: RawRow[]; errors: string[] }> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as unknown;
    let source: unknown[] = [];
    if (Array.isArray(parsed)) source = parsed;
    else if (parsed && typeof parsed === "object") {
      const firstArray = Object.values(parsed as Record<string, unknown>).find(Array.isArray);
      if (Array.isArray(firstArray)) source = firstArray;
      else source = [parsed];
    }
    const rows = source.map(flattenRow).filter((row) => Object.values(row).some((value) => String(value ?? "").trim()));
    return { rows, errors: rows.length ? [] : ["JSON did not contain a usable array or object table."] };
  } catch (error) {
    return { rows: [], errors: [error instanceof Error ? error.message : "Unable to parse JSON."] };
  }
}

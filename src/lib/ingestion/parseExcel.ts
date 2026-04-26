import { read, utils } from "xlsx";
import type { RawRow } from "../utils/types";

export async function parseExcel(file: File): Promise<{ tables: Record<string, RawRow[]>; sheetNames: string[]; errors: string[] }> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = read(buffer, { type: "array", cellDates: true, dense: false });
    const tables: Record<string, RawRow[]> = {};

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const rows = utils.sheet_to_json<RawRow>(worksheet, {
        defval: "",
        raw: false,
        blankrows: false
      });
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

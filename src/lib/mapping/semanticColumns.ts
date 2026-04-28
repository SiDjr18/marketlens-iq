import { cellText, normalizeKey, parsePeriod, toNumber } from "../utils/formatters";
import type { PharmaField, RawRow } from "../utils/types";

const DIMENSION_FIELDS = new Set<PharmaField>(["brand", "company", "therapy", "molecule", "marketType", "companyType", "productType", "pack", "month"]);
const MEASURE_WORDS = [
  "sum",
  "average",
  "count",
  "total",
  "grandtotal",
  "values",
  "value",
  "sales",
  "revenue",
  "amount",
  "mat",
  "month",
  "cumm",
  "unit",
  "units",
  "qty",
  "volume",
  "cp"
];

const PIVOT_SCAFFOLD_VALUES = new Set(["all", "values", "rowlabels", "columnlabels", "grandtotal", "total", "blank"]);
const VALUE_PREFIX_PATTERN = /^(sum|average|count|min|max|total)\s+of\s+/i;
const PERIOD_PATTERN = /\b(mat|month|cumm|unit|qty|cp)?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)'?\d{2,4}\b/i;

export function isMeasureLikeHeader(column: string): boolean {
  const key = normalizeKey(column);
  if (!key) return true;
  if (PIVOT_SCAFFOLD_VALUES.has(key)) return true;
  if (VALUE_PREFIX_PATTERN.test(column.trim())) return true;
  if (PERIOD_PATTERN.test(column)) return true;
  return MEASURE_WORDS.some((word) => key === word || key.startsWith(`${word}of`));
}

export function isUsableDimensionValue(value: unknown): boolean {
  const text = cellText(value);
  if (!text) return false;
  const key = normalizeKey(text);
  if (!key || PIVOT_SCAFFOLD_VALUES.has(key)) return false;
  if (/^\(?all\)?$/i.test(text)) return false;
  if (VALUE_PREFIX_PATTERN.test(text)) return false;
  if (PERIOD_PATTERN.test(text) && toNumber(text) === null) return false;
  if (toNumber(text) !== null) return false;
  if (parsePeriod(text) && /^(\d{4}-\d{2}|[a-z]{3,9}\s*\d{2,4}|mat\s+)/i.test(text.trim())) return false;
  return /[a-z]/i.test(text);
}

export function columnSemanticScore(field: PharmaField, column: string, rows: RawRow[]): number {
  const sample = rows.slice(0, Math.min(rows.length, 1200));
  if (!sample.length) return 0;
  let checked = 0;
  let usableDimension = 0;
  let numeric = 0;
  const distinct = new Set<string>();

  for (const row of sample) {
    const raw = row[column];
    const text = cellText(raw);
    if (!text) continue;
    checked += 1;
    if (toNumber(raw) !== null) numeric += 1;
    if (isUsableDimensionValue(raw)) {
      usableDimension += 1;
      if (distinct.size < 1500) distinct.add(text.toLowerCase());
    }
  }

  if (!checked) return 0;
  const usableRatio = usableDimension / checked;
  const numericRatio = numeric / checked;
  const distinctRatio = distinct.size / Math.max(usableDimension, 1);
  const headerPenalty = DIMENSION_FIELDS.has(field) && isMeasureLikeHeader(column) ? 45 : 0;
  const numericPenalty = DIMENSION_FIELDS.has(field) ? numericRatio * 70 : 0;
  return Math.round(usableRatio * 80 + Math.min(distinctRatio, 1) * 20 - headerPenalty - numericPenalty);
}

export function isSafeDimensionColumn(field: PharmaField, column: string, rows: RawRow[]): boolean {
  if (!DIMENSION_FIELDS.has(field)) return true;
  if (field === "month") return true;
  if (isMeasureLikeHeader(column)) return false;
  return columnSemanticScore(field, column, rows) >= 35;
}

export function cleanDimensionOptions(values: string[], limit = 100): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = cellText(value);
    const key = trimmed.toLowerCase();
    if (!isUsableDimensionValue(trimmed) || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= limit) break;
  }
  return out;
}

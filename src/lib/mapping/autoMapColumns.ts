import { mappingAliases } from "./mappingRules";
import { normalizeKey, toNumber } from "../utils/formatters";
import type { FieldMapping, MappingConfidence, PharmaField, RawRow } from "../utils/types";
import { IMS_FIELD_MAP } from "../analytics/imsSchema";
import { columnSemanticScore, isMeasureLikeHeader, isSafeDimensionColumn } from "./semanticColumns";

type AutoMapResult = {
  mapping: FieldMapping;
  confidence: MappingConfidence;
};

const imsCanonicalColumns: Partial<Record<PharmaField, string>> = IMS_FIELD_MAP;

const marketLensCanonicalColumns: Partial<Record<PharmaField, string>> = {
  brand: "MarketLens Brand",
  company: "MarketLens Company",
  therapy: "MarketLens Therapy",
  molecule: "MarketLens Molecule",
  marketType: "MarketLens Market Type",
  companyType: "MarketLens Company Type",
  productType: "MarketLens Product Type",
  valueSales: "MarketLens Value Sales",
  units: "MarketLens Units",
  volume: "MarketLens Volume",
  mat: "MarketLens MAT Sales",
  month: "MarketLens Month",
  pack: "MarketLens Pack"
};

function scoreColumn(field: PharmaField, column: string): number {
  const key = normalizeKey(column);
  const aliases = mappingAliases[field];
  let best = 0;
  for (const alias of aliases) {
    const normalized = normalizeKey(alias);
    if (key === normalized) best = Math.max(best, 100);
    else if (key.includes(normalized)) best = Math.max(best, 86);
    else if (normalized.includes(key) && key.length > 3) best = Math.max(best, 72);
  }
  if (field === "mat" && /\bmat\b/i.test(column)) best = Math.max(best, 92);
  if (field === "month" && /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|fy|year)/i.test(column)) best = Math.max(best, 70);
  return best;
}

function isDimensionField(field: PharmaField) {
  return !["valueSales", "units", "volume", "mat"].includes(field);
}

function numericCandidates(columns: string[], rows: RawRow[], used: Set<string>) {
  const sample = rows.slice(0, Math.min(rows.length, 1200));
  return columns
    .filter((column) => !used.has(column))
    .filter((column) => isMeasureLikeHeader(column) || /\b(mat|month|unit|qty|value|sales|revenue|amount|volume)\b/i.test(column))
    .filter((column) => !/^(pfc|ind|index|row|prodlnch|launch|year|month|date)$/i.test(normalizeKey(column)))
    .map((column) => {
      let checked = 0;
      let numeric = 0;
      let sum = 0;
      sample.forEach((row) => {
        const raw = row[column];
        if (raw === undefined || raw === null || raw === "") return;
        checked += 1;
        const number = toNumber(raw);
        if (number !== null) {
          numeric += 1;
          sum += Math.abs(number);
        }
      });
      const density = checked ? numeric / checked : 0;
      return { column, density, sum, score: density * 100 + Math.log10(sum + 1) };
    })
    .filter((candidate) => candidate.density >= 0.65)
    .sort((a, b) => b.score - a.score);
}

export function autoMapColumns(columns: string[], rows: RawRow[] = []): AutoMapResult {
  const used = new Set<string>();
  const mapping: FieldMapping = {};
  const confidence: MappingConfidence = {};

  (Object.keys(imsCanonicalColumns) as PharmaField[]).forEach((field) => {
    const canonical = imsCanonicalColumns[field];
    const column = columns.find((candidate) => normalizeKey(candidate) === normalizeKey(canonical));
    if (column && isSafeDimensionColumn(field, column, rows)) {
      mapping[field] = column;
      confidence[field] = 100;
      used.add(column);
    }
  });

  (Object.keys(marketLensCanonicalColumns) as PharmaField[]).forEach((field) => {
    if (mapping[field]) return;
    const canonical = marketLensCanonicalColumns[field];
    const column = columns.find((candidate) => normalizeKey(candidate) === normalizeKey(canonical));
    if (column && isSafeDimensionColumn(field, column, rows)) {
      mapping[field] = column;
      confidence[field] = 96;
      used.add(column);
    }
  });

  (Object.keys(mappingAliases) as PharmaField[]).forEach((field) => {
    if (mapping[field]) return;
    const candidates = columns
      .map((column) => ({
        column,
        score: scoreColumn(field, column) + (isDimensionField(field) ? Math.max(0, columnSemanticScore(field, column, rows) - 45) : 0)
      }))
      .filter((candidate) => candidate.score >= 58 && !used.has(candidate.column))
      .filter((candidate) => isSafeDimensionColumn(field, candidate.column, rows))
      .sort((a, b) => b.score - a.score);

    const best = candidates[0];
    if (best) {
      mapping[field] = best.column;
      confidence[field] = best.score;
      used.add(best.column);
    }
  });

  if (rows.length) {
    const numeric = numericCandidates(columns, rows, used);
    const fallbackOrder: PharmaField[] = ["valueSales", "mat", "units", "volume"];
    fallbackOrder.forEach((field, index) => {
      if (mapping[field]) return;
      const candidate = numeric.find((item) => !used.has(item.column));
      if (!candidate) return;
      mapping[field] = candidate.column;
      confidence[field] = index === 0 ? 68 : 58;
      used.add(candidate.column);
    });
  }

  return { mapping, confidence };
}

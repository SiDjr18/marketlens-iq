import { mappingAliases } from "./mappingRules";
import { normalizeKey } from "../utils/formatters";
import type { FieldMapping, MappingConfidence, PharmaField } from "../utils/types";

type AutoMapResult = {
  mapping: FieldMapping;
  confidence: MappingConfidence;
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

export function autoMapColumns(columns: string[]): AutoMapResult {
  const used = new Set<string>();
  const mapping: FieldMapping = {};
  const confidence: MappingConfidence = {};

  (Object.keys(mappingAliases) as PharmaField[]).forEach((field) => {
    const candidates = columns
      .map((column) => ({ column, score: scoreColumn(field, column) }))
      .filter((candidate) => candidate.score >= 58 && !used.has(candidate.column))
      .sort((a, b) => b.score - a.score);

    const best = candidates[0];
    if (best) {
      mapping[field] = best.column;
      confidence[field] = best.score;
      used.add(best.column);
    }
  });

  return { mapping, confidence };
}

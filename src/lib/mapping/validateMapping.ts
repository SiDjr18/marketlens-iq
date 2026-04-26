import { HEALTH_THRESHOLD, REQUIRED_FIELDS } from "../utils/constants";
import { parsePeriod, toNumber } from "../utils/formatters";
import type { DataHealth, FieldMapping, PharmaField, RawRow } from "../utils/types";
import { numericFields } from "./mappingRules";

function hasMinimumMapping(mapping: FieldMapping): boolean {
  return Boolean(
    mapping.brand &&
      mapping.company &&
      (mapping.therapy || mapping.molecule) &&
      (mapping.valueSales || mapping.mat)
  );
}

export function validateMapping(rows: RawRow[], columns: string[], mapping: FieldMapping): DataHealth {
  if (!rows.length) {
    return {
      rowsLoaded: 0,
      columnsDetected: columns.length,
      mappedRequired: 0,
      missingFields: REQUIRED_FIELDS,
      numericParsingSuccess: 0,
      duplicateRows: 0,
      dateDetected: false,
      confidence: 0,
      status: "no-data"
    };
  }

  const missingFields = REQUIRED_FIELDS.filter((field) => !mapping[field]);
  const mappedRequired = REQUIRED_FIELDS.length - missingFields.length;
  const sample = rows.slice(0, Math.min(rows.length, 1500));
  let numericChecks = 0;
  let numericPass = 0;

  numericFields.forEach((field) => {
    const column = mapping[field];
    if (!column) return;
    sample.forEach((row) => {
      const raw = row[column];
      if (raw === undefined || raw === null || raw === "") return;
      numericChecks += 1;
      if (toNumber(raw) !== null) numericPass += 1;
    });
  });

  const numericParsingSuccess = numericChecks ? Math.round((numericPass / numericChecks) * 100) : 0;
  const dateDetected = mapping.month ? sample.some((row) => Boolean(parsePeriod(row[mapping.month as string]))) : false;
  const seen = new Set<string>();
  let duplicateRows = 0;
  sample.forEach((row) => {
    const signature = JSON.stringify(row);
    if (seen.has(signature)) duplicateRows += 1;
    seen.add(signature);
  });

  let confidence = Math.round((mappedRequired / REQUIRED_FIELDS.length) * 50);
  confidence += hasMinimumMapping(mapping) ? 25 : 0;
  confidence += Math.min(15, Math.round(numericParsingSuccess * 0.15));
  confidence += dateDetected ? 10 : mapping.month ? 4 : 0;
  confidence = Math.max(0, Math.min(100, confidence));

  return {
    rowsLoaded: rows.length,
    columnsDetected: columns.length,
    mappedRequired,
    missingFields,
    numericParsingSuccess,
    duplicateRows,
    dateDetected,
    confidence,
    status: confidence >= HEALTH_THRESHOLD && hasMinimumMapping(mapping) ? "ready" : "mapping-required"
  };
}

export function isStrategyReady(health: DataHealth): boolean {
  return health.status === "ready" && health.confidence >= HEALTH_THRESHOLD;
}

export function missingMinimumFields(mapping: FieldMapping): PharmaField[] {
  const missing: PharmaField[] = [];
  if (!mapping.brand) missing.push("brand");
  if (!mapping.company) missing.push("company");
  if (!mapping.therapy && !mapping.molecule) missing.push("therapy");
  if (!mapping.valueSales && !mapping.mat) missing.push("valueSales");
  return missing;
}

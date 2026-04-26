import { cellText, parsePeriod, toNumber } from "../utils/formatters";
import type { AggregateRow, FieldMapping, FilterState, PharmaField, RawRow } from "../utils/types";

export function fieldText(row: RawRow, mapping: FieldMapping, field: PharmaField): string {
  const column = mapping[field];
  if (!column) return "";
  return cellText(row[column]);
}

export function fieldNumber(row: RawRow, mapping: FieldMapping, field: PharmaField): number {
  const column = mapping[field];
  if (!column) return 0;
  return toNumber(row[column]) ?? 0;
}

export function metricValue(row: RawRow, mapping: FieldMapping, metric: PharmaField): number {
  if (mapping[metric]) return fieldNumber(row, mapping, metric);
  if (metric === "valueSales" && mapping.mat) return fieldNumber(row, mapping, "mat");
  if (metric === "mat" && mapping.valueSales) return fieldNumber(row, mapping, "valueSales");
  return 0;
}

function selectedIncludes(values: string[], actual: string): boolean {
  if (!values.length) return true;
  return values.some((value) => value.toLowerCase() === actual.toLowerCase());
}

export function applyFilters(rows: RawRow[], mapping: FieldMapping, filters: FilterState): RawRow[] {
  return rows.filter((row) => {
    const period = mapping.month ? parsePeriod(row[mapping.month]) : "";
    return (
      selectedIncludes(filters.marketType, fieldText(row, mapping, "marketType")) &&
      selectedIncludes(filters.companyType, fieldText(row, mapping, "companyType")) &&
      selectedIncludes(filters.productType, fieldText(row, mapping, "productType")) &&
      selectedIncludes(filters.brand, fieldText(row, mapping, "brand")) &&
      selectedIncludes(filters.therapy, fieldText(row, mapping, "therapy")) &&
      selectedIncludes(filters.molecule, fieldText(row, mapping, "molecule")) &&
      selectedIncludes(filters.company, fieldText(row, mapping, "company")) &&
      selectedIncludes(filters.timePeriod, period)
    );
  });
}

export function aggregateByDimension(
  rows: RawRow[],
  mapping: FieldMapping,
  dimension: PharmaField,
  metric: PharmaField = "valueSales"
): AggregateRow[] {
  const dimensionColumn = mapping[dimension];
  if (!dimensionColumn) return [];

  const periods = mapping.month
    ? Array.from(new Set(rows.map((row) => parsePeriod(row[mapping.month as string])).filter(Boolean))).sort()
    : [];
  const latestPeriod = periods[periods.length - 1];
  const previousPeriod = periods[periods.length - 2];

  const map = new Map<string, AggregateRow>();
  rows.forEach((row) => {
    const name = cellText(row[dimensionColumn]) || "Unmapped";
    const existing =
      map.get(name) ??
      ({
        name,
        value: 0,
        units: 0,
        volume: 0,
        mat: 0,
        previousValue: 0,
        growth: 0,
        share: 0,
        rank: 0,
        priceProxy: 0,
        rowCount: 0
      } satisfies AggregateRow);

    const currentMetric = metricValue(row, mapping, metric);
    existing.value += metricValue(row, mapping, "valueSales");
    existing.units += fieldNumber(row, mapping, "units");
    existing.volume += fieldNumber(row, mapping, "volume");
    existing.mat += fieldNumber(row, mapping, "mat");
    existing.rowCount += 1;

    if (mapping.month) {
      const period = parsePeriod(row[mapping.month]);
      if (!latestPeriod || period === latestPeriod) existing.previousValue += 0;
      if (previousPeriod && period === previousPeriod) existing.previousValue += currentMetric;
    }

    map.set(name, existing);
  });

  const rowsOut = Array.from(map.values()).map((row) => {
    const metricTotal = metric === "mat" ? row.mat : metric === "units" ? row.units : metric === "volume" ? row.volume : row.value;
    const previous = row.previousValue;
    return {
      ...row,
      value: metricTotal,
      growth: previous > 0 ? ((metricTotal - previous) / previous) * 100 : 0,
      priceProxy: row.units > 0 ? row.value / row.units : row.volume > 0 ? row.value / row.volume : 0
    };
  });

  const total = rowsOut.reduce((sum, row) => sum + row.value, 0);
  return rowsOut
    .map((row) => ({ ...row, share: total ? (row.value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export const aggregateByBrand = (rows: RawRow[], mapping: FieldMapping, metric: PharmaField = "valueSales") =>
  aggregateByDimension(rows, mapping, "brand", metric);

export const aggregateByCompany = (rows: RawRow[], mapping: FieldMapping, metric: PharmaField = "valueSales") =>
  aggregateByDimension(rows, mapping, "company", metric);

export const aggregateByTherapy = (rows: RawRow[], mapping: FieldMapping, metric: PharmaField = "valueSales") =>
  aggregateByDimension(rows, mapping, "therapy", metric);

export const aggregateByMolecule = (rows: RawRow[], mapping: FieldMapping, metric: PharmaField = "valueSales") =>
  aggregateByDimension(rows, mapping, "molecule", metric);

export function trendByPeriod(rows: RawRow[], mapping: FieldMapping, metric: PharmaField = "valueSales") {
  if (!mapping.month) return [];
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const period = parsePeriod(row[mapping.month as string]);
    if (!period) return;
    map.set(period, (map.get(period) ?? 0) + metricValue(row, mapping, metric));
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, value]) => ({ period, value }));
}

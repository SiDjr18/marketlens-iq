import { cellText, parsePeriod, toNumber } from "../utils/formatters";
import type { AggregateRow, FieldMapping, FilterState, PharmaField, RawRow } from "../utils/types";
import { calculateDimensionMetrics } from "./pharmaMetrics";
import { isUsableDimensionValue } from "../mapping/semanticColumns";

type WideMetricKind = "valueMonth" | "valueMat" | "unitMonth" | "unitMat" | "volumeMonth" | "volumeMat";

type WideColumn = {
  column: string;
  period: string;
  kind: WideMetricKind;
};

export type FilterOptionBuckets = {
  marketType: string[];
  companyType: string[];
  productType: string[];
  brand: string[];
  therapy: string[];
  molecule: string[];
  company: string[];
  timePeriod: string[];
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MONTH_PATTERN = "(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)'(\\d{2})";
const columnsCache = new WeakMap<RawRow[], string[]>();
const wideColumnsCache = new WeakMap<RawRow[], WideColumn[]>();
const timePeriodsCache = new WeakMap<RawRow[], string[]>();

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

function selectedPeriod(filters?: FilterState): string {
  return filters?.timePeriod[filters.timePeriod.length - 1] ?? "";
}

function selectedIncludes(values: string[], actual: string): boolean {
  if (!values.length) return true;
  return values.some((value) => value.toLowerCase() === actual.toLowerCase());
}

function columnsOf(rows: RawRow[]): string[] {
  const cached = columnsCache.get(rows);
  if (cached) return cached;
  const columns = Object.keys(rows[0] ?? {});
  columnsCache.set(rows, columns);
  return columns;
}

function readColumnNumber(row: RawRow, column?: string): number {
  if (!column) return 0;
  return toNumber(row[column]) ?? 0;
}

function periodSortValue(period: string): number {
  const match = period.match(/^(\d{4})-(\d{2})$/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]) * 100 + Number(match[2]);
}

function periodFromMatch(monthRaw: string, yearRaw: string): string {
  const month = monthRaw.slice(0, 3).toUpperCase();
  const monthIndex = MONTHS.indexOf(month);
  const year = 2000 + Number(yearRaw);
  if (monthIndex < 0 || !Number.isFinite(year)) return "";
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function normalizedHeader(column: string): string {
  return column.trim().toUpperCase().replace(/\s+/g, " ");
}

function wideColumnFromHeader(column: string): WideColumn | null {
  const key = normalizedHeader(column);
  const exactMonth = key.match(new RegExp(`^${MONTH_PATTERN}$`));
  if (exactMonth) return { column, period: periodFromMatch(exactMonth[1], exactMonth[2]), kind: "valueMonth" };

  const monthlyValue = key.match(new RegExp(`^MONTH\\s+${MONTH_PATTERN}$`));
  if (monthlyValue) return { column, period: periodFromMatch(monthlyValue[1], monthlyValue[2]), kind: "valueMonth" };

  const matValue = key.match(new RegExp(`^MAT\\s+${MONTH_PATTERN}$`));
  if (matValue) return { column, period: periodFromMatch(matValue[1], matValue[2]), kind: "valueMat" };

  const unitMonth = key.match(new RegExp(`^UNIT\\s+${MONTH_PATTERN}$`));
  if (unitMonth) return { column, period: periodFromMatch(unitMonth[1], unitMonth[2]), kind: "unitMonth" };

  const unitMonthBlock = key.match(new RegExp(`^UNIT\\s+MONTH\\s+${MONTH_PATTERN}$`));
  if (unitMonthBlock) return { column, period: periodFromMatch(unitMonthBlock[1], unitMonthBlock[2]), kind: "unitMonth" };

  const unitMat = key.match(new RegExp(`^UNIT\\s+MAT\\s+${MONTH_PATTERN}$`));
  if (unitMat) return { column, period: periodFromMatch(unitMat[1], unitMat[2]), kind: "unitMat" };

  const volumeMonth = key.match(new RegExp(`^(QTY|VOLUME)\\s+(MONTH\\s+)?${MONTH_PATTERN}$`));
  if (volumeMonth) return { column, period: periodFromMatch(volumeMonth[3], volumeMonth[4]), kind: "volumeMonth" };

  const volumeMat = key.match(new RegExp(`^(QTY|VOLUME)\\s+MAT\\s+${MONTH_PATTERN}$`));
  if (volumeMat) return { column, period: periodFromMatch(volumeMat[2], volumeMat[3]), kind: "volumeMat" };

  return null;
}

function wideColumns(columns: string[]): WideColumn[] {
  return columns
    .map(wideColumnFromHeader)
    .filter((column): column is WideColumn => Boolean(column?.period))
    .sort((a, b) => periodSortValue(a.period) - periodSortValue(b.period));
}

function wideColumnsForRows(rows: RawRow[]): WideColumn[] {
  const cached = wideColumnsCache.get(rows);
  if (cached) return cached;
  const columns = wideColumns(columnsOf(rows));
  wideColumnsCache.set(rows, columns);
  return columns;
}

function isNativeMonthlySeries(column: WideColumn): boolean {
  const key = normalizedHeader(column.column);
  if (column.kind === "valueMonth") return new RegExp(`^${MONTH_PATTERN}$`).test(key);
  if (column.kind === "unitMonth") return new RegExp(`^UNIT\\s+${MONTH_PATTERN}$`).test(key);
  if (column.kind === "volumeMonth") return new RegExp(`^(QTY|VOLUME)\\s+${MONTH_PATTERN}$`).test(key);
  return false;
}

function preferredKinds(metric: PharmaField, selected = false): WideMetricKind[] {
  if (metric === "mat") return ["valueMat"];
  if (metric === "units") return ["unitMonth", "unitMat"];
  if (metric === "volume") return ["volumeMonth", "volumeMat"];
  return selected ? ["valueMonth", "valueMat"] : ["valueMonth", "valueMat"];
}

function comparisonKinds(metric: PharmaField, currentColumn?: string): WideMetricKind[] {
  const key = normalizedHeader(currentColumn ?? "");
  if (metric === "valueSales" && (key.includes("MARKETLENS VALUE SALES") || key.includes("MAT"))) return ["valueMat"];
  if (metric === "mat") return ["valueMat"];
  if (metric === "units" && (key.includes("MARKETLENS UNITS") || key.includes("UNIT MAT"))) return ["unitMat"];
  if (metric === "volume" && (key.includes("MARKETLENS VOLUME") || key.includes("QTY MAT"))) return ["volumeMat"];
  return preferredKinds(metric, true);
}

function firstColumnForPeriod(columns: string[], metric: PharmaField, period: string): string | undefined {
  const matches = wideColumns(columns).filter((item) => item.period === period);
  for (const kind of preferredKinds(metric, true)) {
    const nativeMatch = matches.find((item) => item.kind === kind && isNativeMonthlySeries(item));
    if (nativeMatch) return nativeMatch.column;
    const match = matches.find((item) => item.kind === kind);
    if (match) return match.column;
  }
  return undefined;
}

export function availableTimePeriods(rows: RawRow[]): string[] {
  const cached = timePeriodsCache.get(rows);
  if (cached) return cached;
  const periods = new Set(wideColumnsForRows(rows).map((column) => column.period));
  const sorted = Array.from(periods).sort((a, b) => periodSortValue(a) - periodSortValue(b));
  timePeriodsCache.set(rows, sorted);
  return sorted;
}

export function widePeriodColumns(rows: RawRow[], metric: PharmaField = "valueSales"): string[] {
  const columns = wideColumnsForRows(rows);
  for (const kind of preferredKinds(metric, false)) {
    const matches = columns.filter((column) => column.kind === kind);
    const nativeMonthly = matches.filter(isNativeMonthlySeries);
    if (nativeMonthly.length >= 2) return nativeMonthly.map((item) => item.column);
    if (matches.length) return matches.map((item) => item.column);
  }
  return [];
}

export function resolveMetricColumn(columns: string[], mapping: FieldMapping, metric: PharmaField, filters?: FilterState): string | undefined {
  const period = selectedPeriod(filters);
  if (period) {
    const wideColumn = firstColumnForPeriod(columns, metric, period);
    if (wideColumn) return wideColumn;
  }
  if (mapping[metric]) return mapping[metric];
  if (metric === "valueSales" && mapping.mat) return mapping.mat;
  if (metric === "mat" && mapping.valueSales) return mapping.valueSales;
  return undefined;
}

function previousMetricColumn(rows: RawRow[], mapping: FieldMapping, metric: PharmaField, filters?: FilterState, currentColumn?: string): string | undefined {
  const columns = columnsOf(rows);
  const parsed = wideColumns(columns);
  if (!parsed.length) return undefined;

  const period = selectedPeriod(filters);
  const allowedKinds = period ? preferredKinds(metric, true) : comparisonKinds(metric, currentColumn);
  const byMetric = parsed.filter((column) => allowedKinds.includes(column.kind));
  if (byMetric.length < 2) return undefined;

  const currentPeriod = period || wideColumnFromHeader(currentColumn ?? "")?.period || byMetric[byMetric.length - 1]?.period;
  const index = byMetric.findIndex((column) => column.period === currentPeriod);
  const previous = byMetric[index > 0 ? index - 1 : byMetric.length - 2];
  return previous?.column ?? mapping[metric];
}

export function metricValue(row: RawRow, mapping: FieldMapping, metric: PharmaField, filters?: FilterState, resolvedColumn?: string): number {
  const column = resolvedColumn ?? resolveMetricColumn(Object.keys(row), mapping, metric, filters);
  return readColumnNumber(row, column);
}

export function applyFilters(rows: RawRow[], mapping: FieldMapping, filters: FilterState): RawRow[] {
  const compiled = compileFilters(rows, mapping, filters);
  const out: RawRow[] = [];
  for (const row of rows) {
    if (rowMatchesFilters(row, compiled)) out.push(row);
  }
  return out;
}

export function collectFilterOptions(rows: RawRow[], mapping: FieldMapping, filters: FilterState, maxOptions = 500): FilterOptionBuckets {
  const compiled = compileFilters(rows, mapping, filters);
  const marketType = new Set<string>();
  const companyType = new Set<string>();
  const productType = new Set<string>();
  const brand = new Set<string>();
  const therapy = new Set<string>();
  const molecule = new Set<string>();
  const company = new Set<string>();
  const timePeriod = new Set<string>();
  const add = (set: Set<string>, value: string, limit = maxOptions) => {
    if (value && set.size < limit) set.add(value);
  };

  for (const row of rows) {
    if (!rowMatchesFilters(row, compiled)) continue;
    addDimension(marketType, readMappedText(row, compiled.marketTypeColumn), maxOptions);
    addDimension(companyType, readMappedText(row, compiled.companyTypeColumn), maxOptions);
    addDimension(productType, readMappedText(row, compiled.productTypeColumn), maxOptions);
    addDimension(brand, readMappedText(row, compiled.brandColumn), maxOptions);
    addDimension(therapy, readMappedText(row, compiled.therapyColumn), maxOptions);
    addDimension(molecule, readMappedText(row, compiled.moleculeColumn), maxOptions);
    addDimension(company, readMappedText(row, compiled.companyColumn), maxOptions);
    if (compiled.monthColumn) add(timePeriod, parsePeriod(row[compiled.monthColumn]), 250);
  }
  for (const period of availableTimePeriods(rows).slice(0, 250)) add(timePeriod, period, 250);

  return {
    marketType: Array.from(marketType),
    companyType: Array.from(companyType),
    productType: Array.from(productType),
    brand: Array.from(brand),
    therapy: Array.from(therapy),
    molecule: Array.from(molecule),
    company: Array.from(company),
    timePeriod: Array.from(timePeriod)
  };
}

function addDimension(set: Set<string>, value: string, limit: number) {
  if (isUsableDimensionValue(value) && set.size < limit) set.add(value);
}

type CompiledFilters = {
  marketType?: Set<string>;
  companyType?: Set<string>;
  productType?: Set<string>;
  brand?: Set<string>;
  therapy?: Set<string>;
  molecule?: Set<string>;
  company?: Set<string>;
  timePeriod?: Set<string>;
  hasWideTimeSelection: boolean;
  marketTypeColumn?: string;
  companyTypeColumn?: string;
  productTypeColumn?: string;
  brandColumn?: string;
  therapyColumn?: string;
  moleculeColumn?: string;
  companyColumn?: string;
  monthColumn?: string;
};

function compileFilters(rows: RawRow[], mapping: FieldMapping, filters: FilterState): CompiledFilters {
  const widePeriodSet = new Set(availableTimePeriods(rows));
  return {
    marketType: selectedSet(filters.marketType),
    companyType: selectedSet(filters.companyType),
    productType: selectedSet(filters.productType),
    brand: selectedSet(filters.brand),
    therapy: selectedSet(filters.therapy),
    molecule: selectedSet(filters.molecule),
    company: selectedSet(filters.company),
    timePeriod: selectedSet(filters.timePeriod),
    hasWideTimeSelection: filters.timePeriod.length > 0 && filters.timePeriod.some((period) => widePeriodSet.has(period)),
    marketTypeColumn: mapping.marketType,
    companyTypeColumn: mapping.companyType,
    productTypeColumn: mapping.productType,
    brandColumn: mapping.brand,
    therapyColumn: mapping.therapy,
    moleculeColumn: mapping.molecule,
    companyColumn: mapping.company,
    monthColumn: mapping.month
  };
}

function selectedSet(values: string[]): Set<string> | undefined {
  return values.length ? new Set(values.map((value) => value.toLowerCase())) : undefined;
}

function selectedMatches(values: Set<string> | undefined, actual: string): boolean {
  return !values || values.has(actual.toLowerCase());
}

function readMappedText(row: RawRow, column?: string): string {
  return column ? cellText(row[column]) : "";
}

function rowMatchesFilters(row: RawRow, filters: CompiledFilters): boolean {
  const period = filters.monthColumn ? parsePeriod(row[filters.monthColumn]) : "";
  return (
    selectedMatches(filters.marketType, readMappedText(row, filters.marketTypeColumn)) &&
    selectedMatches(filters.companyType, readMappedText(row, filters.companyTypeColumn)) &&
    selectedMatches(filters.productType, readMappedText(row, filters.productTypeColumn)) &&
    selectedMatches(filters.brand, readMappedText(row, filters.brandColumn)) &&
    selectedMatches(filters.therapy, readMappedText(row, filters.therapyColumn)) &&
    selectedMatches(filters.molecule, readMappedText(row, filters.moleculeColumn)) &&
    selectedMatches(filters.company, readMappedText(row, filters.companyColumn)) &&
    (filters.hasWideTimeSelection || selectedMatches(filters.timePeriod, period))
  );
}

export function aggregateByDimension(
  rows: RawRow[],
  mapping: FieldMapping,
  dimension: PharmaField,
  metric: PharmaField = "valueSales",
  filters?: FilterState
): AggregateRow[] {
  const imsRows = calculateDimensionMetrics(rows, mapping, dimension, metric, filters);
  if (imsRows) return imsRows;

  const dimensionColumn = mapping[dimension];
  if (!dimensionColumn) return [];

  const columns = columnsOf(rows);
  const metricColumn = resolveMetricColumn(columns, mapping, metric, filters);
  const valueColumn = resolveMetricColumn(columns, mapping, "valueSales", filters);
  const unitsColumn = resolveMetricColumn(columns, mapping, "units", filters);
  const volumeColumn = resolveMetricColumn(columns, mapping, "volume", filters);
  const matColumn = resolveMetricColumn(columns, mapping, "mat", filters);
  const previousColumn = previousMetricColumn(rows, mapping, metric, filters, metricColumn);
  const periods = mapping.month
    ? Array.from(new Set(rows.map((row) => parsePeriod(row[mapping.month as string])).filter(Boolean))).sort()
    : [];
  const previousPeriod = periods[periods.length - 2];

  const map = new Map<string, AggregateRow>();
  rows.forEach((row) => {
    const name = cellText(row[dimensionColumn]) || "Unmapped";
    if (!isUsableDimensionValue(name)) return;
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

    existing.value += readColumnNumber(row, valueColumn);
    existing.units += readColumnNumber(row, unitsColumn);
    existing.volume += readColumnNumber(row, volumeColumn);
    existing.mat += readColumnNumber(row, matColumn);
    existing.rowCount += 1;

    if (previousColumn) {
      existing.previousValue += readColumnNumber(row, previousColumn);
    } else if (previousPeriod && mapping.month && parsePeriod(row[mapping.month]) === previousPeriod) {
      existing.previousValue += readColumnNumber(row, metricColumn);
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

export const aggregateByBrand = (rows: RawRow[], mapping: FieldMapping, metric: PharmaField = "valueSales", filters?: FilterState) =>
  aggregateByDimension(rows, mapping, "brand", metric, filters);

export const aggregateByCompany = (rows: RawRow[], mapping: FieldMapping, metric: PharmaField = "valueSales", filters?: FilterState) =>
  aggregateByDimension(rows, mapping, "company", metric, filters);

export const aggregateByTherapy = (rows: RawRow[], mapping: FieldMapping, metric: PharmaField = "valueSales", filters?: FilterState) =>
  aggregateByDimension(rows, mapping, "therapy", metric, filters);

export const aggregateByMolecule = (rows: RawRow[], mapping: FieldMapping, metric: PharmaField = "valueSales", filters?: FilterState) =>
  aggregateByDimension(rows, mapping, "molecule", metric, filters);

export function trendByPeriod(rows: RawRow[], mapping: FieldMapping, metric: PharmaField = "valueSales") {
  const wideColumnsForMetric = widePeriodColumns(rows, metric);
  if (wideColumnsForMetric.length >= 2) {
    return wideColumnsForMetric.map((column) => ({
      period: parsePeriod(column),
      value: rows.reduce((sum, row) => sum + readColumnNumber(row, column), 0)
    }));
  }

  if (!mapping.month) return [];
  const metricColumn = resolveMetricColumn(columnsOf(rows), mapping, metric);
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const period = parsePeriod(row[mapping.month as string]);
    if (!period) return;
    map.set(period, (map.get(period) ?? 0) + readColumnNumber(row, metricColumn));
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, value]) => ({ period, value }));
}

import { cellText, normalizeKey, parsePeriod, toNumber } from "../utils/formatters";
import type { AggregateRow, FieldMapping, FilterState, PharmaField, RawRow } from "../utils/types";
import {
  findExactColumn,
  hasImsSchema,
  IMS_CP_VALUE,
  IMS_DIMENSIONS,
  IMS_FIELD_MAP,
  IMS_MONTHLY_CP_COLUMNS,
  IMS_MONTHLY_UNIT_COLUMNS,
  IMS_MONTHLY_VALUE_COLUMNS,
  IMS_NI,
  IMS_PRICE,
  IMS_QTY,
  IMS_UNITS,
  IMS_VALUE
} from "./imsSchema";

type MetricBase = {
  latestValue: number;
  previousValue: number;
  growthAbs: number;
  growthPct: number | null;
  latestUnits: number;
  previousUnits: number;
  unitGrowthPct: number | null;
  latestVolume: number;
  previousVolume: number;
  volumeGrowthPct: number | null;
  latestCp: number;
  previousCp: number;
  cpGrowthPct: number | null;
  priceProxy: number;
  previousPriceProxy: number;
  priceProxyGrowth: number | null;
  launchValue: number;
  prMay25: number | null;
  latest3MonthAvg: number | null;
  previous3MonthAvg: number | null;
  momentum: number | null;
  seasonality: number | null;
};

type MutableMetric = MetricBase & {
  name: string;
  rowCount: number;
  companies: Set<string>;
  brands: Set<string>;
  monthlyValue: number[];
  monthlyUnits: number[];
  monthlyCp: number[];
  limitations: Set<string>;
};

const MAX_NORMALIZE = 100;

function columnMap(columns: string[]) {
  const map = new Map<string, string>();
  columns.forEach((column) => map.set(normalizeKey(column), column));
  return map;
}

function exact(columns: string[], wanted: string): string | undefined {
  return findExactColumn(columns, wanted);
}

function mappedOrExact(columns: string[], mapping: FieldMapping, field: PharmaField): string | undefined {
  const mapped = mapping[field];
  if (mapped && columns.some((column) => normalizeKey(column) === normalizeKey(mapped))) return mapped;
  const ims = IMS_FIELD_MAP[field];
  return ims ? exact(columns, ims) : undefined;
}

function numberAt(row: RawRow, column?: string): number {
  if (!column) return 0;
  return toNumber(row[column]) ?? 0;
}

function nullableNumberAt(row: RawRow, column?: string): number | null {
  if (!column) return null;
  return toNumber(row[column]);
}

function safeGrowth(latest: number, previous: number): number | null {
  if (!previous) return null;
  return ((latest - previous) / previous) * 100;
}

function average(values: number[]): number | null {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function sumRows(rows: RawRow[], column?: string): number {
  if (!column) return 0;
  return rows.reduce((sum, row) => sum + numberAt(row, column), 0);
}

function initMetric(name: string, monthCount: number): MutableMetric {
  return {
    name,
    latestValue: 0,
    previousValue: 0,
    growthAbs: 0,
    growthPct: null,
    latestUnits: 0,
    previousUnits: 0,
    unitGrowthPct: null,
    latestVolume: 0,
    previousVolume: 0,
    volumeGrowthPct: null,
    latestCp: 0,
    previousCp: 0,
    cpGrowthPct: null,
    priceProxy: 0,
    previousPriceProxy: 0,
    priceProxyGrowth: null,
    launchValue: 0,
    prMay25: null,
    latest3MonthAvg: null,
    previous3MonthAvg: null,
    momentum: null,
    seasonality: null,
    rowCount: 0,
    companies: new Set<string>(),
    brands: new Set<string>(),
    monthlyValue: Array.from({ length: monthCount }, () => 0),
    monthlyUnits: Array.from({ length: monthCount }, () => 0),
    monthlyCp: Array.from({ length: monthCount }, () => 0),
    limitations: new Set<string>()
  };
}

function finalizeMetric(metric: MutableMetric) {
  metric.growthAbs = metric.latestValue - metric.previousValue;
  metric.growthPct = safeGrowth(metric.latestValue, metric.previousValue);
  metric.unitGrowthPct = safeGrowth(metric.latestUnits, metric.previousUnits);
  metric.volumeGrowthPct = safeGrowth(metric.latestVolume, metric.previousVolume);
  metric.cpGrowthPct = safeGrowth(metric.latestCp, metric.previousCp);
  metric.priceProxy = metric.latestUnits > 0 ? metric.latestValue / metric.latestUnits : 0;
  metric.previousPriceProxy = metric.previousUnits > 0 ? metric.previousValue / metric.previousUnits : 0;
  metric.priceProxyGrowth = safeGrowth(metric.priceProxy, metric.previousPriceProxy);
  metric.latest3MonthAvg = average(metric.monthlyValue.slice(-3));
  metric.previous3MonthAvg = average(metric.monthlyValue.slice(-6, -3));
  metric.momentum = metric.latest3MonthAvg !== null && metric.previous3MonthAvg ? safeGrowth(metric.latest3MonthAvg, metric.previous3MonthAvg) : null;
  const latest12 = average(metric.monthlyValue.slice(-12));
  metric.seasonality = metric.latest3MonthAvg !== null && latest12 ? safeGrowth(metric.latest3MonthAvg, latest12) : null;

  if (metric.previousValue === 0) metric.limitations.add("Growth % NA due to zero MAT MAY'24 base.");
  if (metric.latestValue === 0) metric.limitations.add("MAT MAY'25 is zero or blank.");
  if (metric.latestUnits === 0) metric.limitations.add("Price proxy unavailable because UNIT MAT MAY'25 is zero or blank.");
}

function selectedMetricValue(metric: MutableMetric, selected: PharmaField) {
  if (selected === "units") return metric.latestUnits;
  if (selected === "volume") return metric.latestVolume;
  return metric.latestValue;
}

function selectedPreviousValue(metric: MutableMetric, selected: PharmaField) {
  if (selected === "units") return metric.previousUnits;
  if (selected === "volume") return metric.previousVolume;
  return metric.previousValue;
}

function selectedGrowth(metric: MutableMetric, selected: PharmaField) {
  if (selected === "units") return metric.unitGrowthPct ?? 0;
  if (selected === "volume") return metric.volumeGrowthPct ?? 0;
  return metric.growthPct ?? 0;
}

function normalizeMetric(values: number[], value: number, inverse = false): number {
  const valid = values.filter((item) => Number.isFinite(item));
  if (!valid.length) return 0;
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  if (max === min) return 50;
  const scaled = ((value - min) / (max - min)) * MAX_NORMALIZE;
  return inverse ? MAX_NORMALIZE - scaled : scaled;
}

export function mapDatasetColumns(columns: string[], mapping: FieldMapping = {}): FieldMapping {
  const byKey = columnMap(columns);
  const next: FieldMapping = { ...mapping };
  Object.entries(IMS_FIELD_MAP).forEach(([field, column]) => {
    const exactColumn = byKey.get(normalizeKey(column));
    if (exactColumn) next[field as PharmaField] = exactColumn;
  });
  if (!next.month) next.month = "MarketLens Month";
  return next;
}

export function isExactImsDataset(rows: RawRow[]): boolean {
  return hasImsSchema(Object.keys(rows[0] ?? {}));
}

export function getSelectedMarket(rows: RawRow[], filters: FilterState, mapping: FieldMapping): RawRow[] {
  const resolved = mapDatasetColumns(Object.keys(rows[0] ?? {}), mapping);
  const match = (values: string[], field: PharmaField) => {
    if (!values.length) return () => true;
    const column = mappedOrExact(Object.keys(rows[0] ?? {}), resolved, field);
    return (row: RawRow) => values.some((value) => value.toLowerCase() === cellText(row[column ?? ""]).toLowerCase());
  };
  const tests = [
    match(filters.marketType, "marketType"),
    match(filters.companyType, "companyType"),
    match(filters.productType, "productType"),
    match(filters.brand, "brand"),
    match(filters.therapy, "therapy"),
    match(filters.molecule, "molecule"),
    match(filters.company, "company")
  ];
  return rows.filter((row) => tests.every((test) => test(row)));
}

export function buildPharmaDataModel(rows: RawRow[]) {
  const columns = Object.keys(rows[0] ?? {});
  return {
    hasExactImsSchema: hasImsSchema(columns),
    columns,
    missingColumns: [
      IMS_VALUE.latestMat,
      IMS_VALUE.previousMat,
      IMS_DIMENSIONS.brand,
      IMS_DIMENSIONS.company,
      IMS_DIMENSIONS.supergroup,
      IMS_DIMENSIONS.molecule
    ].filter((column) => !exact(columns, column)),
    monthlyValueColumns: IMS_MONTHLY_VALUE_COLUMNS.filter((column) => exact(columns, column)),
    monthlyUnitColumns: IMS_MONTHLY_UNIT_COLUMNS.filter((column) => exact(columns, column)),
    monthlyCpColumns: IMS_MONTHLY_CP_COLUMNS.filter((column) => exact(columns, column))
  };
}

export function calculateMonthlyMomentum(rows: RawRow[]) {
  const columns = Object.keys(rows[0] ?? {});
  const monthColumns = IMS_MONTHLY_VALUE_COLUMNS.map((column) => exact(columns, column)).filter(Boolean) as string[];
  const values = monthColumns.map((column) => sumRows(rows, column));
  const latest3 = average(values.slice(-3));
  const previous3 = average(values.slice(-6, -3));
  const trailing12 = average(values.slice(-12));
  const prior12 = average(values.slice(-24, -12));
  return {
    latest3MonthAvg: latest3,
    previous3MonthAvg: previous3,
    momentum: latest3 !== null && previous3 ? safeGrowth(latest3, previous3) : null,
    twelveMonthMomentum: trailing12 !== null && prior12 ? safeGrowth(trailing12, prior12) : null,
    seasonality: latest3 !== null && trailing12 ? safeGrowth(latest3, trailing12) : null
  };
}

export function calculatePriceVolumeMix(metric: MetricBase): string {
  const valueGrowth = metric.growthPct ?? 0;
  const unitGrowth = metric.unitGrowthPct ?? 0;
  const cpGrowth = metric.cpGrowthPct ?? 0;
  if (valueGrowth > 0 && unitGrowth <= 1) return "Price/mix-led growth";
  if (unitGrowth > valueGrowth && unitGrowth > 0) return "Volume-led growth";
  if (valueGrowth > 0 && unitGrowth > 0) return "Broad-based growth";
  if (valueGrowth > 0 && cpGrowth <= 0) return "Inflation or price-led distortion risk";
  if (cpGrowth > 0) return "Real underlying demand growth";
  return "Weak growth quality";
}

export function classifyBrand(metric: Pick<AggregateRow, "share" | "growth" | "unitGrowth" | "cpGrowth">): string {
  const share = metric.share ?? 0;
  const growth = metric.growth ?? 0;
  const unitGrowth = metric.unitGrowth ?? 0;
  const cpGrowth = metric.cpGrowth ?? 0;
  if (share >= 10 && growth >= 8) return "Star leader";
  if (share >= 10 && growth < 0) return "At-risk incumbent";
  if (share >= 10) return "Mature leader / defend";
  if (share < 10 && growth >= 8) return "Emerging challenger / invest";
  if (cpGrowth > 0 && unitGrowth > 0) return "Real demand expansion";
  if (growth > 0 && cpGrowth <= 0) return "Price-led growth risk";
  return "Low-priority / rationalize";
}

export function classifyTherapy(metric: Pick<AggregateRow, "share" | "growth">): string {
  const large = metric.share >= 10;
  const highGrowth = metric.growth >= 8;
  if (large && highGrowth) return "Priority growth market";
  if (large) return "Profit pool / defend selectively";
  if (highGrowth) return "Emerging bet";
  return "Low-priority market";
}

export function classifyMolecule(metric: Pick<AggregateRow, "growth" | "companyCount">): string {
  const crowded = (metric.companyCount ?? 0) >= 5;
  const highGrowth = metric.growth >= 8;
  if (highGrowth && !crowded) return "White-space opportunity";
  if (highGrowth && crowded) return "Attractive but crowded";
  if (!highGrowth && crowded) return "Commoditized / avoid broad entry";
  return "Niche / selective play";
}

export function classifyCompany(metric: Pick<AggregateRow, "share" | "growth">): string {
  if (metric.share >= 10 && metric.growth >= 8) return "Market maker";
  if (metric.share >= 10) return "Incumbent under pressure";
  if (metric.growth >= 8) return "Agile challenger";
  return "Peripheral player";
}

export function calculateScores(rows: AggregateRow[], type: PharmaField): AggregateRow[] {
  const shares = rows.map((row) => row.share);
  const growth = rows.map((row) => row.growth);
  const growthAbs = rows.map((row) => row.growthAbs ?? 0);
  const momentum = rows.map((row) => row.momentum ?? 0);
  const unitGrowth = rows.map((row) => row.unitGrowth ?? 0);
  const intensity = rows.map((row) => row.competitiveIntensity ?? 0);
  const value = rows.map((row) => row.value);
  const cpGrowth = rows.map((row) => row.cpGrowth ?? 0);
  const launch = rows.map((row) => row.latest3MonthAvg ?? 0);

  return rows.map((row) => {
    let score = 0;
    if (type === "therapy") {
      score =
        normalizeMetric(value, row.value) * 0.3 +
        normalizeMetric(growth, row.growth) * 0.25 +
        normalizeMetric(cpGrowth, row.cpGrowth ?? 0) * 0.15 +
        normalizeMetric(unitGrowth, row.unitGrowth ?? 0) * 0.15 +
        normalizeMetric(intensity, row.competitiveIntensity ?? 0, true) * 0.15;
    } else if (type === "molecule") {
      score =
        normalizeMetric(growth, row.growth) * 0.25 +
        normalizeMetric(value, row.value) * 0.2 +
        normalizeMetric(unitGrowth, row.unitGrowth ?? 0) * 0.15 +
        normalizeMetric(cpGrowth, row.cpGrowth ?? 0) * 0.15 +
        normalizeMetric(intensity, row.competitiveIntensity ?? 0, true) * 0.15 +
        normalizeMetric(launch, row.latest3MonthAvg ?? 0) * 0.1;
    } else {
      score =
        normalizeMetric(shares, row.share) * 0.25 +
        normalizeMetric(growth, row.growth) * 0.25 +
        normalizeMetric(growthAbs, row.growthAbs ?? 0) * 0.2 +
        normalizeMetric(momentum, row.momentum ?? 0) * 0.15 +
        normalizeMetric(unitGrowth, row.unitGrowth ?? 0) * 0.1 +
        normalizeMetric(intensity, row.competitiveIntensity ?? 0, true) * 0.05;
    }
    return { ...row, score: Math.round(Math.max(0, Math.min(100, score))) };
  });
}

export function calculateDimensionMetrics(
  rows: RawRow[],
  mapping: FieldMapping,
  dimension: PharmaField,
  metric: PharmaField = "valueSales",
  filters?: FilterState
): AggregateRow[] | null {
  const model = buildPharmaDataModel(rows);
  if (!model.hasExactImsSchema) return null;

  const columns = model.columns;
  const resolved = mapDatasetColumns(columns, mapping);
  const dimensionColumn = mappedOrExact(columns, resolved, dimension);
  if (!dimensionColumn) return [];

  const valueLatest = exact(columns, IMS_VALUE.latestMat);
  const valuePrevious = exact(columns, IMS_VALUE.previousMat);
  const unitLatest = exact(columns, IMS_UNITS.latestMat);
  const unitPrevious = exact(columns, IMS_UNITS.previousMat);
  const volumeLatest = exact(columns, IMS_QTY.latestMat);
  const volumePrevious = exact(columns, IMS_QTY.previousMat);
  const cpLatest = exact(columns, IMS_CP_VALUE.latestMat);
  const cpPrevious = exact(columns, IMS_CP_VALUE.previousMat);
  const niLatest = exact(columns, IMS_NI.latestMat);
  const prMay25 = exact(columns, IMS_PRICE[IMS_PRICE.length - 1]);
  const companyColumn = mappedOrExact(columns, resolved, "company");
  const brandColumn = mappedOrExact(columns, resolved, "brand");
  const monthColumns = IMS_MONTHLY_VALUE_COLUMNS.map((column) => exact(columns, column)).filter(Boolean) as string[];
  const unitMonthColumns = IMS_MONTHLY_UNIT_COLUMNS.map((column) => exact(columns, column)).filter(Boolean) as string[];
  const cpMonthColumns = IMS_MONTHLY_CP_COLUMNS.map((column) => exact(columns, column)).filter(Boolean) as string[];

  const marketLatest = rows.reduce((sum, row) => {
    const latest = numberAt(row, valueLatest);
    return latest > 0 ? sum + latest : sum;
  }, 0);
  const marketPrevious = sumRows(rows, valuePrevious);
  const marketGrowthAbs = marketLatest - marketPrevious;
  const metricMap = new Map<string, MutableMetric>();

  rows.forEach((row) => {
    const latest = numberAt(row, valueLatest);
    const name = cellText(row[dimensionColumn]) || "Unmapped";
    const current = metricMap.get(name) ?? initMetric(name, monthColumns.length);
    if (latest <= 0) current.limitations.add("Rows with zero or blank MAT MAY'25 excluded from latest market size.");
    current.latestValue += latest > 0 ? latest : 0;
    current.previousValue += numberAt(row, valuePrevious);
    current.latestUnits += numberAt(row, unitLatest);
    current.previousUnits += numberAt(row, unitPrevious);
    current.latestVolume += numberAt(row, volumeLatest);
    current.previousVolume += numberAt(row, volumePrevious);
    current.latestCp += numberAt(row, cpLatest);
    current.previousCp += numberAt(row, cpPrevious);
    current.launchValue += numberAt(row, niLatest);
    const price = nullableNumberAt(row, prMay25);
    if (price !== null) current.prMay25 = (current.prMay25 ?? 0) + price;
    current.rowCount += 1;
    if (companyColumn) current.companies.add(cellText(row[companyColumn]));
    if (brandColumn) current.brands.add(cellText(row[brandColumn]));
    monthColumns.forEach((column, index) => {
      current.monthlyValue[index] += numberAt(row, column);
    });
    unitMonthColumns.forEach((column, index) => {
      if (index < current.monthlyUnits.length) current.monthlyUnits[index] += numberAt(row, column);
    });
    cpMonthColumns.forEach((column, index) => {
      if (index < current.monthlyCp.length) current.monthlyCp[index] += numberAt(row, column);
    });
    metricMap.set(name, current);
  });

  const rowsOut = Array.from(metricMap.values()).map((item) => {
    finalizeMetric(item);
    const selectedValue = selectedMetricValue(item, metric);
    const selectedPrevious = selectedPreviousValue(item, metric);
    const selectedGrowthPct = selectedGrowth(item, metric);
    const shareBase = metric === "units" ? sumRows(rows, unitLatest) : metric === "volume" ? sumRows(rows, volumeLatest) : marketLatest;
    const row: AggregateRow = {
      name: item.name,
      value: selectedValue,
      units: item.latestUnits,
      volume: item.latestVolume,
      mat: item.latestValue,
      previousValue: selectedPrevious,
      growthAbs: item.growthAbs,
      growth: selectedGrowthPct,
      unitGrowth: item.unitGrowthPct,
      cpGrowth: item.cpGrowthPct,
      growthContribution: marketGrowthAbs ? (item.growthAbs / marketGrowthAbs) * 100 : 0,
      priceProxyGrowth: item.priceProxyGrowth,
      momentum: item.momentum,
      latest3MonthAvg: item.latest3MonthAvg,
      previous3MonthAvg: item.previous3MonthAvg,
      seasonality: item.seasonality,
      share: shareBase ? (selectedValue / shareBase) * 100 : 0,
      rank: 0,
      priceProxy: item.priceProxy,
      rowCount: item.rowCount,
      competitiveIntensity: dimension === "company" ? item.brands.size : item.companies.size,
      companyCount: item.companies.size,
      brandCount: item.brands.size,
      dataLimitations: Array.from(item.limitations)
    };
    if (dimension === "therapy") row.classification = classifyTherapy(row);
    else if (dimension === "molecule") row.classification = classifyMolecule(row);
    else if (dimension === "company") row.classification = classifyCompany(row);
    else row.classification = classifyBrand(row);
    return row;
  });

  return calculateScores(rowsOut, dimension)
    .sort((a, b) => b.value - a.value)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export const calculateMarketKPIs = (rows: RawRow[]) => {
  const columns = Object.keys(rows[0] ?? {});
  const latestValue = exact(columns, IMS_VALUE.latestMat);
  const previousValue = exact(columns, IMS_VALUE.previousMat);
  const latestUnits = exact(columns, IMS_UNITS.latestMat);
  const previousUnits = exact(columns, IMS_UNITS.previousMat);
  const latestCp = exact(columns, IMS_CP_VALUE.latestMat);
  const previousCp = exact(columns, IMS_CP_VALUE.previousMat);
  const latest = sumRows(rows, latestValue);
  const previous = sumRows(rows, previousValue);
  const units = sumRows(rows, latestUnits);
  const previousUnitValue = sumRows(rows, previousUnits);
  const cp = sumRows(rows, latestCp);
  const previousCpValue = sumRows(rows, previousCp);
  return {
    latestValue: latest,
    previousValue: previous,
    growthAbs: latest - previous,
    growthPct: safeGrowth(latest, previous),
    latestUnits: units,
    previousUnits: previousUnitValue,
    unitGrowthPct: safeGrowth(units, previousUnitValue),
    cpGrowthPct: safeGrowth(cp, previousCpValue),
    momentum: calculateMonthlyMomentum(rows)
  };
};

export const calculateBrandMetrics = (rows: RawRow[], mapping: FieldMapping, filters?: FilterState) =>
  calculateDimensionMetrics(rows, mapping, "brand", filters?.metric ?? "valueSales", filters) ?? [];

export const calculateCompanyMetrics = (rows: RawRow[], mapping: FieldMapping, filters?: FilterState) =>
  calculateDimensionMetrics(rows, mapping, "company", filters?.metric ?? "valueSales", filters) ?? [];

export const calculateTherapyMetrics = (rows: RawRow[], mapping: FieldMapping, filters?: FilterState) =>
  calculateDimensionMetrics(rows, mapping, "therapy", filters?.metric ?? "valueSales", filters) ?? [];

export const calculateMoleculeMetrics = (rows: RawRow[], mapping: FieldMapping, filters?: FilterState) =>
  calculateDimensionMetrics(rows, mapping, "molecule", filters?.metric ?? "valueSales", filters) ?? [];

export const calculateOverviewReport = calculateMarketKPIs;
export const generateOverviewReport = calculateMarketKPIs;
export const generateMarketLandscapeReport = calculateTherapyMetrics;
export const generateCompetitorReport = calculateCompanyMetrics;
export const generateBrandDeepDiveReport = calculateBrandMetrics;
export const generateTherapyReport = calculateTherapyMetrics;
export const generateMoleculeReport = calculateMoleculeMetrics;

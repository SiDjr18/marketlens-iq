import type { FieldMapping, FilterState, KpiSet, RawRow } from "../utils/types";
import { aggregateByBrand, aggregateByCompany, aggregateByMolecule, aggregateByTherapy, metricValue, resolveMetricColumn, trendByPeriod } from "./aggregateData";

export function calculateKpis(rows: RawRow[], mapping: FieldMapping, filters: FilterState): KpiSet {
  const columns = Object.keys(rows[0] ?? {});
  const metricColumn = resolveMetricColumn(columns, mapping, filters.metric, filters);
  const unitsColumn = resolveMetricColumn(columns, mapping, "units", filters);
  const volumeColumn = resolveMetricColumn(columns, mapping, "volume", filters);
  const totalMarket = rows.reduce((sum, row) => sum + metricValue(row, mapping, filters.metric, filters, metricColumn), 0);
  const units = rows.reduce((sum, row) => sum + metricValue(row, mapping, "units", filters, unitsColumn), 0);
  const volume = rows.reduce((sum, row) => sum + metricValue(row, mapping, "volume", filters, volumeColumn), 0);
  const trend = trendByPeriod(rows, mapping, filters.metric);
  const latest = trend[trend.length - 1]?.value ?? 0;
  const previous = trend[trend.length - 2]?.value ?? 0;
  const growth = previous ? ((latest - previous) / previous) * 100 : 0;
  const brands = aggregateByBrand(rows, mapping, filters.metric, filters);
  const companies = aggregateByCompany(rows, mapping, filters.metric, filters);
  const therapies = aggregateByTherapy(rows, mapping, filters.metric, filters);
  const molecules = aggregateByMolecule(rows, mapping, filters.metric, filters);

  return {
    totalMarket,
    growth,
    units,
    volume,
    topBrand: brands[0]?.name ?? "Not mapped",
    topCompany: companies[0]?.name ?? "Not mapped",
    topTherapy: therapies[0]?.name ?? "Not mapped",
    topMolecule: molecules[0]?.name ?? "Not mapped"
  };
}

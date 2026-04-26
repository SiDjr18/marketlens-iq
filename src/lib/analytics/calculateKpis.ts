import type { FieldMapping, FilterState, KpiSet, RawRow } from "../utils/types";
import { aggregateByBrand, aggregateByCompany, aggregateByMolecule, aggregateByTherapy, fieldNumber, trendByPeriod } from "./aggregateData";

export function calculateKpis(rows: RawRow[], mapping: FieldMapping, filters: FilterState): KpiSet {
  const totalMarket = rows.reduce((sum, row) => sum + (fieldNumber(row, mapping, filters.metric) || fieldNumber(row, mapping, "valueSales") || fieldNumber(row, mapping, "mat")), 0);
  const units = rows.reduce((sum, row) => sum + fieldNumber(row, mapping, "units"), 0);
  const volume = rows.reduce((sum, row) => sum + fieldNumber(row, mapping, "volume"), 0);
  const trend = trendByPeriod(rows, mapping, filters.metric);
  const latest = trend[trend.length - 1]?.value ?? 0;
  const previous = trend[trend.length - 2]?.value ?? 0;
  const growth = previous ? ((latest - previous) / previous) * 100 : 0;
  const brands = aggregateByBrand(rows, mapping, filters.metric);
  const companies = aggregateByCompany(rows, mapping, filters.metric);
  const therapies = aggregateByTherapy(rows, mapping, filters.metric);
  const molecules = aggregateByMolecule(rows, mapping, filters.metric);

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

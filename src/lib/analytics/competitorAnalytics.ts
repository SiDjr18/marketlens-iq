import type { AggregateRow, FieldMapping, FilterState, RawRow } from "../utils/types";
import { aggregateByBrand, aggregateByCompany, aggregateByMolecule, aggregateByTherapy, trendByPeriod } from "./aggregateData";

export type CompetitorPack = {
  leaderboard: AggregateRow[];
  selected: AggregateRow | null;
  leader: AggregateRow | null;
  gapToLeader: number;
  trend: Array<{ period: string; value: number }>;
};

export function competitorAnalytics(rows: RawRow[], mapping: FieldMapping, filters: FilterState, level: "brand" | "company" | "therapy" | "molecule" = "brand"): CompetitorPack {
  const list =
    level === "company"
      ? aggregateByCompany(rows, mapping, filters.metric)
      : level === "therapy"
        ? aggregateByTherapy(rows, mapping, filters.metric)
        : level === "molecule"
          ? aggregateByMolecule(rows, mapping, filters.metric)
          : aggregateByBrand(rows, mapping, filters.metric);

  const selectedName = filters[level]?.[0] ?? list[0]?.name ?? "";
  const selected = list.find((row) => row.name === selectedName) ?? list[0] ?? null;
  const leader = list[0] ?? null;
  const gapToLeader = leader && selected ? Math.max(0, leader.value - selected.value) : 0;

  return {
    leaderboard: list.slice(0, 25),
    selected,
    leader,
    gapToLeader,
    trend: trendByPeriod(rows, mapping, filters.metric)
  };
}

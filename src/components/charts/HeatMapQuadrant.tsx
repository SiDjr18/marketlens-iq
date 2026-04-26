import type { AggregateRow } from "../../lib/utils/types";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";

type HeatMapQuadrantProps = {
  title: string;
  data: AggregateRow[];
};

export function HeatMapQuadrant({ title, data }: HeatMapQuadrantProps) {
  if (!data.length) return <EmptyState title="Heat map unavailable" description="Map share and growth supporting fields to enable quadrant analytics." />;
  const quadrants = [
    { title: "Defend & Grow", test: (row: AggregateRow) => row.share >= 10 && row.growth >= 0, color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
    { title: "Invest & Capture", test: (row: AggregateRow) => row.share < 10 && row.growth >= 0, color: "bg-teal-50 border-teal-200 text-teal-800" },
    { title: "Optimize & Harvest", test: (row: AggregateRow) => row.share >= 10 && row.growth < 0, color: "bg-amber-50 border-amber-200 text-amber-800" },
    { title: "Reposition / Exit", test: (row: AggregateRow) => row.share < 10 && row.growth < 0, color: "bg-red-50 border-red-200 text-red-800" }
  ];
  return (
    <Card>
      <h3 className="text-base font-bold text-navy">{title}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {quadrants.map((quadrant) => {
          const rows = data.filter(quadrant.test).slice(0, 5);
          return (
            <div key={quadrant.title} className={`min-h-[150px] rounded-xl border p-4 ${quadrant.color}`}>
              <div className="font-bold">{quadrant.title}</div>
              <div className="mt-3 space-y-2">
                {rows.length ? rows.map((row) => <div key={row.name} className="truncate text-sm font-semibold">{row.name}</div>) : <div className="text-sm opacity-70">No records in this quadrant</div>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

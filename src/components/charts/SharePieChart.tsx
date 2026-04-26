import type { AggregateRow } from "../../lib/utils/types";
import { formatPercent } from "../../lib/utils/formatters";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";

type SharePieChartProps = {
  title: string;
  data: AggregateRow[];
};

export function SharePieChart({ title, data }: SharePieChartProps) {
  const top = data.slice(0, 5);
  if (!top.length) return <EmptyState title="Share unavailable" description="Map a dimension and sales metric to enable share charts." />;
  return (
    <Card>
      <h3 className="text-base font-bold text-navy">{title}</h3>
      <div className="mt-4 space-y-3">
        {top.map((row, index) => (
          <div key={row.name}>
            <div className="flex items-center justify-between text-sm">
              <span className="truncate font-semibold text-slate-800">{row.name}</span>
              <span className="text-slate-500">{formatPercent(row.share)}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(3, row.share)}%`,
                  background: ["#0FB9B1", "#1ABC9C", "#0B1F3B", "#60A5FA", "#F59E0B"][index]
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

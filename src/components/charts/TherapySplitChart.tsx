import type { AggregateRow } from "../../lib/utils/types";
import { formatCurrency, formatPercent } from "../../lib/utils/formatters";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";

type TherapySplitChartProps = {
  title: string;
  data: AggregateRow[];
};

export function TherapySplitChart({ title, data }: TherapySplitChartProps) {
  const top = data.slice(0, 8);
  if (!top.length) return <EmptyState title="Therapy split unavailable" description="Map Therapy and Value Sales to enable this view." />;
  return (
    <Card>
      <h3 className="text-base font-bold text-navy">{title}</h3>
      <div className="mt-4 space-y-3">
        {top.map((row) => (
          <div key={row.name} className="grid grid-cols-[130px_1fr_80px] items-center gap-3 text-sm">
            <span className="truncate font-semibold text-slate-700">{row.name}</span>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald" style={{ width: `${Math.max(3, row.share)}%` }} />
            </div>
            <span className="text-right font-semibold text-slate-700">{formatPercent(row.share)}</span>
            <span className="col-start-2 -mt-2 text-xs text-slate-500">{formatCurrency(row.value)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

import type { AggregateRow } from "../../lib/utils/types";
import { formatCurrency, formatPercent } from "../../lib/utils/formatters";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";

type BubbleChartProps = {
  title: string;
  data: AggregateRow[];
};

export function BubbleChart({ title, data }: BubbleChartProps) {
  const top = data.slice(0, 18);
  if (!top.length) return <EmptyState title="Positioning unavailable" description="Map brand/company, sales, and time fields to enable bubble positioning." />;
  const maxShare = Math.max(...top.map((row) => row.share), 1);
  const maxValue = Math.max(...top.map((row) => row.value), 1);
  return (
    <Card>
      <h3 className="text-base font-bold text-navy">{title}</h3>
      <div className="relative mt-4 h-[360px] rounded-xl border border-border bg-slate-50">
        <div className="absolute left-1/2 top-0 h-full border-l border-dashed border-slate-300" />
        <div className="absolute left-0 top-1/2 w-full border-t border-dashed border-slate-300" />
        {top.map((row, index) => {
          const x = 8 + (row.share / maxShare) * 84;
          const y = 82 - Math.max(-20, Math.min(50, row.growth + 10));
          const size = 18 + (row.value / maxValue) * 34;
          return (
            <div
              key={row.name}
              className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm"
              style={{
                left: `${x}%`,
                top: `${Math.max(8, Math.min(92, y))}%`,
                width: size,
                height: size,
                background: ["#0FB9B1", "#1ABC9C", "#0B1F3B", "#60A5FA", "#F59E0B", "#EF4444"][index % 6]
              }}
            >
              <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-56 -translate-x-1/2 rounded-xl bg-navy p-3 text-xs text-white shadow-panel group-hover:block">
                <div className="font-bold">{row.name}</div>
                <div>Share: {formatPercent(row.share)}</div>
                <div>Growth: {formatPercent(row.growth)}</div>
                <div>Sales: {formatCurrency(row.value)}</div>
              </div>
            </div>
          );
        })}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-semibold text-slate-500">Market share</div>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-semibold text-slate-500">Growth</div>
      </div>
    </Card>
  );
}

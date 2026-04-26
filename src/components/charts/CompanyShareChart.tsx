import type { AggregateRow } from "../../lib/utils/types";
import { formatCurrency, formatPercent } from "../../lib/utils/formatters";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";

type CompanyShareChartProps = {
  title: string;
  data: AggregateRow[];
};

export function CompanyShareChart({ title, data }: CompanyShareChartProps) {
  const top = data.slice(0, 8);
  if (!top.length) return <EmptyState title="Company share unavailable" description="Map Company and Value Sales to enable company contribution." />;
  return (
    <Card>
      <h3 className="text-base font-bold text-navy">{title}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {top.map((row) => (
          <div key={row.name} className="rounded-xl border border-border bg-slate-50 p-3">
            <div className="truncate text-sm font-bold text-slate-900">{row.name}</div>
            <div className="mt-1 text-lg font-bold text-navy">{formatCurrency(row.value)}</div>
            <div className="text-xs font-semibold text-teal">{formatPercent(row.share)} share</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

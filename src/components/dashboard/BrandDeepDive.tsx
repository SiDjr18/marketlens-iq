import type { AnalyticsContext } from "../../lib/utils/types";
import { aggregateByBrand, trendByPeriod } from "../../lib/analytics/aggregateData";
import { competitorAnalytics } from "../../lib/analytics/competitorAnalytics";
import { formatCurrency, formatNumber, formatPercent } from "../../lib/utils/formatters";
import { RankingTable } from "../charts/RankingTable";
import { TrendChart } from "../charts/TrendChart";
import { Card } from "../ui/Card";

export function BrandDeepDive({ context }: { context: AnalyticsContext }) {
  const brands = aggregateByBrand(context.rows, context.mapping, context.filters.metric, context.filters);
  const selectedName = context.filters.brand[0] ?? brands[0]?.name;
  const selected = brands.find((brand) => brand.name === selectedName) ?? brands[0];
  const competitors = competitorAnalytics(context.rows, context.mapping, context.filters, "brand");

  return (
    <div className="grid grid-cols-12 gap-4">
      <Card className="col-span-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Brand deep dive</div>
            <h2 className="mt-1 text-3xl font-black text-navy">{selected?.name ?? "Map brand field"}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Summary label="Sales" value={formatCurrency(selected?.value ?? 0)} />
            <Summary label="Rank" value={selected?.rank ? `#${selected.rank}` : "n/a"} />
            <Summary label="Share" value={formatPercent(selected?.share ?? 0)} />
            <Summary label="Score" value={selected?.score === undefined ? "n/a" : `${formatNumber(selected.score, 0)}/100`} />
          </div>
        </div>
      </Card>
      <div className="col-span-12 lg:col-span-8">
        <TrendChart title="Brand monthly trend" data={trendByPeriod(context.rows, context.mapping, context.filters.metric)} />
      </div>
      <Card className="col-span-12 lg:col-span-4">
        <h3 className="text-base font-bold text-navy">Performance stack</h3>
        <div className="mt-4 space-y-3 text-sm">
          <Line label="Units" value={formatNumber(selected?.units ?? 0)} />
          <Line label="Volume" value={formatNumber(selected?.volume ?? 0)} />
          <Line label="Growth" value={formatPercent(selected?.growth ?? 0)} />
          <Line label="Unit growth" value={formatPercent(selected?.unitGrowth ?? 0)} />
          <Line label="CP growth" value={formatPercent(selected?.cpGrowth ?? 0)} />
          <Line label="Monthly momentum" value={formatPercent(selected?.momentum ?? 0)} />
          <Line label="Classification" value={selected?.classification ?? "n/a"} />
          <Line label="Price proxy" value={formatCurrency(selected?.priceProxy ?? 0)} />
          <Line label="Gap to leader" value={formatCurrency(competitors.gapToLeader)} />
        </div>
      </Card>
      <div className="col-span-12">
        <RankingTable title="Top competitors" data={competitors.leaderboard} />
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[120px] rounded-xl bg-slate-50 p-3">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-black text-navy">{value}</div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
      <span className="font-semibold text-slate-600">{label}</span>
      <span className="font-bold text-navy">{value}</span>
    </div>
  );
}

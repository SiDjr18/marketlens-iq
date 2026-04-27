import type { AnalyticsContext } from "../../lib/utils/types";
import { competitorAnalytics } from "../../lib/analytics/competitorAnalytics";
import { formatCurrency, formatPercent } from "../../lib/utils/formatters";
import { BubbleChart } from "../charts/BubbleChart";
import { HeatMapQuadrant } from "../charts/HeatMapQuadrant";
import { RankingTable } from "../charts/RankingTable";
import { Card } from "../ui/Card";

export function CompetitorPositioning({ context }: { context: AnalyticsContext }) {
  const pack = competitorAnalytics(context.rows, context.mapping, context.filters, context.filters.company.length ? "company" : "brand");
  return (
    <div className="grid grid-cols-12 gap-4">
      <Card className="col-span-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Summary label="Selected" value={pack.selected?.name ?? "n/a"} />
        <Summary label="Market share" value={formatPercent(pack.selected?.share ?? 0)} />
        <Summary label="Growth" value={formatPercent(pack.selected?.growth ?? 0)} />
        <Summary label="Threat score" value={pack.selected?.score === undefined ? "n/a" : `${Math.round(pack.selected.score)}/100`} />
        <Summary label="Gap to leader" value={formatCurrency(pack.gapToLeader)} />
      </Card>
      <div className="col-span-12 lg:col-span-7">
        <BubbleChart title="Competitor bubble chart: share vs growth" data={pack.leaderboard} />
      </div>
      <div className="col-span-12 lg:col-span-5">
        <HeatMapQuadrant title="Decision heat map" data={pack.leaderboard} />
      </div>
      <div className="col-span-12">
        <RankingTable title="Competitor leaderboard" data={pack.leaderboard} />
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 truncate text-xl font-black text-navy">{value}</div>
    </div>
  );
}

import type { AggregateRow } from "../../lib/utils/types";
import { formatCurrency, formatNumber, formatPercent } from "../../lib/utils/formatters";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";

type RankingTableProps = {
  title: string;
  data: AggregateRow[];
};

export function RankingTable({ title, data }: RankingTableProps) {
  if (!data.length) return <EmptyState title="Ranking unavailable" description="Map the requested dimension and sales metric to enable rankings." />;
  return (
    <Card className="overflow-hidden">
      <h3 className="text-base font-bold text-navy">{title}</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Rank</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2 text-right">Sales</th>
              <th className="px-3 py-2 text-right">Share</th>
              <th className="px-3 py-2 text-right">Growth</th>
              <th className="px-3 py-2 text-right">Units</th>
              <th className="px-3 py-2 text-right">Score</th>
              <th className="px-3 py-2">Classification</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 15).map((row) => (
              <tr key={row.name} className="border-t border-border">
                <td className="px-3 py-2 font-bold text-navy">{row.rank}</td>
                <td className="px-3 py-2 font-semibold text-slate-800">{row.name}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(row.value)}</td>
                <td className="px-3 py-2 text-right">{formatPercent(row.share)}</td>
                <td className="px-3 py-2 text-right">{formatPercent(row.growth)}</td>
                <td className="px-3 py-2 text-right">{formatNumber(row.units)}</td>
                <td className="px-3 py-2 text-right">{row.score === undefined ? "n/a" : formatNumber(row.score, 0)}</td>
                <td className="px-3 py-2 text-xs font-semibold text-slate-600">{row.classification ?? "n/a"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

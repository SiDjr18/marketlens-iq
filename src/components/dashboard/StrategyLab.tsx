import { useMemo } from "react";
import type { AnalyticsContext } from "../../lib/utils/types";
import { supportedFrameworks, generateInsights } from "../../lib/strategy/insightEngine";
import { isStrategyReady } from "../../lib/mapping/validateMapping";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";

export function StrategyLab({ context, onOpenMapping }: { context: AnalyticsContext; onOpenMapping: () => void }) {
  if (!isStrategyReady(context.health)) {
    return <EmptyState title="Strategy Lab is locked" description="Complete field mapping and pass the data health gate before generating strategy." action={<Button variant="primary" onClick={onOpenMapping}>Open Field Mapping</Button>} />;
  }

  const insights = useMemo(() => generateInsights(context), [context]);
  const frameworks = useMemo(() => supportedFrameworks(context), [context]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 grid gap-4 lg:grid-cols-2">
        {insights.map((insight) => (
          <Card key={insight.title}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-black text-navy">{insight.title}</h3>
              <Badge tone="info">{insight.confidence}% confidence</Badge>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              <p><strong>What happened:</strong> {insight.whatHappened}</p>
              <p><strong>Why it matters:</strong> {insight.whyItMatters}</p>
              <p><strong>Recommended action:</strong> {insight.recommendedAction}</p>
              <p className="text-xs text-slate-500"><strong>Data used:</strong> {insight.dataUsed}</p>
            </div>
          </Card>
        ))}
      </div>
      <div className="col-span-12">
        <Card>
          <h3 className="text-lg font-black text-navy">Consulting frameworks supported by mapped data</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {frameworks.map((framework) => (
              <div key={framework.title} className="rounded-xl border border-border bg-slate-50 p-4">
                <div className="text-sm font-black text-teal">{framework.title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{framework.summary}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-navy">{framework.action}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

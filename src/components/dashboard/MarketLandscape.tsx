import { useMemo } from "react";
import type { AnalyticsContext } from "../../lib/utils/types";
import { aggregateByBrand, aggregateByCompany, aggregateByMolecule, aggregateByTherapy, trendByPeriod } from "../../lib/analytics/aggregateData";
import { CompanyShareChart } from "../charts/CompanyShareChart";
import { RankingTable } from "../charts/RankingTable";
import { TherapySplitChart } from "../charts/TherapySplitChart";
import { TrendChart } from "../charts/TrendChart";

export function MarketLandscape({ context }: { context: AnalyticsContext }) {
  const brands = useMemo(() => aggregateByBrand(context.rows, context.mapping, context.filters.metric, context.filters), [context]);
  const companies = useMemo(() => aggregateByCompany(context.rows, context.mapping, context.filters.metric, context.filters), [context]);
  const therapies = useMemo(() => aggregateByTherapy(context.rows, context.mapping, context.filters.metric, context.filters), [context]);
  const molecules = useMemo(() => aggregateByMolecule(context.rows, context.mapping, context.filters.metric, context.filters), [context]);
  const trend = useMemo(() => trendByPeriod(context.rows, context.mapping, context.filters.metric), [context]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-8">
        <TrendChart title="Market sales trend" data={trend} />
      </div>
      <div className="col-span-12 lg:col-span-4">
        <TherapySplitChart title="Therapy contribution" data={therapies} />
      </div>
      <div className="col-span-12 lg:col-span-6">
        <CompanyShareChart title="Company contribution" data={companies} />
      </div>
      <div className="col-span-12 lg:col-span-6">
        <RankingTable title="Brand contribution" data={brands} />
      </div>
      <div className="col-span-12 lg:col-span-6">
        <RankingTable title="Molecule contribution" data={molecules} />
      </div>
      <div className="col-span-12 lg:col-span-6">
        <RankingTable title="Therapy concentration" data={therapies} />
      </div>
    </div>
  );
}

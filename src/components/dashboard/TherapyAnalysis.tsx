import type { AnalyticsContext } from "../../lib/utils/types";
import { aggregateByBrand, aggregateByTherapy } from "../../lib/analytics/aggregateData";
import { BubbleChart } from "../charts/BubbleChart";
import { RankingTable } from "../charts/RankingTable";
import { TherapySplitChart } from "../charts/TherapySplitChart";

export function TherapyAnalysis({ context }: { context: AnalyticsContext }) {
  const therapies = aggregateByTherapy(context.rows, context.mapping, context.filters.metric, context.filters);
  const brands = aggregateByBrand(context.rows, context.mapping, context.filters.metric, context.filters);
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-6">
        <TherapySplitChart title="Therapy attractiveness" data={therapies} />
      </div>
      <div className="col-span-12 lg:col-span-6">
        <BubbleChart title="Therapy opportunity positioning" data={therapies} />
      </div>
      <div className="col-span-12 lg:col-span-6">
        <RankingTable title="Therapy ranking" data={therapies} />
      </div>
      <div className="col-span-12 lg:col-span-6">
        <RankingTable title="Brands in selected therapy view" data={brands} />
      </div>
    </div>
  );
}

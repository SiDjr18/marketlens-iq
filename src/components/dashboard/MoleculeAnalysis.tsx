import type { AnalyticsContext } from "../../lib/utils/types";
import { aggregateByBrand, aggregateByMolecule } from "../../lib/analytics/aggregateData";
import { BubbleChart } from "../charts/BubbleChart";
import { RankingTable } from "../charts/RankingTable";
import { SharePieChart } from "../charts/SharePieChart";

export function MoleculeAnalysis({ context }: { context: AnalyticsContext }) {
  const molecules = aggregateByMolecule(context.rows, context.mapping, context.filters.metric);
  const brands = aggregateByBrand(context.rows, context.mapping, context.filters.metric);
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-4">
        <SharePieChart title="Molecule share" data={molecules} />
      </div>
      <div className="col-span-12 lg:col-span-8">
        <BubbleChart title="Molecule whitespace map" data={molecules} />
      </div>
      <div className="col-span-12 lg:col-span-6">
        <RankingTable title="Molecule ranking" data={molecules} />
      </div>
      <div className="col-span-12 lg:col-span-6">
        <RankingTable title="Brand distribution" data={brands} />
      </div>
    </div>
  );
}

import { Building2, ChartNoAxesCombined, Package, Pill, TrendingUp, Users } from "lucide-react";
import type { AnalyticsContext } from "../../lib/utils/types";
import { formatCurrency, formatNumber, formatPercent } from "../../lib/utils/formatters";
import { aggregateByBrand, aggregateByCompany, aggregateByMolecule, aggregateByTherapy, trendByPeriod } from "../../lib/analytics/aggregateData";
import { calculateKpis } from "../../lib/analytics/calculateKpis";
import { BubbleChart } from "../charts/BubbleChart";
import { CompanyShareChart } from "../charts/CompanyShareChart";
import { RankingTable } from "../charts/RankingTable";
import { SharePieChart } from "../charts/SharePieChart";
import { TherapySplitChart } from "../charts/TherapySplitChart";
import { TrendChart } from "../charts/TrendChart";
import { KpiCard } from "./KpiCard";

export function OverviewDashboard({ context }: { context: AnalyticsContext }) {
  const { rows, mapping, filters } = context;
  const kpis = calculateKpis(rows, mapping, filters);
  const brands = aggregateByBrand(rows, mapping, filters.metric);
  const companies = aggregateByCompany(rows, mapping, filters.metric);
  const therapies = aggregateByTherapy(rows, mapping, filters.metric);
  const molecules = aggregateByMolecule(rows, mapping, filters.metric);
  const trend = trendByPeriod(rows, mapping, filters.metric);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <KpiCard label="Total Market" value={formatCurrency(kpis.totalMarket)} helper={`${rows.length.toLocaleString("en-IN")} filtered records`} icon={<ChartNoAxesCombined className="h-5 w-5" />} tone="teal" />
        <KpiCard label="Growth" value={formatPercent(kpis.growth)} helper="Latest vs previous period" icon={<TrendingUp className="h-5 w-5" />} tone="emerald" />
        <KpiCard label="Units" value={formatNumber(kpis.units)} helper="Mapped unit sales" icon={<Package className="h-5 w-5" />} />
        <KpiCard label="Volume" value={formatNumber(kpis.volume)} helper="Mapped volume sales" icon={<Pill className="h-5 w-5" />} />
        <KpiCard label="Top Brand" value={kpis.topBrand} helper={brands[0] ? `${formatPercent(brands[0].share)} share` : "Mapping required"} icon={<Users className="h-5 w-5" />} tone="amber" />
        <KpiCard label="Top Company" value={kpis.topCompany} helper={companies[0] ? `${formatPercent(companies[0].share)} share` : "Mapping required"} icon={<Building2 className="h-5 w-5" />} />
      </div>
      <div className="col-span-12 lg:col-span-8">
        <TrendChart title="Sales trend" data={trend} />
      </div>
      <div className="col-span-12 lg:col-span-4">
        <SharePieChart title="Brand share" data={brands} />
      </div>
      <div className="col-span-12 lg:col-span-6">
        <TherapySplitChart title="Therapy contribution" data={therapies} />
      </div>
      <div className="col-span-12 lg:col-span-6">
        <CompanyShareChart title="Company contribution" data={companies} />
      </div>
      <div className="col-span-12 lg:col-span-6">
        <RankingTable title="Brand ranking" data={brands} />
      </div>
      <div className="col-span-12 lg:col-span-6">
        <RankingTable title="Molecule distribution" data={molecules} />
      </div>
      <div className="col-span-12">
        <BubbleChart title="Share vs growth bubble view" data={brands} />
      </div>
    </div>
  );
}

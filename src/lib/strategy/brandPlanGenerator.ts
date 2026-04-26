import type { AnalyticsContext, BrandPlanInput, BrandPlanSection } from "../utils/types";
import { formatCurrency, formatNumber, formatPercent } from "../utils/formatters";
import { aggregateByBrand, aggregateByCompany, aggregateByTherapy } from "../analytics/aggregateData";
import { competitorAnalytics } from "../analytics/competitorAnalytics";
import { isStrategyReady } from "../mapping/validateMapping";

export function generateBrandPlan(context: AnalyticsContext, input: BrandPlanInput): BrandPlanSection[] {
  if (!isStrategyReady(context.health)) return [];

  const brands = aggregateByBrand(context.rows, context.mapping, context.filters.metric, context.filters);
  const therapies = aggregateByTherapy(context.rows, context.mapping, context.filters.metric, context.filters);
  const companies = aggregateByCompany(context.rows, context.mapping, context.filters.metric, context.filters);
  const selected = brands.find((row) => row.name === input.brand) ?? brands[0];
  const therapy = therapies.find((row) => row.name === input.therapy) ?? therapies[0];
  const competitorPack = competitorAnalytics(context.rows, context.mapping, context.filters, "brand");
  const competitorNames = input.competitors.length ? input.competitors : competitorPack.leaderboard.slice(1, 4).map((row) => row.name);
  const rank = selected?.rank ?? 0;
  const share = selected?.share ?? 0;

  return [
    {
      title: "Executive summary",
      points: [
        `${selected?.name ?? "Selected brand"} is ranked ${rank || "n/a"} with ${formatCurrency(selected?.value ?? 0)} and ${formatPercent(share)} share in the filtered market.`,
        `Primary objective: ${input.objective} over ${input.horizon}.`,
        `Decision focus: grow profitable share while tracking competitor response from ${competitorNames.join(", ") || "mapped competitors"}.`
      ]
    },
    {
      title: "Market overview",
      points: [
        `${therapy?.name ?? "Mapped therapy"} contributes ${formatCurrency(therapy?.value ?? 0)} with ${formatPercent(therapy?.share ?? 0)} share of the filtered dataset.`,
        `${companies[0]?.name ?? "Top company"} leads company contribution, indicating the benchmark portfolio to study.`
      ]
    },
    {
      title: "Brand performance",
      points: [
        `Sales: ${formatCurrency(selected?.value ?? 0)}; units: ${formatNumber(selected?.units ?? 0)}; volume: ${formatNumber(selected?.volume ?? 0)}.`,
        `Price proxy: ${formatCurrency(selected?.priceProxy ?? 0)} per unit where unit data is mapped.`,
        `Growth signal: ${formatPercent(selected?.growth ?? 0)} based on detected time periods.`
      ]
    },
    {
      title: "Competitor analysis",
      points: [
        `Leader: ${competitorPack.leader?.name ?? "n/a"}; gap to leader: ${formatCurrency(competitorPack.gapToLeader)}.`,
        `Track top competitors: ${competitorNames.join(", ") || "map competitor fields to enable named comparison"}.`,
        "Use share, growth, units, and price proxy together before changing investment levels."
      ]
    },
    {
      title: "Segmentation and targeting",
      points: [
        "Segment by therapy, molecule, company type, and acute/chronic behavior from mapped columns.",
        "Prioritize segments with above-average value share and visible unit or volume headroom.",
        "Create field-force target lists around brands where the gap to leader is commercially reachable."
      ]
    },
    {
      title: "Positioning and messaging",
      points: [
        `Position ${selected?.name ?? "the brand"} against the leading competitor using therapy relevance, molecule differentiation, and pack economics.`,
        "Core message should connect clinical relevance to measurable business levers: growth, share gain, and unit velocity.",
        "Use separate messages for defend, conquest, and revival accounts."
      ]
    },
    {
      title: "Strategic imperatives",
      points: [
        share > 15 ? "Defend core share with account retention and KOL reinforcement." : "Invest selectively in high-growth pockets where share is low.",
        "Close price-volume gaps before increasing broad promotional spend.",
        "Review monthly performance with rank, share, growth, value, units, and volume as the decision stack."
      ]
    },
    {
      title: "Tactical plan",
      points: [
        "90 days: validate priority accounts, confirm competitor switch triggers, and launch focused promotion.",
        "180 days: scale winning therapy/molecule cells and rebalance underperforming packs.",
        "365 days: lock share gains into the annual operating plan and portfolio roadmap."
      ]
    },
    {
      title: "Sales, digital, and KOL plan",
      points: [
        "Sales: route effort to high-value therapy clusters and brands with measurable rank movement potential.",
        "Digital: run segmented campaigns by therapy and molecule with conversion KPIs.",
        "KOL: activate credible voices in therapy cells where competitor intensity is high."
      ]
    },
    {
      title: "Budget, KPIs, and risk mitigation",
      points: [
        "Budget allocation should follow opportunity size, confidence score, and gap to leader.",
        "KPIs: MAT value, monthly value, units, volume, share, rank, growth, price proxy, and competitor gap.",
        "Risks: low mapping confidence, missing unit/volume fields, outlier values, and competitor price response."
      ]
    }
  ];
}

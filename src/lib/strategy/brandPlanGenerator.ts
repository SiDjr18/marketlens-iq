import type { AggregateRow, AnalyticsContext, BrandPlanInput, BrandPlanSection } from "../utils/types";
import { cellText, formatCurrency, formatNumber, formatPercent } from "../utils/formatters";
import { aggregateByBrand, aggregateByCompany, aggregateByMolecule, aggregateByTherapy } from "../analytics/aggregateData";
import { competitorAnalytics } from "../analytics/competitorAnalytics";
import { isStrategyReady } from "../mapping/validateMapping";

function bestPotentialBrand(brands: AggregateRow[]) {
  return [...brands].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0] ?? brands[0];
}

function descriptor(context: AnalyticsContext, brandName: string) {
  const brandColumn = context.mapping.brand;
  const row = context.rows.find((item) => brandColumn && cellText(item[brandColumn]) === brandName);
  const read = (field: keyof AnalyticsContext["mapping"]) => {
    const column = context.mapping[field];
    return row && column ? cellText(row[column]) : "Column not available";
  };
  return {
    company: read("company"),
    molecule: read("molecule"),
    therapy: read("therapy"),
    pack: read("pack"),
    marketType: read("marketType"),
    companyType: read("companyType"),
    productType: read("productType")
  };
}

function limitations(context: AnalyticsContext, selected?: AggregateRow) {
  const issues = new Set<string>();
  if (context.rows.length < 5) issues.add("Selected data subset has fewer than 5 rows; confidence is limited.");
  selected?.dataLimitations?.forEach((item) => issues.add(item));
  context.health.missingFields.forEach((field) => issues.add(`${field} column not available or not mapped.`));
  return Array.from(issues);
}

export function generateBrandPlan(context: AnalyticsContext, input: BrandPlanInput): BrandPlanSection[] {
  if (!isStrategyReady(context.health)) return [];

  const brands = aggregateByBrand(context.rows, context.mapping, context.filters.metric, context.filters);
  const therapies = aggregateByTherapy(context.rows, context.mapping, context.filters.metric, context.filters);
  const molecules = aggregateByMolecule(context.rows, context.mapping, context.filters.metric, context.filters);
  const companies = aggregateByCompany(context.rows, context.mapping, context.filters.metric, context.filters);
  const selected = brands.find((row) => row.name === input.brand) ?? bestPotentialBrand(brands);
  const brandContext = descriptor(context, selected?.name ?? "");
  const therapy = therapies.find((row) => row.name === input.therapy) ?? therapies[0];
  const molecule = molecules.find((row) => row.name === brandContext.molecule) ?? molecules[0];
  const competitorPack = competitorAnalytics(context.rows, context.mapping, context.filters, "brand");
  const competitorNames = input.competitors.length ? input.competitors : competitorPack.leaderboard.filter((row) => row.name !== selected?.name).slice(0, 4).map((row) => row.name);
  const rank = selected?.rank ?? 0;
  const share = selected?.share ?? 0;
  const score = selected?.score ?? 0;
  const gaps = limitations(context, selected);

  return [
    {
      title: "Executive summary",
      points: [
        `${selected?.name ?? "Selected brand"} by ${brandContext.company} is ranked ${rank || "n/a"} with ${formatCurrency(selected?.value ?? 0)} MAT MAY'25 value, ${formatPercent(share)} share, and ${formatNumber(score, 0)}/100 brand potential score.`,
        `Classification: ${selected?.classification ?? "Column not available"}; objective: ${input.objective}; horizon: ${input.horizon}.`,
        `Priority decision: ${share >= 10 ? "defend leadership and improve growth quality" : "invest only if momentum and unit growth validate share capture"}.`
      ]
    },
    {
      title: "Market overview",
      points: [
        `${brandContext.therapy} contributes ${formatCurrency(therapy?.value ?? 0)} with ${formatPercent(therapy?.growth ?? 0)} growth and ${formatNumber(therapy?.score ?? 0, 0)}/100 therapy attractiveness.`,
        `${brandContext.molecule} is classified as ${molecule?.classification ?? "Column not available"} with ${molecule?.companyCount ?? 0} companies and ${molecule?.brandCount ?? 0} brands competing.`,
        `${companies[0]?.name ?? "Column not available"} is the company benchmark in the filtered market.`
      ]
    },
    {
      title: "Brand performance",
      points: [
        `MAT MAY'25: ${formatCurrency(selected?.value ?? 0)}; growth vs MAT MAY'24: ${formatPercent(selected?.growth ?? 0)}; absolute growth: ${formatCurrency(selected?.growthAbs ?? 0)}.`,
        `Units: ${formatNumber(selected?.units ?? 0)}; unit growth: ${formatPercent(selected?.unitGrowth ?? 0)}; price proxy: ${formatCurrency(selected?.priceProxy ?? 0)}; price proxy growth: ${formatPercent(selected?.priceProxyGrowth ?? 0)}.`,
        `Monthly momentum: ${formatPercent(selected?.momentum ?? 0)} using latest 3-month average versus previous 3 months.`
      ]
    },
    {
      title: "Competitor analysis",
      points: [
        `Leader: ${competitorPack.leader?.name ?? "n/a"}; gap to leader: ${formatCurrency(competitorPack.gapToLeader)}.`,
        `Track direct competitors: ${competitorNames.join(", ") || "Column not available"}.`,
        `Competitive intensity: ${selected?.competitiveIntensity ?? 0}; contribution to growth: ${formatPercent(selected?.growthContribution ?? 0)}.`
      ]
    },
    {
      title: "Segmentation and targeting",
      points: [
        `Segment by ${brandContext.therapy}, ${brandContext.molecule}, ${brandContext.marketType}, ${brandContext.productType}, and ${brandContext.companyType}.`,
        `Prioritize molecule/subgroup cells where ${selected?.name ?? "brand"} has positive unit growth and CP growth: ${formatPercent(selected?.cpGrowth ?? 0)}.`,
        "Target accounts where leader share is high but challenger momentum is visible in monthly value trend."
      ]
    },
    {
      title: "Positioning and messaging",
      points: [
        `Position ${selected?.name ?? "the brand"} around ${brandContext.molecule}, ${brandContext.pack}, and ${brandContext.productType} differentiation.`,
        `Core message should address ${selected?.classification ?? "current"} status with proof from growth, share, unit growth, and price proxy.`,
        `Use competitor comparison against ${competitorNames[0] ?? "nearest competitor"} in therapy and molecule discussions.`
      ]
    },
    {
      title: "Strategic imperatives",
      points: [
        share >= 10 ? "Defend: protect high-value accounts, avoid price-volume leakage, and reinforce KOL advocacy." : "Invest: focus spend only in high-score pockets with measurable share movement.",
        (selected?.unitGrowth ?? 0) > 0 ? "Scale volume drivers because unit growth is positive." : "Diagnose volume softness before increasing promotion.",
        (selected?.cpGrowth ?? 0) > 0 ? "Treat CP growth as real underlying demand support." : "Flag price-led growth risk and validate demand quality."
      ]
    },
    {
      title: "Tactical plan",
      points: [
        `90 days: confirm top molecule/subgroup accounts, compare packs, and track ${selected?.name ?? "brand"} against ${competitorNames[0] ?? "leader"}.`,
        "180 days: scale the best-performing therapy/molecule cells and rebalance weak packs.",
        "365 days: convert score-backed growth pockets into annual operating plan targets with share, units, and value gates."
      ]
    },
    {
      title: "Sales, digital, and KOL plan",
      points: [
        `Sales: focus field effort on ${brandContext.therapy} and ${brandContext.molecule} pools with high growth contribution.`,
        "Digital: run segmented campaigns by molecule, pack, and company-type opportunity.",
        "KOL: use credible voices where competitive intensity is high or the brand is an emerging challenger."
      ]
    },
    {
      title: "Budget, KPIs, and risk mitigation",
      points: [
        `Budget should follow brand potential score ${formatNumber(score, 0)}/100, gap to leader ${formatCurrency(competitorPack.gapToLeader)}, and contribution to growth ${formatPercent(selected?.growthContribution ?? 0)}.`,
        "KPIs: MAT MAY'25, MAT MAY'24 growth, unit growth, CP growth, share, rank, price proxy, monthly momentum, and competitor gap.",
        `Data limitations: ${gaps.length ? gaps.join(" ") : "No critical limitations detected in the selected mapped dataset."}`
      ]
    }
  ];
}

export const generateBrandPlanReport = generateBrandPlan;

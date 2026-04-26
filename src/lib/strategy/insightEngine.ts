import type { AnalyticsContext, Insight } from "../utils/types";
import { formatCurrency, formatNumber, formatPercent } from "../utils/formatters";
import { aggregateByBrand, aggregateByCompany, aggregateByTherapy } from "../analytics/aggregateData";
import { isStrategyReady } from "../mapping/validateMapping";

export function generateInsights(context: AnalyticsContext): Insight[] {
  if (!isStrategyReady(context.health)) return [];

  const brands = aggregateByBrand(context.rows, context.mapping, context.filters.metric);
  const companies = aggregateByCompany(context.rows, context.mapping, context.filters.metric);
  const therapies = aggregateByTherapy(context.rows, context.mapping, context.filters.metric);
  const leader = brands[0];
  const challenger = brands[1];
  const topCompany = companies[0];
  const topTherapy = therapies[0];
  const insights: Insight[] = [];

  if (leader) {
    insights.push({
      title: "Leader concentration",
      whatHappened: `${leader.name} contributes ${formatPercent(leader.share)} of the selected market with ${formatCurrency(leader.value)} sales.`,
      whyItMatters: leader.share > 25 ? "A high share leader can defend access, visibility, and field-force priority." : "The market is fragmented enough for focused share capture.",
      recommendedAction: leader.share > 25 ? "Protect core accounts, monitor price-volume leakage, and build retention plays around the leader segment." : "Prioritize high-growth competitors and build a conquest list by therapy and molecule.",
      confidence: Math.min(95, context.health.confidence + 5),
      dataUsed: `${context.rows.length.toLocaleString("en-IN")} filtered rows; brand, value, and share aggregations`
    });
  }

  if (leader && challenger) {
    const gap = leader.value - challenger.value;
    insights.push({
      title: "Competitive gap to next brand",
      whatHappened: `${leader.name} is ahead of ${challenger.name} by ${formatCurrency(gap)}.`,
      whyItMatters: "The gap quantifies how much incremental sales are required to change rank or defend leadership.",
      recommendedAction: gap > leader.value * 0.2 ? "Use differentiated investment tiers: defend the leader while creating targeted challenger plays." : "Treat the top two brands as a direct battle and compare pack, price proxy, and therapy concentration.",
      confidence: context.health.confidence,
      dataUsed: "Brand leaderboard, sales value, and rank"
    });
  }

  if (topCompany) {
    insights.push({
      title: "Company portfolio leverage",
      whatHappened: `${topCompany.name} leads the company view with ${formatCurrency(topCompany.value)} and ${formatNumber(topCompany.rowCount, 0)} records.`,
      whyItMatters: "Company-level concentration shows where portfolio breadth or focused bets are shaping the market.",
      recommendedAction: "Benchmark portfolio breadth against top brands and identify therapy pockets where the company is under-indexed.",
      confidence: context.health.confidence,
      dataUsed: "Company aggregation from current filters"
    });
  }

  if (topTherapy) {
    insights.push({
      title: "Therapy attractiveness",
      whatHappened: `${topTherapy.name} is the largest mapped therapy with ${formatPercent(topTherapy.share)} share.`,
      whyItMatters: "Therapy share determines where brand planning, KOL activation, and financial allocation should be prioritized.",
      recommendedAction: "Run a therapy-by-brand opportunity matrix and shift resources toward high-share, under-penetrated molecules.",
      confidence: context.health.confidence,
      dataUsed: "Therapy contribution and current metric"
    });
  }

  return insights;
}

export function supportedFrameworks(context: AnalyticsContext): Array<{ title: string; summary: string; action: string }> {
  if (!isStrategyReady(context.health)) return [];
  const brands = aggregateByBrand(context.rows, context.mapping, context.filters.metric);
  const leader = brands[0];
  const second = brands[1];
  const growth = leader?.growth ?? 0;
  const share = leader?.share ?? 0;

  return [
    {
      title: "SWOT",
      summary: `${leader?.name ?? "Selected brand"} has ${formatPercent(share)} share; ${second?.name ?? "nearest competitor"} is the next benchmark.`,
      action: share > 20 ? "Use strengths to defend priority accounts and convert weaknesses into price/pack actions." : "Use opportunities in underserved therapy/molecule pockets to build a focused growth wedge."
    },
    {
      title: "BCG Matrix",
      summary: growth > 0 && share > 15 ? "Current position reads as a growth leader." : growth > 0 ? "Current position reads as a growth challenger." : "Current position requires margin and mix discipline.",
      action: growth > 0 ? "Invest behind the fastest growing pockets with measurable share gain gates." : "Harvest low-growth pockets and redirect spend toward stronger therapy/molecule cells."
    },
    {
      title: "STP",
      summary: "Segmentation is supported by mapped brand, company, therapy, molecule, and market type fields.",
      action: "Target high-value therapy clusters first, then position around molecule differentiation and account conversion economics."
    },
    {
      title: "4Ps",
      summary: "Product, price proxy, place, and promotion can be inferred from brand, pack, value, units, and company data where mapped.",
      action: "Tune pack strategy and promotional intensity using price proxy, unit velocity, and competitor rank movement."
    }
  ];
}

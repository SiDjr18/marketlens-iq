import type { AggregateRow, AnalyticsContext, Insight } from "../utils/types";
import { cellText, formatCurrency, formatNumber, formatPercent } from "../utils/formatters";
import { aggregateByBrand, aggregateByCompany, aggregateByMolecule, aggregateByTherapy } from "../analytics/aggregateData";
import { calculatePriceVolumeMix, isExactImsDataset } from "../analytics/pharmaMetrics";
import { isStrategyReady } from "../mapping/validateMapping";

function confidence(context: AnalyticsContext) {
  const subsetPenalty = context.rows.length < 5 ? 20 : 0;
  return Math.max(30, Math.min(95, context.health.confidence - subsetPenalty));
}

function topByScore(rows: AggregateRow[]) {
  return [...rows].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0] ?? rows[0];
}

function rowDescriptor(context: AnalyticsContext, brandName: string) {
  const brandColumn = context.mapping.brand;
  const companyColumn = context.mapping.company;
  const moleculeColumn = context.mapping.molecule;
  const therapyColumn = context.mapping.therapy;
  const row = context.rows.find((item) => brandColumn && cellText(item[brandColumn]) === brandName);
  return {
    company: row && companyColumn ? cellText(row[companyColumn]) : "mapped company",
    molecule: row && moleculeColumn ? cellText(row[moleculeColumn]) : "mapped molecule",
    therapy: row && therapyColumn ? cellText(row[therapyColumn]) : "mapped therapy"
  };
}

function mixLabel(row: AggregateRow) {
  return calculatePriceVolumeMix({
    latestValue: row.mat,
    previousValue: row.previousValue,
    growthAbs: row.growthAbs ?? 0,
    growthPct: row.growth,
    latestUnits: row.units,
    previousUnits: 0,
    unitGrowthPct: row.unitGrowth ?? null,
    latestVolume: row.volume,
    previousVolume: 0,
    volumeGrowthPct: null,
    latestCp: 0,
    previousCp: 0,
    cpGrowthPct: row.cpGrowth ?? null,
    priceProxy: row.priceProxy,
    previousPriceProxy: 0,
    priceProxyGrowth: row.priceProxyGrowth ?? null,
    launchValue: 0,
    prMay25: null,
    latest3MonthAvg: row.latest3MonthAvg ?? null,
    previous3MonthAvg: row.previous3MonthAvg ?? null,
    momentum: row.momentum ?? null,
    seasonality: row.seasonality ?? null
  });
}

export function generateInsights(context: AnalyticsContext): Insight[] {
  if (!isStrategyReady(context.health)) return [];

  const brands = aggregateByBrand(context.rows, context.mapping, context.filters.metric, context.filters);
  const companies = aggregateByCompany(context.rows, context.mapping, context.filters.metric, context.filters);
  const therapies = aggregateByTherapy(context.rows, context.mapping, context.filters.metric, context.filters);
  const molecules = aggregateByMolecule(context.rows, context.mapping, context.filters.metric, context.filters);
  const leader = brands[0];
  const challenger = brands.find((row) => row.growth > 8 && row.share < (leader?.share ?? 0)) ?? brands[1];
  const whiteSpace = molecules.find((row) => row.classification === "White-space opportunity") ?? topByScore(molecules);
  const topCompany = companies[0];
  const topTherapy = topByScore(therapies);
  const insights: Insight[] = [];
  const dataUsed = `${context.rows.length.toLocaleString("en-IN")} filtered rows; ${isExactImsDataset(context.rows) ? "exact IMS MAT MAY'25/MAY'24, unit, CP, monthly trend columns" : "mapped sales and dimension columns"}`;

  if (leader) {
    const details = rowDescriptor(context, leader.name);
    insights.push({
      title: "Defend leadership",
      whatHappened: `${leader.name} from ${details.company} leads with ${formatCurrency(leader.value)}, ${formatPercent(leader.share)} share, ${formatPercent(leader.growth)} growth, and ${leader.classification ?? "mapped"} classification.`,
      whyItMatters: `${details.molecule} in ${details.therapy} is the benchmark pool; contribution to selected-market growth is ${formatPercent(leader.growthContribution ?? 0)}.`,
      recommendedAction: `Protect ${leader.name} in priority accounts, monitor ${mixLabel(leader).toLowerCase()}, and defend packs where price proxy is ${formatCurrency(leader.priceProxy)}.`,
      confidence: confidence(context),
      dataUsed
    });
  }

  if (challenger) {
    const details = rowDescriptor(context, challenger.name);
    insights.push({
      title: "Accelerate emerging challenger",
      whatHappened: `${challenger.name} shows ${formatPercent(challenger.growth)} growth, ${formatPercent(challenger.unitGrowth ?? 0)} unit growth, and ${formatPercent(challenger.momentum ?? 0)} monthly momentum.`,
      whyItMatters: `The brand is competing in ${details.molecule} under ${details.therapy}; its score is ${formatNumber(challenger.score ?? 0, 0)}/100.`,
      recommendedAction: `Invest selectively behind ${challenger.name} if the next review confirms real demand: CP growth ${formatPercent(challenger.cpGrowth ?? 0)} and units ${formatNumber(challenger.units)}.`,
      confidence: confidence(context),
      dataUsed
    });
  }

  if (whiteSpace) {
    insights.push({
      title: "Enter white-space molecule / subgroup",
      whatHappened: `${whiteSpace.name} is classified as ${whiteSpace.classification ?? "opportunity"} with ${formatCurrency(whiteSpace.value)}, ${formatPercent(whiteSpace.growth)} growth, and ${whiteSpace.companyCount ?? 0} competing companies.`,
      whyItMatters: `Lower competitive intensity with growth improves entry economics; white-space score is ${formatNumber(whiteSpace.score ?? 0, 0)}/100.`,
      recommendedAction: `Build a focused entry case around ${whiteSpace.name}: quantify pack gaps, compare Indian/MNC competition, and test launch traction before national scale-up.`,
      confidence: confidence(context),
      dataUsed
    });
  }

  if (topCompany && topTherapy) {
    insights.push({
      title: "Portfolio allocation signal",
      whatHappened: `${topCompany.name} leads company contribution while ${topTherapy.name} is the highest-scoring therapy pool at ${formatNumber(topTherapy.score ?? 0, 0)}/100.`,
      whyItMatters: "Budget allocation should follow size, growth quality, unit growth, CP growth, and competitive intensity together.",
      recommendedAction: `Allocate incremental effort to ${topTherapy.name} pockets where leader share is attackable and avoid broad spend in low-score molecules.`,
      confidence: confidence(context),
      dataUsed
    });
  }

  return insights;
}

export function supportedFrameworks(context: AnalyticsContext): Array<{ title: string; summary: string; action: string }> {
  if (!isStrategyReady(context.health)) return [];
  const brands = aggregateByBrand(context.rows, context.mapping, context.filters.metric, context.filters);
  const molecules = aggregateByMolecule(context.rows, context.mapping, context.filters.metric, context.filters);
  const leader = brands[0];
  const challenger = brands.find((row) => row.classification?.includes("challenger")) ?? brands[1];
  const whitespace = molecules.find((row) => row.classification === "White-space opportunity") ?? topByScore(molecules);

  return [
    {
      title: "BCG / Growth-Share",
      summary: `${leader?.name ?? "Top brand"} is ${leader?.classification ?? "classified from share and growth"} with ${formatPercent(leader?.share ?? 0)} share and ${formatPercent(leader?.growth ?? 0)} growth.`,
      action: (leader?.share ?? 0) >= 10 ? "Defend leadership while funding only score-backed growth cells." : "Prioritize challenger plays where growth quality is supported by units and CP growth."
    },
    {
      title: "Opportunity Matrix",
      summary: `${whitespace?.name ?? "Top molecule"} has opportunity score ${formatNumber(whitespace?.score ?? 0, 0)}/100 and ${whitespace?.companyCount ?? 0} competing companies.`,
      action: "Enter only if the molecule has high growth, acceptable crowding, and visible monthly momentum."
    },
    {
      title: "STP",
      summary: `${challenger?.name ?? "Selected challenger"} can be segmented by therapy, molecule, company type, and plain/combination status from mapped IMS columns.`,
      action: "Target high-score therapy and molecule clusters first, then position against the leader with pack and price-proxy proof."
    },
    {
      title: "4Ps / GTM",
      summary: "Product, price proxy, place, and promotion are supported by brand, pack, NFC, MAT value, units, price indicators, and monthly momentum.",
      action: "Tune pack/formulation priorities, sales call focus, and digital messaging using growth contribution and price-volume-mix labels."
    }
  ];
}

export const generateStrategyLabReport = generateInsights;

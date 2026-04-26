import type { DashboardTab, PharmaField } from "./types";

export const REQUIRED_FIELDS: PharmaField[] = [
  "brand",
  "company",
  "therapy",
  "molecule",
  "marketType",
  "companyType",
  "productType",
  "valueSales",
  "units",
  "volume",
  "mat",
  "month"
];

export const MINIMUM_FIELDS: PharmaField[] = ["brand", "company"];

export const FILTER_DEFAULTS = {
  marketType: [],
  companyType: [],
  productType: [],
  brand: [],
  therapy: [],
  molecule: [],
  company: [],
  timePeriod: [],
  metric: "valueSales" as PharmaField
};

export const NAV_TABS: Array<{ id: DashboardTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "market", label: "Market Landscape" },
  { id: "competitor", label: "Competitor Positioning" },
  { id: "brand", label: "Brand Deep Dive" },
  { id: "therapy", label: "Therapy" },
  { id: "molecule", label: "Molecule" },
  { id: "strategy", label: "Strategy Lab" },
  { id: "brandPlan", label: "Brand Plan" },
  { id: "exports", label: "Exports" }
];

export const FIELD_LABELS: Record<PharmaField, string> = {
  brand: "Brand",
  company: "Company",
  therapy: "Therapy",
  molecule: "Molecule",
  marketType: "Acute / Chronic",
  companyType: "Indian / MNC",
  productType: "Plain / Combination",
  valueSales: "Value Sales",
  units: "Units",
  volume: "Volume",
  mat: "MAT",
  month: "Month",
  pack: "Pack"
};

export const METRIC_OPTIONS: Array<{ label: string; value: PharmaField }> = [
  { label: "Value Sales", value: "valueSales" },
  { label: "MAT Sales", value: "mat" },
  { label: "Units", value: "units" },
  { label: "Volume", value: "volume" }
];

export const STATIC_FILTER_OPTIONS = {
  marketType: ["Acute", "Chronic"],
  companyType: ["Indian", "MNC"],
  productType: ["Plain", "Combination"]
};

export const HEALTH_THRESHOLD = 62;

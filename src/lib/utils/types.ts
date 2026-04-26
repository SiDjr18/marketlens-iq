export type RawRow = Record<string, string | number | boolean | null | undefined>;

export type PharmaField =
  | "brand"
  | "company"
  | "therapy"
  | "molecule"
  | "marketType"
  | "companyType"
  | "productType"
  | "valueSales"
  | "units"
  | "volume"
  | "mat"
  | "month"
  | "pack";

export type FieldMapping = Partial<Record<PharmaField, string>>;

export type MappingConfidence = Partial<Record<PharmaField, number>>;

export type UploadMeta = {
  fileName: string;
  fileType: string;
  sheetName: string;
  sheetNames: string[];
  rowsDetected: number;
  columnsDetected: number;
  rowsProcessed: number;
  skippedRows: number;
  errors: string[];
};

export type ParsedDataset = {
  tables: Record<string, RawRow[]>;
  sheetNames: string[];
  activeSheet: string;
  meta: UploadMeta;
};

export type DataHealth = {
  rowsLoaded: number;
  columnsDetected: number;
  mappedRequired: number;
  missingFields: PharmaField[];
  numericParsingSuccess: number;
  duplicateRows: number;
  dateDetected: boolean;
  confidence: number;
  status: "no-data" | "mapping-required" | "ready";
};

export type FilterState = {
  marketType: string[];
  companyType: string[];
  productType: string[];
  brand: string[];
  therapy: string[];
  molecule: string[];
  company: string[];
  timePeriod: string[];
  metric: PharmaField;
};

export type DashboardTab =
  | "overview"
  | "market"
  | "competitor"
  | "brand"
  | "therapy"
  | "molecule"
  | "strategy"
  | "brandPlan"
  | "exports";

export type AggregateRow = {
  name: string;
  value: number;
  units: number;
  volume: number;
  mat: number;
  previousValue: number;
  growth: number;
  share: number;
  rank: number;
  priceProxy: number;
  rowCount: number;
};

export type KpiSet = {
  totalMarket: number;
  growth: number;
  units: number;
  volume: number;
  topBrand: string;
  topCompany: string;
  topTherapy: string;
  topMolecule: string;
};

export type Insight = {
  title: string;
  whatHappened: string;
  whyItMatters: string;
  recommendedAction: string;
  confidence: number;
  dataUsed: string;
};

export type ParsedTable = {
  name: string;
  rows: RawRow[];
  columns: string[];
};

export type ParseProgress = {
  phase: "idle" | "reading" | "parsing" | "mapping" | "ready" | "error";
  percent: number;
  rowsProcessed: number;
  message: string;
};

export type AnalyticsContext = {
  rows: RawRow[];
  mapping: FieldMapping;
  health: DataHealth;
  filters: FilterState;
};

export type BrandPlanInput = {
  brand: string;
  therapy: string;
  competitors: string[];
  horizon: "90 days" | "180 days" | "1 year";
  objective: "Grow share" | "Defend leadership" | "Launch" | "Revive" | "Enter new therapy";
};

export type BrandPlanSection = {
  title: string;
  points: string[];
};

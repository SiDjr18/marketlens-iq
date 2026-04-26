import type { PharmaField } from "../utils/types";

export const mappingAliases: Record<PharmaField, string[]> = {
  brand: ["brand", "product", "sku", "productname", "brandname", "item", "drugname"],
  company: ["company", "corporation", "manufacturer", "mfr", "firm", "marketedby", "division"],
  therapy: ["therapy", "therapeutic", "therapyarea", "class", "segment", "supergroup", "therapeuticarea"],
  molecule: ["molecule", "composition", "ingredient", "salt", "generic", "moleculename", "activeingredient"],
  marketType: ["acutechronic", "markettype", "acute", "chronic", "therapytype"],
  companyType: ["companytype", "origin", "indianmnc", "mncindian", "ownership", "corporatetype"],
  productType: ["producttype", "plaincombination", "plainfdc", "fdc", "combination", "mono"],
  valueSales: ["valuesales", "salesvalue", "value", "revenue", "sales", "val", "rs", "inr", "matvalue"],
  units: ["units", "unit", "unitpacks", "packs", "quantity", "qty", "unitssold"],
  volume: ["volume", "vol", "volumesales", "standardunits", "su", "kg", "litre", "liters"],
  mat: ["mat", "matsales", "matvalue", "matmay25", "movingannualtotal", "annualsales"],
  month: ["month", "period", "date", "salesmonth", "timeperiod", "calendar", "yearmonth"],
  pack: ["pack", "packsize", "strength", "form", "dosage", "variant"]
};

export const categoricalFields: PharmaField[] = [
  "brand",
  "company",
  "therapy",
  "molecule",
  "marketType",
  "companyType",
  "productType",
  "pack",
  "month"
];

export const numericFields: PharmaField[] = ["valueSales", "units", "volume", "mat"];

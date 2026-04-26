import type { PharmaField } from "../utils/types";

export const mappingAliases: Record<PharmaField, string[]> = {
  brand: ["marketlensbrand", "brand", "brands", "product", "sku", "productname", "brandname", "item", "drugname"],
  company: ["marketlenscompany", "company", "corporation", "manufacturer", "manufactdesc", "manufact", "mfr", "firm", "marketedby", "division"],
  therapy: ["marketlenstherapy", "therapy", "therapeutic", "therapyarea", "supergroup", "class", "segment", "therapeuticarea", "group", "subgroup"],
  molecule: ["marketlensmolecule", "moleculedesc", "molecule", "composition", "ingredient", "salt", "generic", "moleculename", "activeingredient", "nfc"],
  marketType: ["acutechronic", "acute_chronic", "markettype", "acute", "chronic", "therapytype"],
  companyType: ["companytype", "origin", "indianmnc", "indian_mnc", "mncindian", "ownership", "corporatetype"],
  productType: ["producttype", "plaincombination", "plainfdc", "fdc", "combination", "mono", "plain"],
  valueSales: ["marketlensvaluesales", "valuesales", "salesvalue", "value", "revenue", "sales", "val", "rs", "inr", "matvalue", "amount"],
  units: ["marketlensunits", "units", "unit", "unitpacks", "packs", "quantity", "qty", "unitssold"],
  volume: ["marketlensvolume", "volume", "vol", "volumesales", "standardunits", "su", "kg", "litre", "liters"],
  mat: ["marketlensmatsales", "mat", "matsales", "matvalue", "matmay25", "movingannualtotal", "annualsales"],
  month: ["marketlensmonth", "month", "period", "date", "salesmonth", "timeperiod", "calendar", "yearmonth"],
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

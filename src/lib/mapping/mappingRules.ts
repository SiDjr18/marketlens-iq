import type { PharmaField } from "../utils/types";

export const mappingAliases: Record<PharmaField, string[]> = {
  brand: ["BRANDS", "marketlensbrand", "brand", "brands", "product", "sku", "productname", "brandname", "item", "drugname"],
  company: ["COMPANY", "MANUFACT. DESC", "MANUFAC CODE", "marketlenscompany", "company", "corporation", "manufacturer", "manufactdesc", "manufact", "mfr", "firm", "marketedby", "division"],
  therapy: ["SUPERGROUP", "GROUP", "SUBGROUP", "marketlenstherapy", "therapy", "therapeutic", "therapyarea", "class", "segment", "therapeuticarea"],
  molecule: ["MOLECULE_DESC", "NFC_DESC", "NFC", "marketlensmolecule", "moleculedesc", "molecule", "composition", "ingredient", "salt", "generic", "moleculename", "activeingredient"],
  marketType: ["ACUTE_CHRONIC", "acutechronic", "acute_chronic", "markettype", "acute", "chronic", "therapytype"],
  companyType: ["INDIAN_MNC", "companytype", "origin", "indianmnc", "indian_mnc", "mncindian", "ownership", "corporatetype"],
  productType: ["Plain/Combination", "producttype", "plaincombination", "plainfdc", "fdc", "combination", "mono", "plain"],
  valueSales: ["MAT MAY'25", "marketlensvaluesales", "valuesales", "salesvalue", "value", "revenue", "sales", "val", "rs", "inr", "matvalue", "amount"],
  units: ["UNIT MAT MAY'25", "marketlensunits", "units", "unit", "unitpacks", "packs", "quantity", "qty", "unitssold"],
  volume: ["QTY MAT MAY'25", "marketlensvolume", "volume", "vol", "volumesales", "standardunits", "su", "kg", "litre", "liters"],
  mat: ["MAT MAY'25", "marketlensmatsales", "mat", "matsales", "matvalue", "matmay25", "movingannualtotal", "annualsales"],
  month: ["marketlensmonth", "month", "period", "date", "salesmonth", "timeperiod", "calendar", "yearmonth"],
  pack: ["PACK_DESC", "pack", "packsize", "strength", "form", "dosage", "variant"]
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

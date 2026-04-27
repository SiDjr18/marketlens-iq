import { normalizeKey } from "../utils/formatters";
import type { PharmaField } from "../utils/types";

export const IMS_DIMENSIONS = {
  pfc: "PFC",
  productCode: "PROD_CODE",
  brand: "BRANDS",
  pack: "PACK_DESC",
  productType: "Plain/Combination",
  indication: "Ind",
  molecule: "MOLECULE_DESC",
  nfc: "NFC",
  nfcDescription: "NFC_DESC",
  manufacturerCode: "MANUFAC CODE",
  manufacturer: "MANUFACT. DESC",
  company: "COMPANY",
  companyType: "INDIAN_MNC",
  subgroup: "SUBGROUP",
  group: "GROUP",
  supergroup: "SUPERGROUP",
  marketType: "ACUTE_CHRONIC",
  packLaunch: "PACK_LNCH",
  productLaunch: "PROD_LNCH",
  index: "INDEX"
} as const;

export const IMS_VALUE = {
  latestMat: "MAT MAY'25",
  previousMat: "MAT MAY'24",
  matHistory: ["MAT MAY'22", "MAT MAY'23", "MAT MAY'24", "MAT MAY'25"],
  monthHistory: ["MONTH MAY'22", "MONTH MAY'23", "MONTH MAY'24", "MONTH MAY'25"],
  cumulativeHistory: ["CUMM MAY'22", "CUMM MAY'23", "CUMM MAY'24", "CUMM MAY'25"]
} as const;

export const IMS_CP_VALUE = {
  latestMat: "MAT CP MAY'25",
  previousMat: "MAT CP MAY'24",
  matHistory: ["MAT CP MAY'22", "MAT CP MAY'23", "MAT CP MAY'24", "MAT CP MAY'25"],
  monthHistory: ["MONTH CP MAY'22", "MONTH CP MAY'23", "MONTH CP MAY'24", "MONTH CP MAY'25"],
  cumulativeHistory: ["CUMM CP MAY'22", "CUMM CP MAY'23", "CUMM CP MAY'24", "CUMM CP MAY'25"]
} as const;

export const IMS_UNITS = {
  latestMat: "UNIT MAT MAY'25",
  previousMat: "UNIT MAT MAY'24",
  matHistory: ["UNIT MAT MAY'22", "UNIT MAT MAY'23", "UNIT MAT MAY'24", "UNIT MAT MAY'25"],
  monthHistory: ["UNIT MONTH MAY'22", "UNIT MONTH MAY'23", "UNIT MONTH MAY'24", "UNIT MONTH MAY'25"],
  cumulativeHistory: ["UNIT CUMM MAY'22", "UNIT CUMM MAY'23", "UNIT CUMM MAY'24", "UNIT CUMM MAY'25"]
} as const;

export const IMS_QTY = {
  latestMat: "QTY MAT MAY'25",
  previousMat: "QTY MAT MAY'24",
  matHistory: ["QTY MAT MAY'22", "QTY MAT MAY'23", "QTY MAT MAY'24", "QTY MAT MAY'25"],
  monthHistory: ["QTY MONTH MAY'22", "QTY MONTH MAY'23", "QTY MONTH MAY'24", "QTY MONTH MAY'25"],
  cumulativeHistory: ["QTY CUMM MAY'22", "QTY CUMM MAY'23", "QTY CUMM MAY'24", "QTY CUMM MAY'25"]
} as const;

export const IMS_PRICE = ["PR_DEC'24", "PR_JAN'25", "PR_FEB'25", "PR_MAR'25", "PR_APR'25", "PR_MAY'25"] as const;

export const IMS_NI = {
  latestMat: "NI 24 MONTHS MAT MAY'25",
  matHistory: ["NI 24 MONTHS MAT MAY'22", "NI 24 MONTHS MAT MAY'23", "NI 24 MONTHS MAT MAY'24", "NI 24 MONTHS MAT MAY'25"],
  cpMatHistory: ["NI 24 MONTHS MAT CP MAY'22", "NI 24 MONTHS MAT CP MAY'23", "NI 24 MONTHS MAT CP MAY'24", "NI 24 MONTHS MAT CP MAY'25"]
} as const;

export const IMS_MONTHLY_VALUE_COLUMNS = [
  "JUN'21",
  "JUL'21",
  "AUG'21",
  "SEP'21",
  "OCT'21",
  "NOV'21",
  "DEC'21",
  "JAN'22",
  "FEB'22",
  "MAR'22",
  "APR'22",
  "MAY'22",
  "JUN'22",
  "JUL'22",
  "AUG'22",
  "SEP'22",
  "OCT'22",
  "NOV'22",
  "DEC'22",
  "JAN'23",
  "FEB'23",
  "MAR'23",
  "APR'23",
  "MAY'23",
  "JUN'23",
  "JUL'23",
  "AUG'23",
  "SEP'23",
  "OCT'23",
  "NOV'23",
  "DEC'23",
  "JAN'24",
  "FEB'24",
  "MAR'24",
  "APR'24",
  "MAY'24",
  "JUN'24",
  "JUL'24",
  "AUG'24",
  "SEP'24",
  "OCT'24",
  "NOV'24",
  "DEC'24",
  "JAN'25",
  "FEB'25",
  "MAR'25",
  "APR'25",
  "MAY'25"
] as const;

export const IMS_MONTHLY_UNIT_COLUMNS = IMS_MONTHLY_VALUE_COLUMNS.map((column) => `UNIT ${column}`);
export const IMS_MONTHLY_CP_COLUMNS = IMS_MONTHLY_VALUE_COLUMNS.map((column) => `CP ${column}`);

export const IMS_FIELD_MAP: Partial<Record<PharmaField, string>> = {
  brand: IMS_DIMENSIONS.brand,
  company: IMS_DIMENSIONS.company,
  therapy: IMS_DIMENSIONS.supergroup,
  molecule: IMS_DIMENSIONS.molecule,
  marketType: IMS_DIMENSIONS.marketType,
  companyType: IMS_DIMENSIONS.companyType,
  productType: IMS_DIMENSIONS.productType,
  valueSales: IMS_VALUE.latestMat,
  mat: IMS_VALUE.latestMat,
  units: IMS_UNITS.latestMat,
  volume: IMS_QTY.latestMat,
  pack: IMS_DIMENSIONS.pack
};

export function findExactColumn(columns: string[], wanted: string): string | undefined {
  const wantedKey = normalizeKey(wanted);
  return columns.find((column) => normalizeKey(column) === wantedKey);
}

export function hasImsSchema(columns: string[]): boolean {
  const mustHave = [IMS_DIMENSIONS.brand, IMS_DIMENSIONS.company, IMS_DIMENSIONS.supergroup, IMS_VALUE.latestMat, IMS_VALUE.previousMat];
  return mustHave.every((column) => Boolean(findExactColumn(columns, column)));
}

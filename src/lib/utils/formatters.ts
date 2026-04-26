export function normalizeKey(value: unknown): string {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const negative = /^\(.*\)$/.test(raw);
  const cleaned = raw.replace(/[^0-9eE+\-.%()]/g, "").replace(/[()]/g, "");
  if (!/^-?(?:\d+\.?\d*|\d*\.\d+)(?:e[+-]?\d+)?%?$/i.test(cleaned)) return null;
  const parsed = Number(cleaned.replace("%", ""));
  if (!Number.isFinite(parsed)) return null;
  return negative ? -parsed : parsed;
}

export function formatNumber(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "0";
  if (Math.abs(value) >= 10_000_000) return `${(value / 10_000_000).toFixed(digits)}Cr`;
  if (Math.abs(value) >= 100_000) return `${(value / 100_000).toFixed(digits)}L`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(digits)}K`;
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits }).format(value);
}

export function formatCurrency(value: number): string {
  return `Rs ${formatNumber(value)}`;
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export function cellText(value: unknown): string {
  return String(value ?? "").trim();
}

export function safeFileName(value: string): string {
  return value.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "marketlens";
}

export function parsePeriod(value: unknown): string {
  const text = cellText(value);
  if (!text) return "";
  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  const normalized = text
    .replace(/['"]/g, "")
    .replace(/\bmat\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const match = normalized.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s-]*(\d{2,4})\b/i);
  if (match) {
    const short = match[1].slice(0, 3).toLowerCase();
    const monthIndex = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(short);
    const yearRaw = match[2];
    const year = yearRaw.length === 2 ? 2000 + Number(yearRaw) : Number(yearRaw);
    return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  }
  return normalized;
}

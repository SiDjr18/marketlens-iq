/// <reference lib="webworker" />
import Papa from "papaparse";
import type { RawRow } from "../utils/types";

type ZipEntry = {
  name: string;
  method: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
};

type WorkerRequest = {
  file: File;
  delimiter?: string;
  kind: "csv" | "xlsx";
};

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { file, delimiter, kind } = event.data;
  if (kind === "xlsx") {
    void parseXlsx(file);
    return;
  }
  parseDelimited(file, delimiter);
};

function parseDelimited(file: File, delimiter?: string) {
  const rows: RawRow[] = [];
  const errors: string[] = [];

  Papa.parse<RawRow>(file, {
    header: true,
    delimiter,
    skipEmptyLines: "greedy",
    dynamicTyping: false,
    transformHeader: (header) => header.trim(),
    chunk: (result) => {
      result.data.forEach((row) => {
        if (Object.values(row).some((value) => String(value ?? "").trim())) rows.push(row);
      });
      self.postMessage({ type: "progress", rowsProcessed: rows.length, message: `${rows.length.toLocaleString("en-IN")} rows processed` });
    },
    complete: (result) => {
      result.errors.forEach((error) => errors.push(`${error.message} at row ${error.row ?? "unknown"}`));
      self.postMessage({ type: "complete", rows, errors });
    },
    error: (error) => {
      self.postMessage({ type: "error", error: error.message });
    }
  });
}

async function parseXlsx(file: File) {
  try {
    if (!("DecompressionStream" in self)) {
      throw new Error("This browser does not support streaming XLSX parsing. Export the workbook as CSV or use Chrome/Edge.");
    }
    self.postMessage({ type: "progress", rowsProcessed: 0, message: "Reading Excel workbook directory" });
    const entries = await readZipDirectory(file);
    const workbookEntry = entries.get("xl/workbook.xml");
    const relsEntry = entries.get("xl/_rels/workbook.xml.rels");
    if (!workbookEntry || !relsEntry) throw new Error("Workbook metadata is missing.");

    const workbookXml = await readZipEntryText(file, workbookEntry);
    const relsXml = await readZipEntryText(file, relsEntry);
    const relMap = parseWorkbookRelationships(relsXml);
    const sheets = parseWorkbookSheets(workbookXml)
      .map((sheet, index) => ({
        name: sheet.name || `Sheet ${index + 1}`,
        path: normalizeZipPath("xl", relMap.get(sheet.rid) || `worksheets/sheet${index + 1}.xml`)
      }))
      .filter((sheet) => entries.has(sheet.path));
    if (!sheets.length) throw new Error("No readable worksheets found.");

    self.postMessage({ type: "progress", rowsProcessed: 0, message: "Loading shared strings" });
    const sharedEntry = entries.get("xl/sharedStrings.xml");
    const sharedStrings = sharedEntry ? parseSharedStrings(await readZipEntryText(file, sharedEntry)) : [];
    const tables: Record<string, RawRow[]> = {};
    let totalRows = 0;

    for (const sheet of sheets.slice(0, 5)) {
      self.postMessage({ type: "progress", rowsProcessed: totalRows, message: `Streaming ${sheet.name}` });
      const tableRows = await readSheetRowsStreaming(file, entries.get(sheet.path) as ZipEntry, sharedStrings, (count) => {
        if (count % 1000 === 0) self.postMessage({ type: "progress", rowsProcessed: totalRows + count, message: `Streaming ${sheet.name}` });
      });
      const objects = withImsReferenceFields(tableToObjects(tableRows));
      tables[sheet.name] = objects;
      totalRows += objects.length;
    }

    self.postMessage({ type: "complete-xlsx", tables, sheetNames: Object.keys(tables), errors: [] });
  } catch (error) {
    self.postMessage({ type: "error", error: error instanceof Error ? error.message : "Unable to stream XLSX workbook." });
  }
}

async function readZipDirectory(file: File): Promise<Map<string, ZipEntry>> {
  const tailSize = Math.min(file.size, 1024 * 1024);
  const tail = new Uint8Array(await file.slice(file.size - tailSize).arrayBuffer());
  let eocd = -1;
  for (let index = tail.length - 22; index >= 0; index -= 1) {
    if (tail[index] === 0x50 && tail[index + 1] === 0x4b && tail[index + 2] === 0x05 && tail[index + 3] === 0x06) {
      eocd = index;
      break;
    }
  }
  if (eocd < 0) throw new Error("Excel zip directory was not found.");
  const view = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
  const cdSize = view.getUint32(eocd + 12, true);
  const cdOffset = view.getUint32(eocd + 16, true);
  const dir = new Uint8Array(await file.slice(cdOffset, cdOffset + cdSize).arrayBuffer());
  const dirView = new DataView(dir.buffer, dir.byteOffset, dir.byteLength);
  const entries = new Map<string, ZipEntry>();
  let offset = 0;
  while (offset + 46 <= dir.length && dirView.getUint32(offset, true) === 0x02014b50) {
    const method = dirView.getUint16(offset + 10, true);
    const compressedSize = dirView.getUint32(offset + 20, true);
    const uncompressedSize = dirView.getUint32(offset + 24, true);
    const nameLength = dirView.getUint16(offset + 28, true);
    const extraLength = dirView.getUint16(offset + 30, true);
    const commentLength = dirView.getUint16(offset + 32, true);
    const localHeaderOffset = dirView.getUint32(offset + 42, true);
    const name = decodeBytes(dir.slice(offset + 46, offset + 46 + nameLength)).replace(/\\/g, "/");
    entries.set(name, { name, method, compressedSize, uncompressedSize, localHeaderOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

async function readZipEntryText(file: File, entry: ZipEntry): Promise<string> {
  const stream = await zipEntryStream(file, entry);
  const reader = decodeStream(stream).getReader();
  let text = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    text += value;
  }
  return text;
}

async function readSheetRowsStreaming(file: File, entry: ZipEntry, sharedStrings: string[], onRows: (count: number) => void): Promise<unknown[][]> {
  const rows: unknown[][] = [];
  const stream = await zipEntryStream(file, entry);
  const reader = decodeStream(stream).getReader();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let rowEnd = buffer.indexOf("</row>");
    while (rowEnd >= 0) {
      const rowStart = buffer.lastIndexOf("<row", rowEnd);
      if (rowStart < 0) {
        buffer = buffer.slice(rowEnd + 6);
        rowEnd = buffer.indexOf("</row>");
        continue;
      }
      const parsed = parseSheetRow(buffer.slice(rowStart, rowEnd + 6), sharedStrings);
      if (parsed.some((cell) => !isBlank(cell))) rows.push(parsed);
      if (rows.length % 1000 === 0) onRows(rows.length);
      buffer = buffer.slice(rowEnd + 6);
      rowEnd = buffer.indexOf("</row>");
    }
    if (buffer.length > 25_000_000) {
      const lastRowStart = buffer.lastIndexOf("<row");
      buffer = lastRowStart > 0 ? buffer.slice(lastRowStart) : buffer.slice(-1_000_000);
    }
  }
  return rows;
}

function decodeStream(stream: ReadableStream<Uint8Array>): ReadableStream<string> {
  return stream.pipeThrough(new TextDecoderStream() as unknown as TransformStream<Uint8Array, string>);
}

async function zipEntryStream(file: File, entry: ZipEntry): Promise<ReadableStream<Uint8Array>> {
  const header = new Uint8Array(await file.slice(entry.localHeaderOffset, entry.localHeaderOffset + 30).arrayBuffer());
  const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
  if (view.getUint32(0, true) !== 0x04034b50) throw new Error(`Invalid zip entry: ${entry.name}`);
  const nameLength = view.getUint16(26, true);
  const extraLength = view.getUint16(28, true);
  const dataStart = entry.localHeaderOffset + 30 + nameLength + extraLength;
  const compressed = file.slice(dataStart, dataStart + entry.compressedSize).stream();
  if (entry.method === 0) return compressed;
  if (entry.method === 8) return compressed.pipeThrough(new DecompressionStream("deflate-raw"));
  throw new Error(`Unsupported Excel compression method ${entry.method}.`);
}

function parseSheetRow(rowXml: string, sharedStrings: string[]): unknown[] {
  const cells = new Map<number, unknown>();
  const cellPattern = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
  let match: RegExpExecArray | null;
  while ((match = cellPattern.exec(rowXml))) {
    const attrs = match[1];
    const body = match[2];
    const ref = getXmlAttr(attrs, "r") || "";
    const type = getXmlAttr(attrs, "t") || "";
    const index = columnIndexFromRef(ref);
    let value = "";
    if (type === "inlineStr") value = decodeXmlText((body.match(/<t[^>]*>([\s\S]*?)<\/t>/) || [])[1] || "");
    else {
      value = decodeXmlText((body.match(/<v[^>]*>([\s\S]*?)<\/v>/) || [])[1] || "");
      if (type === "s") value = sharedStrings[Number(value)] || "";
    }
    cells.set(index, coerceCell(value));
  }
  const max = cells.size ? Math.max(...cells.keys()) : -1;
  const row: unknown[] = [];
  for (let index = 0; index <= max; index += 1) row.push(cells.has(index) ? cells.get(index) : "");
  return row;
}

function tableToObjects(table: unknown[][]): RawRow[] {
  const nonEmptyRows = table.filter((row) => row.some((cell) => !isBlank(cell)));
  if (!nonEmptyRows.length) return [];
  let headerIndex = 0;
  let bestScore = -Infinity;
  nonEmptyRows.slice(0, 30).forEach((row, index) => {
    const cells = row.map((cell) => String(cell ?? "").trim()).filter(Boolean);
    const knownPharmaHeaders = cells.filter((cell) => /^(pfc|ind|pack[_\s.-]*desc|brands?|manufact|indian[_\s.-]*mnc|group|acute[_\s.-]*chronic|nfc|plain)$/i.test(cell)).length;
    const unique = new Set(cells.map(normalize)).size;
    const numericCells = cells.filter((cell) => parseNumber(cell) !== null).length;
    const score = knownPharmaHeaders * 12 + Math.min(cells.length, 80) * 2 + unique - numericCells * 0.9 - index * 0.1;
    if (cells.length >= 2 && score > bestScore) {
      bestScore = score;
      headerIndex = index;
    }
  });
  const headers = uniquifyHeaders(nonEmptyRows[headerIndex].map((cell, index) => String(cell ?? "").trim() || `Column ${index + 1}`));
  return nonEmptyRows.slice(headerIndex + 1).map((row) => {
    const record: RawRow = {};
    headers.forEach((header, index) => {
      record[header] = coerceCell(row[index]);
    });
    return record;
  });
}

function withImsReferenceFields(rows: RawRow[]): RawRow[] {
  if (!rows.length) return rows;
  const headers = Object.keys(rows[0]);
  const normalizedHeaders = new Map(headers.map((header) => [normalize(header), header]));
  const hasImsCore =
    normalizedHeaders.has("brands") &&
    (normalizedHeaders.has("company") || normalizedHeaders.has("manufactdesc")) &&
    (normalizedHeaders.has("supergroup") || normalizedHeaders.has("group")) &&
    normalizedHeaders.has("acutechronic");
  if (!hasImsCore) return rows;

  const latestYear = latestYearFromHeaders(headers) ?? "25";
  const latestMonth = latestMonthFromHeaders(headers, latestYear) ?? "MAY";
  const valueMat = findHeader(headers, [`MAT ${latestMonth}'${latestYear}`], ["unit", "qty", "cp", "ni24months"]);
  const valueMonth = findHeader(headers, [`MONTH ${latestMonth}'${latestYear}`], ["unit", "qty", "cp", "ni24months"]);
  const unitMat = findHeader(headers, [`UNIT MAT ${latestMonth}'${latestYear}`]);
  const volumeMat = findHeader(headers, [`QTY MAT ${latestMonth}'${latestYear}`]);

  const brand = normalizedHeaders.get("brands");
  const company = normalizedHeaders.get("company") || normalizedHeaders.get("manufactdesc");
  const therapy = normalizedHeaders.get("supergroup") || normalizedHeaders.get("group") || normalizedHeaders.get("subgroup");
  const molecule = normalizedHeaders.get("moleculedesc") || normalizedHeaders.get("nfcdesc") || normalizedHeaders.get("nfc");
  const marketType = normalizedHeaders.get("acutechronic");
  const companyType = normalizedHeaders.get("indianmnc");
  const productType = normalizedHeaders.get("plaincombination") || normalizedHeaders.get("plain");
  const pack = normalizedHeaders.get("packdesc");
  const period = `${latestMonth.slice(0, 1)}${latestMonth.slice(1).toLowerCase()}'${latestYear}`;

  return rows.map((row) => ({
    ...row,
    "MarketLens Brand": brand ? row[brand] : "",
    "MarketLens Company": company ? row[company] : "",
    "MarketLens Therapy": therapy ? row[therapy] : "",
    "MarketLens Molecule": molecule ? row[molecule] : "",
    "MarketLens Market Type": marketType ? row[marketType] : "",
    "MarketLens Company Type": companyType ? row[companyType] : "",
    "MarketLens Product Type": productType ? row[productType] : "",
    "MarketLens Value Sales": valueMat ? row[valueMat] : valueMonth ? row[valueMonth] : "",
    "MarketLens Monthly Sales": valueMonth ? row[valueMonth] : "",
    "MarketLens MAT Sales": valueMat ? row[valueMat] : "",
    "MarketLens Units": unitMat ? row[unitMat] : "",
    "MarketLens Volume": volumeMat ? row[volumeMat] : "",
    "MarketLens Month": period,
    "MarketLens Pack": pack ? row[pack] : ""
  }));
}

function latestYearFromHeaders(headers: string[]): string | null {
  const years = headers
    .map((header) => header.match(/'(2\d)\b/))
    .filter(Boolean)
    .map((match) => Number(match?.[1]));
  return years.length ? String(Math.max(...years)).padStart(2, "0") : null;
}

function latestMonthFromHeaders(headers: string[], year: string): string | null {
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const matching = headers
    .map((header) => header.toUpperCase().match(new RegExp(`\\b(${months.join("|")})'${year}\\b`))?.[1])
    .filter(Boolean) as string[];
  if (!matching.length) return null;
  return matching.sort((a, b) => months.indexOf(a) - months.indexOf(b))[matching.length - 1];
}

function findHeader(headers: string[], exactPatterns: string[], exclude: string[] = []): string | undefined {
  return headers.find((header) => {
    const key = normalize(header);
    if (exclude.some((item) => key.includes(normalize(item)))) return false;
    return exactPatterns.some((pattern) => key === normalize(pattern));
  });
}

function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  const pattern = /<si\b[\s\S]*?<\/si>/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(xml))) {
    const parts: string[] = [];
    const textPattern = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let textMatch: RegExpExecArray | null;
    while ((textMatch = textPattern.exec(match[0]))) parts.push(decodeXmlText(textMatch[1]));
    strings.push(parts.join(""));
  }
  return strings;
}

function coerceCell(value: unknown): string | number {
  const trimmed = String(value ?? "").trim();
  const numeric = parseNumber(trimmed);
  if (numeric !== null && /^[$₹€£]?\s*-?[\d,.]+(?:e[+-]?\d+)?%?$/i.test(trimmed)) return numeric;
  return trimmed;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value ?? "").trim();
  if (!text) return null;
  const negative = /^\(.*\)$/.test(text);
  const cleaned = text.replace(/[^0-9eE+\-.%()]/g, "").replace(/[()]/g, "");
  if (!/^-?(?:\d+\.?\d*|\d*\.\d+)(?:e[+-]?\d+)?%?$/i.test(cleaned)) return null;
  const number = Number(cleaned.replace("%", ""));
  if (!Number.isFinite(number)) return null;
  return negative ? -number : number;
}

function uniquifyHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((header) => {
    const base = header || "Column";
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count ? `${base} ${count + 1}` : base;
  });
}

function getXmlAttr(attrs: string, name: string): string {
  const match = attrs.match(new RegExp(`\\b${name}="([^"]*)"`, "i"));
  return match ? decodeXmlText(match[1]) : "";
}

function parseWorkbookRelationships(xml: string): Map<string, string> {
  const rels = new Map<string, string>();
  const relationshipPattern = /<Relationship\b([^>]*)\/?>/gi;
  let match: RegExpExecArray | null;
  while ((match = relationshipPattern.exec(xml))) {
    const id = getXmlAttr(match[1], "Id");
    const target = getXmlAttr(match[1], "Target");
    if (id && target) rels.set(id, target);
  }
  return rels;
}

function parseWorkbookSheets(xml: string): Array<{ name: string; rid: string }> {
  const sheets: Array<{ name: string; rid: string }> = [];
  const sheetPattern = /<sheet\b([^>]*)\/?>/gi;
  let match: RegExpExecArray | null;
  while ((match = sheetPattern.exec(xml))) {
    const attrs = match[1];
    const name = getXmlAttr(attrs, "name");
    const rid = getXmlAttr(attrs, "r:id") || getXmlAttr(attrs, "id");
    if (name || rid) sheets.push({ name, rid });
  }
  return sheets;
}

function decodeXmlText(value: string): string {
  return String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function decodeBytes(bytes: Uint8Array): string {
  return new TextDecoder("utf-8").decode(bytes);
}

function normalizeZipPath(base: string, target: string | null): string {
  if (!target) return "";
  if (target.startsWith("/")) return target.slice(1);
  const out: string[] = [];
  `${base}/${target}`.split("/").forEach((part) => {
    if (!part || part === ".") return;
    if (part === "..") out.pop();
    else out.push(part);
  });
  return out.join("/");
}

function columnIndexFromRef(ref: string): number {
  const letters = String(ref || "").replace(/[^A-Z]/gi, "").toUpperCase();
  let index = 0;
  for (const letter of letters) index = index * 26 + letter.charCodeAt(0) - 64;
  return Math.max(0, index - 1);
}

function normalize(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isBlank(value: unknown): boolean {
  return String(value ?? "").trim() === "";
}

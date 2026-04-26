/* MarketLens IQ ingestion worker: full-file parsing for CSV/TSV/JSON/SQL and streaming XLSX. */
self.onmessage = async (event) => {
  const file = event.data.file;
  try {
    const ext = file.name.split(".").pop().toLowerCase();
    progress("Reading file metadata", 2);
    let payload;
    if (ext === "csv" || ext === "tsv") payload = await ingestDelimited(file, ext === "tsv" ? "\t" : null);
    else if (ext === "json") payload = await ingestJson(file);
    else if (ext === "sql") payload = await ingestSql(file);
    else if (ext === "xlsx") payload = await ingestXlsx(file);
    else throw new Error("Unsupported worker file type.");
    progress("Finalizing full dataset", 100, payload.meta);
    self.postMessage({ type: "done", payload });
  } catch (error) {
    self.postMessage({ type: "error", error: error.message || String(error) });
  }
};

function progress(status, percent, meta = {}) {
  self.postMessage({ type: "progress", status, percent, ...meta });
}

async function ingestDelimited(file, delimiter) {
  const text = await file.text();
  const delim = delimiter || detectDelimiter(text);
  const rows = parseDelimited(text, delim, (count) => {
    if (count % 5000 === 0) progress("Parsing delimited rows", Math.min(92, 8 + count / 3000), { rowsProcessed: count });
  });
  return singleTable(file.name, rows, { rowsProcessed: rows.length, skippedRows: 0, mode: "worker-csv" });
}

async function ingestJson(file) {
  const rows = parseJsonData(await file.text());
  return singleTable(file.name, rows, { rowsProcessed: rows.length, skippedRows: 0, mode: "worker-json" });
}

async function ingestSql(file) {
  const parsed = parseSqlDump(await file.text());
  const rowsProcessed = Object.values(parsed.tables).reduce((acc, rows) => acc + rows.length, 0);
  return { ...parsed, meta: { rowsProcessed, skippedRows: 0, mode: "worker-sql" } };
}

function singleTable(name, rows, meta) {
  return { tables: { [name]: rows }, sheetNames: [name], meta };
}

async function ingestXlsx(file) {
  if (!("DecompressionStream" in self)) throw new Error("Streaming XLSX requires DecompressionStream support.");
  const entries = await readZipDirectory(file);
  const workbookEntry = entries.get("xl/workbook.xml");
  const relsEntry = entries.get("xl/_rels/workbook.xml.rels");
  if (!workbookEntry || !relsEntry) throw new Error("Workbook metadata missing.");
  const workbookXml = parseXml(await readZipEntryText(file, workbookEntry));
  const relsXml = parseXml(await readZipEntryText(file, relsEntry));
  const relMap = new Map(Array.from(relsXml.querySelectorAll("Relationship")).map((rel) => [rel.getAttribute("Id"), rel.getAttribute("Target")]));
  const sheets = Array.from(workbookXml.querySelectorAll("sheet")).map((sheet, index) => {
    const rid = sheet.getAttribute("r:id") || sheet.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
    return {
      name: sheet.getAttribute("name") || `Sheet ${index + 1}`,
      path: normalizeZipPath("xl", relMap.get(rid) || `worksheets/sheet${index + 1}.xml`)
    };
  }).filter((sheet) => entries.has(sheet.path));
  if (!sheets.length) throw new Error("No readable sheets found.");
  const sharedEntry = entries.get("xl/sharedStrings.xml");
  const sharedStrings = sharedEntry ? parseSharedStrings(await readZipEntryText(file, sharedEntry)) : [];
  const tables = {};
  let totalRows = 0;
  for (const sheet of sheets.slice(0, 3)) {
    progress(`Streaming ${sheet.name}`, Math.min(20, 5 + totalRows / 5000), { rowsProcessed: totalRows, mode: "worker-xlsx" });
    const table = await readSheetRowsStreaming(file, entries.get(sheet.path), sharedStrings, (count) => {
      if (count % 1000 === 0) progress(`Streaming ${sheet.name}`, Math.min(95, 15 + (totalRows + count) / 3000), { rowsProcessed: totalRows + count, mode: "worker-xlsx" });
    });
    tables[sheet.name] = tableToObjects(table);
    totalRows += tables[sheet.name].length;
  }
  return { tables, sheetNames: Object.keys(tables), meta: { rowsProcessed: totalRows, skippedRows: 0, mode: "worker-xlsx" } };
}

async function readZipDirectory(file) {
  const tailSize = Math.min(file.size, 1024 * 1024);
  const tail = new Uint8Array(await file.slice(file.size - tailSize).arrayBuffer());
  let eocd = -1;
  for (let i = tail.length - 22; i >= 0; i -= 1) {
    if (tail[i] === 0x50 && tail[i + 1] === 0x4b && tail[i + 2] === 0x05 && tail[i + 3] === 0x06) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Excel zip directory not found.");
  const view = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
  const cdSize = view.getUint32(eocd + 12, true);
  const cdOffset = view.getUint32(eocd + 16, true);
  const dir = new Uint8Array(await file.slice(cdOffset, cdOffset + cdSize).arrayBuffer());
  const dirView = new DataView(dir.buffer, dir.byteOffset, dir.byteLength);
  const entries = new Map();
  let offset = 0;
  while (offset + 46 <= dir.length && dirView.getUint32(offset, true) === 0x02014b50) {
    const method = dirView.getUint16(offset + 10, true);
    const compressedSize = dirView.getUint32(offset + 20, true);
    const uncompressedSize = dirView.getUint32(offset + 24, true);
    const nameLength = dirView.getUint16(offset + 28, true);
    const extraLength = dirView.getUint16(offset + 30, true);
    const commentLength = dirView.getUint16(offset + 32, true);
    const localHeaderOffset = dirView.getUint32(offset + 42, true);
    const name = decodeBytes(dir.slice(offset + 46, offset + 46 + nameLength));
    entries.set(name.replace(/\\/g, "/"), { name, method, compressedSize, uncompressedSize, localHeaderOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

async function readZipEntryText(file, entry) {
  const stream = await zipEntryStream(file, entry);
  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
  let text = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    text += value;
  }
  return text;
}

async function readSheetRowsStreaming(file, entry, sharedStrings, onRows) {
  const rows = [];
  const stream = await zipEntryStream(file, entry);
  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
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
      const rowXml = buffer.slice(rowStart, rowEnd + 6);
      const parsed = parseSheetRow(rowXml, sharedStrings);
      if (parsed.some((cell) => !isBlank(cell))) rows.push(parsed);
      if (rows.length % 1000 === 0) onRows(rows.length);
      buffer = buffer.slice(rowEnd + 6);
      rowEnd = buffer.indexOf("</row>");
    }
    if (buffer.length > 25000000) {
      const lastRowStart = buffer.lastIndexOf("<row");
      buffer = lastRowStart > 0 ? buffer.slice(lastRowStart) : buffer.slice(-1000000);
    }
  }
  return rows;
}

async function zipEntryStream(file, entry) {
  const header = new Uint8Array(await file.slice(entry.localHeaderOffset, entry.localHeaderOffset + 30).arrayBuffer());
  const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
  if (view.getUint32(0, true) !== 0x04034b50) throw new Error(`Invalid zip entry: ${entry.name}`);
  const nameLength = view.getUint16(26, true);
  const extraLength = view.getUint16(28, true);
  const dataStart = entry.localHeaderOffset + 30 + nameLength + extraLength;
  const compressed = file.slice(dataStart, dataStart + entry.compressedSize).stream();
  if (entry.method === 0) return compressed;
  if (entry.method === 8) return compressed.pipeThrough(new DecompressionStream("deflate-raw"));
  throw new Error(`Unsupported zip compression method ${entry.method}.`);
}

function parseSheetRow(rowXml, sharedStrings) {
  const cells = new Map();
  const cellPattern = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
  let match;
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
  const row = [];
  for (let i = 0; i <= max; i += 1) row.push(cells.has(i) ? cells.get(i) : "");
  return row;
}

function parseSharedStrings(xml) {
  const strings = [];
  const pattern = /<si\b[\s\S]*?<\/si>/g;
  let match;
  while ((match = pattern.exec(xml))) {
    const parts = [];
    const textPattern = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let textMatch;
    while ((textMatch = textPattern.exec(match[0]))) parts.push(decodeXmlText(textMatch[1]));
    strings.push(parts.join(""));
  }
  return strings;
}

function tableToObjects(table) {
  const nonEmptyRows = table.filter((row) => row.some((cell) => !isBlank(cell)));
  if (!nonEmptyRows.length) return [];
  let headerIndex = 0;
  let bestScore = -Infinity;
  nonEmptyRows.slice(0, 20).forEach((row, index) => {
    const cells = row.map((cell) => String(cell ?? "").trim()).filter(Boolean);
    const unique = new Set(cells.map(normalize)).size;
    const numericCells = cells.filter((cell) => parseNumber(cell) !== null).length;
    const score = cells.length * 2 + unique - numericCells * 0.7 - index * 0.1;
    if (cells.length >= 2 && score > bestScore) {
      bestScore = score;
      headerIndex = index;
    }
  });
  const headers = uniquifyHeaders(nonEmptyRows[headerIndex].map((cell, index) => String(cell ?? "").trim() || `Column ${index + 1}`));
  return nonEmptyRows.slice(headerIndex + 1).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = coerceCell(row[index] ?? "");
    });
    return record;
  });
}

function parseDelimited(text, delimiter, onRows) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim() !== "");
  if (!lines.length) return [];
  const headers = uniquifyHeaders(parseDelimitedLine(lines[0], delimiter).map((header, index) => header.trim() || `Column ${index + 1}`));
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const values = parseDelimitedLine(lines[i], delimiter);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = coerceCell(values[index] ?? "");
    });
    rows.push(row);
    onRows?.(rows.length);
  }
  return rows;
}

function parseDelimitedLine(line, delimiter) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      i += 1;
    } else if (char === "\"") quoted = !quoted;
    else if (char === delimiter && !quoted) {
      values.push(current);
      current = "";
    } else current += char;
  }
  values.push(current);
  return values;
}

function parseJsonData(text) {
  const data = JSON.parse(text);
  if (Array.isArray(data)) return normalizeJsonRows(data);
  if (Array.isArray(data.rows)) return normalizeJsonRows(data.rows);
  if (Array.isArray(data.data)) return normalizeJsonRows(data.data);
  const firstArrayKey = Object.keys(data).find((key) => Array.isArray(data[key]));
  if (firstArrayKey) return normalizeJsonRows(data[firstArrayKey]);
  return [flattenObject(data)];
}

function normalizeJsonRows(items) {
  return items.map((item) => item && typeof item === "object" && !Array.isArray(item) ? flattenObject(item) : { Value: item });
}

function flattenObject(input, prefix = "", output = {}) {
  Object.entries(input || {}).forEach(([key, value]) => {
    const name = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) flattenObject(value, name, output);
    else output[name] = Array.isArray(value) ? value.join(", ") : coerceCell(value);
  });
  return output;
}

function parseSqlDump(text) {
  const tables = {};
  const insertPattern = /insert\s+into\s+[`"\[]?([\w.\- ]+)[`"\]]?\s*(?:\(([^)]*)\))?\s*values\s*([\s\S]*?);/gi;
  let match;
  while ((match = insertPattern.exec(text))) {
    const tableName = cleanSqlIdentifier(match[1]) || "SQL data";
    const columns = match[2] ? splitSqlCsv(match[2]).map(cleanSqlIdentifier) : [];
    const tuples = extractSqlTuples(match[3]);
    if (!tables[tableName]) tables[tableName] = [];
    tuples.forEach((tuple) => {
      const values = splitSqlCsv(tuple).map(sqlValue);
      const row = {};
      const headers = columns.length ? columns : values.map((_, index) => `Column ${index + 1}`);
      headers.forEach((column, index) => {
        row[column || `Column ${index + 1}`] = values[index] ?? "";
      });
      tables[tableName].push(row);
    });
  }
  if (!Object.keys(tables).length) tables["SQL/text data"] = parseDelimited(text, detectDelimiter(text));
  return { tables, sheetNames: Object.keys(tables) };
}

function extractSqlTuples(block) {
  const tuples = [];
  let depth = 0;
  let quoted = "";
  let current = "";
  for (const char of block) {
    if (quoted) {
      current += char;
      if (char === quoted) quoted = "";
      continue;
    }
    if (char === "'" || char === "\"") {
      quoted = char;
      current += char;
    } else if (char === "(") {
      if (depth > 0) current += char;
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
      if (depth === 0) {
        tuples.push(current);
        current = "";
      } else current += char;
    } else if (depth > 0) current += char;
  }
  return tuples;
}

function splitSqlCsv(text) {
  return parseDelimitedLine(text, ",");
}

function sqlValue(value) {
  const trimmed = String(value ?? "").trim();
  if (/^null$/i.test(trimmed)) return "";
  return coerceCell(trimmed.replace(/^['"]|['"]$/g, "").replace(/''/g, "'"));
}

function cleanSqlIdentifier(value) {
  return String(value || "").trim().replace(/^[`"[]|[`"\]]$/g, "");
}

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/)[0] || "";
  const candidates = [",", "\t", ";", "|"];
  return candidates.map((delimiter) => ({ delimiter, count: firstLine.split(delimiter).length })).sort((a, b) => b.count - a.count)[0]?.delimiter || ",";
}

function coerceCell(value) {
  const trimmed = String(value ?? "").trim();
  const numeric = parseNumber(trimmed);
  if (numeric !== null && /^[$€£₹]?\s*-?[\d,.]+(?:e[+-]?\d+)?%?$/i.test(trimmed)) return numeric;
  return trimmed;
}

function parseNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Date) return null;
  const text = String(value ?? "").trim();
  if (!text) return null;
  const negative = /^\(.*\)$/.test(text);
  const cleaned = text.replace(/[,$€£₹\s]/g, "").replace(/[()]/g, "");
  if (!/^-?(?:\d+\.?\d*|\d*\.\d+)(?:e[+-]?\d+)?%?$/i.test(cleaned)) return null;
  const number = Number(cleaned.replace("%", ""));
  if (!Number.isFinite(number)) return null;
  return negative ? -number : number;
}

function uniquifyHeaders(headers) {
  const seen = new Map();
  return headers.map((header) => {
    const base = header || "Column";
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count ? `${base} ${count + 1}` : base;
  });
}

function parseXml(xml) {
  const parsed = new DOMParser().parseFromString(xml, "application/xml");
  if (parsed.querySelector("parsererror")) throw new Error("Invalid workbook XML.");
  return parsed;
}

function getXmlAttr(attrs, name) {
  const match = attrs.match(new RegExp(`\\b${name}="([^"]*)"`, "i"));
  return match ? decodeXmlText(match[1]) : "";
}

function decodeXmlText(value) {
  return String(value || "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

function decodeBytes(bytes) {
  return new TextDecoder("utf-8").decode(bytes);
}

function normalizeZipPath(base, target) {
  if (!target) return "";
  if (target.startsWith("/")) return target.slice(1);
  const parts = `${base}/${target}`.split("/");
  const out = [];
  parts.forEach((part) => {
    if (!part || part === ".") return;
    if (part === "..") out.pop();
    else out.push(part);
  });
  return out.join("/");
}

function columnIndexFromRef(ref) {
  const letters = String(ref || "").replace(/[^A-Z]/gi, "").toUpperCase();
  let index = 0;
  for (const letter of letters) index = index * 26 + letter.charCodeAt(0) - 64;
  return Math.max(0, index - 1);
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isBlank(value) {
  return String(value ?? "").trim() === "";
}

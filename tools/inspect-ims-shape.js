import fs from "node:fs";
import zlib from "node:zlib";
import { Readable } from "node:stream";

const filePath = process.argv[2];
const rowLimit = Number(process.argv[3] || 12);
const cellLimit = Number(process.argv[4] || 40);
if (!filePath) {
  console.error("Usage: node tools/inspect-ims-shape.js <file.xlsx> [rows]");
  process.exit(1);
}

const file = fs.readFileSync(filePath);

function readZipDirectory(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 1024 * 1024); i -= 1) {
    if (buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x05 && buf[i + 3] === 0x06) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("EOCD missing");
  const cdSize = buf.readUInt32LE(eocd + 12);
  const cdOffset = buf.readUInt32LE(eocd + 16);
  const entries = new Map();
  let offset = cdOffset;
  while (offset + 46 <= cdOffset + cdSize && buf.readUInt32LE(offset) === 0x02014b50) {
    const method = buf.readUInt16LE(offset + 10);
    const compressedSize = buf.readUInt32LE(offset + 20);
    const uncompressedSize = buf.readUInt32LE(offset + 24);
    const nameLength = buf.readUInt16LE(offset + 28);
    const extraLength = buf.readUInt16LE(offset + 30);
    const commentLength = buf.readUInt16LE(offset + 32);
    const localHeaderOffset = buf.readUInt32LE(offset + 42);
    const name = buf.slice(offset + 46, offset + 46 + nameLength).toString("utf8");
    entries.set(name, { name, method, compressedSize, uncompressedSize, localHeaderOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function entryBuffer(buf, entry) {
  const nameLength = buf.readUInt16LE(entry.localHeaderOffset + 26);
  const extraLength = buf.readUInt16LE(entry.localHeaderOffset + 28);
  const start = entry.localHeaderOffset + 30 + nameLength + extraLength;
  return buf.slice(start, start + entry.compressedSize);
}

function entryText(buf, entry) {
  const compressed = entryBuffer(buf, entry);
  const out = entry.method === 0 ? compressed : zlib.inflateRawSync(compressed);
  return out.toString("utf8");
}

function decodeXmlText(value) {
  return String(value || "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&apos;/g, "'").replace(/&amp;/g, "&");
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

function getXmlAttr(attrs, name) {
  const match = attrs.match(new RegExp(`\\b${name}="([^"]*)"`, "i"));
  return match ? decodeXmlText(match[1]) : "";
}

function columnIndexFromRef(ref) {
  const letters = String(ref || "").replace(/[^A-Z]/gi, "").toUpperCase();
  let index = 0;
  for (const letter of letters) index = index * 26 + letter.charCodeAt(0) - 64;
  return Math.max(0, index - 1);
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
    cells.set(index, value);
  }
  const max = cells.size ? Math.max(...cells.keys()) : -1;
  const row = [];
  for (let i = 0; i <= max; i += 1) row.push(cells.has(i) ? cells.get(i) : "");
  return row;
}

async function streamRows(buf, entry, sharedStrings, limit) {
  const rows = [];
  const compressed = entryBuffer(buf, entry);
  const stream = entry.method === 0 ? Readable.from(compressed) : Readable.from(compressed).pipe(zlib.createInflateRaw());
  stream.setEncoding("utf8");
  let buffer = "";
  for await (const chunk of stream) {
    buffer += chunk;
    let rowEnd = buffer.indexOf("</row>");
    while (rowEnd >= 0 && rows.length < limit) {
      const rowStart = buffer.lastIndexOf("<row", rowEnd);
      if (rowStart >= 0) rows.push(parseSheetRow(buffer.slice(rowStart, rowEnd + 6), sharedStrings));
      buffer = buffer.slice(rowEnd + 6);
      rowEnd = buffer.indexOf("</row>");
    }
    if (rows.length >= limit) break;
    if (buffer.length > 25000000) {
      const lastRowStart = buffer.lastIndexOf("<row");
      buffer = lastRowStart > 0 ? buffer.slice(lastRowStart) : buffer.slice(-1000000);
    }
  }
  stream.destroy();
  return rows;
}

const entries = readZipDirectory(file);
const shared = entries.has("xl/sharedStrings.xml") ? parseSharedStrings(entryText(file, entries.get("xl/sharedStrings.xml"))) : [];
streamRows(file, entries.get("xl/worksheets/sheet1.xml"), shared, rowLimit).then((rows) => {
  rows.forEach((row, idx) => {
    const nonEmpty = row.map((value, index) => ({ value, index })).filter((item) => String(item.value || "").trim());
    console.log(`row ${idx + 1}: width=${row.length}, nonEmpty=${nonEmpty.length}`);
    console.log(nonEmpty.slice(0, cellLimit).map((item) => `${item.index + 1}:${String(item.value).slice(0, 45)}`).join(" | "));
  });
});

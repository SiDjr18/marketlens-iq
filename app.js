const state = {
  workbook: {},
  sheetNames: [],
  rows: [],
  columns: [],
  profile: null,
  selectedSheet: "",
  metric: "",
  dimension: "",
  dateColumn: "",
  density: "executive",
  theme: "studio",
  includeNarrative: true,
  vertical: "executive",
  filterValue: "__all__",
  topN: 10,
  activeOnly: false,
  fileName: "No workbook loaded",
  charts: {},
  isSampled: false,
  rowLimit: 0,
  analysisNotes: [],
  domain: "generic",
  measureColumns: []
};

const els = {};
const chartPalette = ["#0f766e", "#c2410c", "#2563eb", "#b45309", "#7c3aed", "#15803d", "#be123c", "#475569"];

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  initializeEmptyState();
  hydrateIcons();
});

function cacheElements() {
  [
    "dropZone",
    "fileInput",
    "fileName",
    "rowCount",
    "verticalSelect",
    "sheetSelect",
    "metricSelect",
    "dimensionSelect",
    "dateSelect",
    "filterSelect",
    "topNSelect",
    "activeOnly",
    "themeSelect",
    "includeNarrative",
    "dashboardTitle",
    "dataSourceLabel",
    "summaryHeadline",
    "healthScore",
    "executiveGrid",
    "kpiGrid",
    "trendTitle",
    "trendMeta",
    "trendBadge",
    "barTitle",
    "barMeta",
    "donutTitle",
    "donutMeta",
    "insightMeta",
    "insightList",
    "strategyTitle",
    "strategyMeta",
    "strategyGrid",
    "tableMeta",
    "previewTable",
    "dashboardSurface",
    "toast",
    "refreshInsights",
    "resetCriteria",
    "printDashboard",
    "exportPpt",
    "exportPdf",
    "exportBi",
    "exportCsv",
    "exportHtml",
    "exportPng"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function bindEvents() {
  els.fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) handleFile(file);
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    els.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      els.dropZone.classList.add("is-over");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    els.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      els.dropZone.classList.remove("is-over");
    });
  });

  els.dropZone.addEventListener("drop", (event) => {
    const file = event.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  els.sheetSelect.addEventListener("change", () => {
    state.selectedSheet = els.sheetSelect.value;
    state.filterValue = "__all__";
    setRows(state.workbook[state.selectedSheet] || []);
  });

  els.metricSelect.addEventListener("change", () => {
    state.metric = els.metricSelect.value;
    state.vertical = "custom";
    els.verticalSelect.value = "custom";
    renderDashboard();
  });

  els.dimensionSelect.addEventListener("change", () => {
    state.dimension = els.dimensionSelect.value;
    state.filterValue = "__all__";
    state.vertical = "custom";
    els.verticalSelect.value = "custom";
    updateFilterOptions();
    renderDashboard();
  });

  els.dateSelect.addEventListener("change", () => {
    state.dateColumn = els.dateSelect.value;
    state.vertical = "custom";
    els.verticalSelect.value = "custom";
    renderDashboard();
  });

  els.verticalSelect.addEventListener("change", () => {
    state.vertical = els.verticalSelect.value;
    applyVerticalPreset();
    state.filterValue = "__all__";
    updateControls();
    renderDashboard();
  });

  els.filterSelect.addEventListener("change", () => {
    state.filterValue = els.filterSelect.value;
    renderDashboard();
  });

  els.topNSelect.addEventListener("change", () => {
    state.topN = Number(els.topNSelect.value) || 10;
    renderDashboard();
  });

  els.activeOnly.addEventListener("change", () => {
    state.activeOnly = els.activeOnly.checked;
    renderDashboard();
  });

  els.themeSelect.addEventListener("change", () => {
    state.theme = els.themeSelect.value;
    applyThemeAndDensity();
    renderDashboard();
  });

  els.includeNarrative.addEventListener("change", () => {
    state.includeNarrative = els.includeNarrative.checked;
    renderInsights();
  });

  document.querySelectorAll("[data-density]").forEach((button) => {
    button.addEventListener("click", () => {
      state.density = button.dataset.density;
      document.querySelectorAll("[data-density]").forEach((el) => el.classList.toggle("is-active", el === button));
      applyThemeAndDensity();
      Object.values(state.charts).forEach((chart) => chart.resize());
    });
  });

  els.refreshInsights.addEventListener("click", () => {
    inferSelections(true);
    applyVerticalPreset();
    renderDashboard();
    showToast("Dashboard rebuilt from current columns.");
  });

  els.resetCriteria.addEventListener("click", () => {
    state.filterValue = "__all__";
    state.topN = 10;
    state.activeOnly = false;
    applyVerticalPreset();
    updateControls();
    renderDashboard();
    showToast("Criteria reset.");
  });

  els.printDashboard.addEventListener("click", () => window.print());
  els.exportCsv.addEventListener("click", exportCsv);
  els.exportBi.addEventListener("click", exportBiModel);
  els.exportHtml.addEventListener("click", exportHtmlReport);
  els.exportPng.addEventListener("click", exportPng);
  els.exportPdf.addEventListener("click", exportPdf);
  els.exportPpt.addEventListener("click", exportPpt);
}

function initializeEmptyState() {
  state.workbook = { "Upload workbook": [] };
  state.sheetNames = ["Upload workbook"];
  state.selectedSheet = "Upload workbook";
  state.fileName = "No workbook loaded";
  state.isSampled = false;
  state.rowLimit = 0;
  setRows([]);
}

async function handleFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  try {
    if (["csv", "tsv"].includes(ext)) {
      const text = await file.text();
      const delimiter = ext === "tsv" ? "\t" : detectDelimiter(text);
      const rows = parseDelimited(text, delimiter);
      state.workbook = { [file.name]: rows };
      state.sheetNames = [file.name];
      state.selectedSheet = file.name;
      state.isSampled = false;
      state.rowLimit = 0;
    } else if (ext === "json") {
      const text = await file.text();
      const rows = parseJsonData(text);
      state.workbook = { [file.name]: rows };
      state.sheetNames = [file.name];
      state.selectedSheet = file.name;
      state.isSampled = false;
      state.rowLimit = 0;
    } else if (ext === "sql") {
      const text = await file.text();
      const parsed = parseSqlDump(text);
      state.workbook = parsed.tables;
      state.sheetNames = parsed.sheetNames;
      state.selectedSheet = parsed.sheetNames[0];
      state.isSampled = parsed.isSampled;
      state.rowLimit = parsed.rowLimit;
    } else {
      const rowLimit = getWorkbookRowLimit(file);
      const largeMode = shouldUseLargeWorkbookMode(file);
      if (!window.XLSX && !largeMode) {
        showToast("Excel parser did not load. Try CSV or connect to the internet.");
        return;
      }
      if (largeMode) {
        showToast("Large workbook mode: sampling rows without loading the full Excel file.");
        const sampled = await readLargeXlsxSample(file, rowLimit);
        state.workbook = sampled.sheets;
        state.sheetNames = sampled.sheetNames;
        state.selectedSheet = sampled.sheetNames[0];
        state.isSampled = true;
        state.rowLimit = rowLimit;
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, {
          type: "array",
          cellDates: true,
          sheetRows: rowLimit || 0,
          raw: false
        });
        state.isSampled = Boolean(rowLimit);
        state.rowLimit = rowLimit;
        const sheets = {};
        workbook.SheetNames.forEach((sheetName) => {
          sheets[sheetName] = sheetToRows(workbook.Sheets[sheetName]);
        });
        if (Object.values(sheets).every((rows) => !rows.length) && /\.xlsx$/i.test(file.name) && "DecompressionStream" in window) {
          showToast("Normal Excel parser returned no rows. Retrying with IMS/IQVIA streaming mode.");
          const sampled = await readLargeXlsxSample(file, rowLimit || 8000);
          state.workbook = sampled.sheets;
          state.sheetNames = sampled.sheetNames;
          state.selectedSheet = sampled.sheetNames[0];
          state.isSampled = true;
          state.rowLimit = rowLimit || 8000;
        } else {
        state.workbook = sheets;
        state.sheetNames = workbook.SheetNames;
        state.selectedSheet = workbook.SheetNames[0];
        }
      }
    }
  state.fileName = file.name;
    setRows(state.workbook[state.selectedSheet] || []);
    showToast(`${file.name} imported.`);
  } catch (error) {
    console.error(error);
    showToast("Could not read that file. Check the format and try again.");
  } finally {
    els.fileInput.value = "";
  }
}

function setRows(rows) {
  state.analysisNotes = [];
  state.rows = enrichRowsForAnalysis(rows.filter((row) => Object.values(row).some((value) => String(value ?? "").trim() !== "")));
  state.columns = getColumns(state.rows);
  state.profile = profileColumns(state.rows, state.columns);
  inferSelections(false);
  applyVerticalPreset();
  updateControls();
  renderDashboard();
}

function getWorkbookRowLimit(file) {
  const mb = file.size / (1024 * 1024);
  if (mb >= 350) return 6000;
  if (mb >= 250) return 7000;
  if (mb >= 150) return 8000;
  if (mb >= 80) return 12000;
  if (mb >= 35) return 20000;
  return 0;
}

function shouldUseLargeWorkbookMode(file) {
  const name = normalize(file.name);
  const mb = file.size / (1024 * 1024);
  return /\.xlsx$/i.test(file.name) && (mb >= 50 || /ims|iqvia|mat|market|pharma/.test(name));
}

function enrichRowsForAnalysis(rows) {
  state.domain = "generic";
  state.measureColumns = [];
  if (!rows.length) return rows;

  const columns = getColumns(rows);
  if (!looksLikeImsWorkbook(columns)) {
    state.domain = detectBusinessDomain(columns);
    if (state.domain !== "generic") {
      state.analysisNotes.push(`${titleCase(state.domain)} data structure detected from uploaded columns.`);
    }
    return rows;
  }

  state.domain = "ims";
  const descriptorColumns = new Set(getImsDescriptorColumns(columns));
  const idColumns = new Set(getImsIdColumns(columns));
  const measureColumns = columns.filter((column) => {
    if (descriptorColumns.has(column) || idColumns.has(column)) return false;
    const details = profileSingleColumn(rows, column);
    return details.numericScore > 0.72;
  });

  state.measureColumns = measureColumns;
  if (!measureColumns.length) {
    state.analysisNotes.push("IMS structure detected, but no numeric matrix columns were found.");
    return rows;
  }

  const enriched = rows.map((row) => {
    const values = measureColumns.map((column) => parseNumber(row[column]) ?? 0);
    const nonZero = values.filter((value) => value !== 0);
    const total = sum(values);
    return {
      ...row,
      "IMS Total": total,
      "IMS Latest": values[values.length - 1] || 0,
      "IMS Average": values.length ? total / values.length : 0,
      "IMS Peak": values.length ? Math.max(...values) : 0,
      "IMS Active Periods": nonZero.length
    };
  });

  const sampleNote = state.isSampled ? ` Large workbook sampled to the first ${formatNumber(state.rowLimit)} sheet rows for browser performance.` : "";
  state.analysisNotes.push(`IMS matrix detected; ${formatNumber(measureColumns.length)} numeric measure columns were combined into analysis metrics.${sampleNote}`);
  return enriched;
}

function looksLikeImsWorkbook(columns) {
  const normalized = new Set(columns.map(normalize));
  const imsHits = ["packdesc", "brands", "manufactdesc", "acutechronic", "nfc"].filter((name) => normalized.has(name)).length;
  return imsHits >= 3;
}

function detectBusinessDomain(columns) {
  const joined = columns.map(normalize).join(" ");
  const scores = {
    finance: scoreTerms(joined, ["budget", "spend", "cost", "margin", "profit", "expense", "actual", "variance", "forecast"]),
    sales: scoreTerms(joined, ["sales", "revenue", "orders", "pipeline", "territory", "account", "customer", "quota", "conversion"]),
    marketing: scoreTerms(joined, ["campaign", "brand", "channel", "impressions", "clicks", "leads", "ctr", "cpc", "creative"]),
    supply: scoreTerms(joined, ["inventory", "stock", "warehouse", "sku", "demand", "supplier", "shipment", "fillrate", "leadtime"]),
    presales: scoreTerms(joined, ["opportunity", "lead", "prospect", "deal", "stage", "proposal", "pipeline", "probability"])
  };
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] >= 2 ? best[0] : "generic";
}

function scoreTerms(text, terms) {
  return terms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0);
}

function getImsDescriptorColumns(columns) {
  const descriptorNames = new Set([
    "packdesc",
    "brands",
    "manufactdesc",
    "indianmnc",
    "group",
    "acutechronic",
    "prodlnch",
    "nfc",
    "plain"
  ]);
  return columns.filter((column) => descriptorNames.has(normalize(column)) || /desc|brand|group|chronic|company|therapy|market|molecule|composition/.test(normalize(column)));
}

function getImsIdColumns(columns) {
  const idNames = new Set(["pfc", "ind"]);
  return columns.filter((column) => idNames.has(normalize(column)) || /(^id$|code$|_id$|pfc|launch)/.test(normalize(column)));
}

function profileSingleColumn(rows, column) {
  const values = rows.map((row) => row[column]).filter((value) => value !== null && value !== undefined && String(value).trim() !== "");
  const sample = values.slice(0, 120);
  const numericHits = sample.filter((value) => parseNumber(value) !== null).length;
  return {
    numericScore: sample.length ? numericHits / sample.length : 0,
    filled: values.length
  };
}

function getColumns(rows) {
  const seen = new Set();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (!seen.has(key)) seen.add(key);
    });
  });
  return Array.from(seen);
}

function profileColumns(rows, columns) {
  const profile = {
    numeric: [],
    date: [],
    category: [],
    details: {}
  };

  columns.forEach((column) => {
    const values = rows.map((row) => row[column]).filter((value) => value !== null && value !== undefined && String(value).trim() !== "");
    const sample = values.slice(0, 80);
    const numericHits = sample.filter((value) => parseNumber(value) !== null).length;
    const dateHits = sample.filter((value) => parseDate(value) !== null).length;
    const unique = new Set(values.map((value) => String(value))).size;
    const numericScore = sample.length ? numericHits / sample.length : 0;
    const dateScore = sample.length ? dateHits / sample.length : 0;
    const role = dateScore > 0.72 && numericScore < 0.8 ? "date" : numericScore > 0.72 ? "numeric" : "category";
    profile.details[column] = { role, unique, filled: values.length, total: rows.length };
    if (role === "numeric") profile.numeric.push(column);
    if (role === "date") profile.date.push(column);
    if (role === "category") profile.category.push(column);
  });

  if (!profile.category.length) {
    profile.category = columns.filter((column) => !profile.numeric.includes(column) && !profile.date.includes(column));
  }

  return profile;
}

function inferSelections(force) {
  const numeric = state.profile.numeric;
  const category = state.profile.category;
  const date = state.profile.date;
  const metricRank = state.domain === "ims"
    ? ["imstotal", "imslatest", "imsaverage", "imspeak", "revenue", "sales", "value", "total"]
    : state.domain === "finance"
      ? ["profit", "margin", "revenue", "budget", "actual", "spend", "cost", "variance"]
    : state.domain === "marketing"
      ? ["leads", "conversion", "revenue", "sales", "clicks", "impressions", "spend"]
    : state.domain === "sales"
      ? ["revenue", "sales", "orders", "pipeline", "quota", "conversion"]
    : state.domain === "supply"
      ? ["demand", "orders", "stock", "inventory", "quantity", "fillrate", "leadtime"]
    : ["revenue", "sales", "amount", "profit", "total", "value", "orders", "cost"];
  const categoryRank = state.domain === "ims"
    ? ["brands", "manufactdesc", "group", "packdesc", "acutechronic", "nfc", "indianmnc", "prodlnch"]
    : state.domain === "finance"
      ? ["department", "region", "category", "costcenter", "businessunit"]
    : state.domain === "marketing"
      ? ["brand", "campaign", "channel", "segment", "product", "region"]
    : state.domain === "sales"
      ? ["region", "territory", "account", "customer", "salesrep", "product"]
    : state.domain === "supply"
      ? ["sku", "product", "warehouse", "supplier", "region", "pack"]
    : ["region", "segment", "category", "product", "channel", "market", "department", "team"];
  const metric = pickByRank(numeric, metricRank) || numeric[0] || state.columns[0] || "";
  const dimension = pickByRank(category, categoryRank) || bestCategory(category) || state.columns.find((col) => col !== metric) || "";
  const dateColumn = date[0] || "";

  if (force || !numeric.includes(state.metric)) state.metric = metric;
  if (force || !state.columns.includes(state.dimension)) state.dimension = dimension;
  if (force || !date.includes(state.dateColumn)) state.dateColumn = dateColumn;
}

function applyVerticalPreset() {
  if (!state.profile || state.vertical === "custom") return;
  const preset = getVerticalPreset(state.vertical);
  const metric = pickByRank(state.profile.numeric, preset.metricRank) || state.metric;
  const dimension = pickByRank(state.profile.category, preset.dimensionRank) || state.dimension;
  if (metric) state.metric = metric;
  if (dimension) state.dimension = dimension;
}

function getVerticalPreset(vertical) {
  const imsMetrics = ["imstotal", "imslatest", "imsaverage", "imspeak", "imsactiveperiods"];
  const presets = {
    executive: {
      label: "Executive",
      metricRank: state.domain === "ims" ? imsMetrics : ["revenue", "sales", "profit", "amount", "value", "total"],
      dimensionRank: state.domain === "ims" ? ["brands", "manufactdesc", "group", "acutechronic"] : ["region", "segment", "category", "product", "channel"]
    },
    marketing: {
      label: "Marketing",
      metricRank: state.domain === "ims" ? ["imstotal", "imslatest", "imsactiveperiods"] : ["revenue", "sales", "orders", "value"],
      dimensionRank: state.domain === "ims" ? ["brands", "packdesc", "nfc", "acutechronic"] : ["product", "brand", "category", "channel", "campaign"]
    },
    presales: {
      label: "Pre-sales & BD",
      metricRank: state.domain === "ims" ? ["imspeak", "imstotal", "imslatest"] : ["value", "revenue", "sales", "amount"],
      dimensionRank: state.domain === "ims" ? ["group", "manufactdesc", "nfc", "brands"] : ["market", "segment", "region", "industry", "account"]
    },
    finance: {
      label: "Finance",
      metricRank: state.domain === "ims" ? ["imstotal", "imsaverage", "imslatest"] : ["profit", "cost", "revenue", "budget", "amount"],
      dimensionRank: state.domain === "ims" ? ["manufactdesc", "group", "brands", "acutechronic"] : ["department", "region", "category", "costcenter"]
    },
    sales: {
      label: "Sales",
      metricRank: state.domain === "ims" ? ["imslatest", "imstotal", "imspeak"] : ["revenue", "sales", "orders", "pipeline"],
      dimensionRank: state.domain === "ims" ? ["manufactdesc", "brands", "group", "packdesc"] : ["region", "salesrep", "account", "territory", "product"]
    },
    supply: {
      label: "Supply Chain",
      metricRank: state.domain === "ims" ? ["imspeak", "imsaverage", "imstotal", "imslatest"] : ["orders", "demand", "sales", "quantity", "stock"],
      dimensionRank: state.domain === "ims" ? ["packdesc", "brands", "manufactdesc", "nfc"] : ["product", "sku", "warehouse", "region", "vendor"]
    },
    strategy: {
      label: "Brand Strategy",
      metricRank: state.domain === "ims" ? ["imstotal", "imslatest", "imspeak", "imsactiveperiods"] : ["revenue", "sales", "profit", "value"],
      dimensionRank: state.domain === "ims" ? ["brands", "moleculedesc", "group", "manufactdesc"] : ["brand", "product", "category", "segment"]
    }
  };
  return presets[vertical] || presets.executive;
}

function pickByRank(columns, rankList) {
  for (const token of rankList) {
    const match = columns.find((column) => normalize(column).includes(token));
    if (match) return match;
  }
  return "";
}

function bestCategory(columns) {
  const candidates = columns
    .map((column) => ({ column, unique: state.profile.details[column]?.unique || 0 }))
    .filter((item) => item.unique > 1)
    .sort((a, b) => Math.abs(a.unique - 8) - Math.abs(b.unique - 8));
  return candidates[0]?.column || columns[0] || "";
}

function updateControls() {
  els.verticalSelect.value = state.vertical;
  setOptions(els.sheetSelect, state.sheetNames, state.selectedSheet);
  setOptions(els.metricSelect, state.profile.numeric.length ? state.profile.numeric : state.columns, state.metric);
  setOptions(els.dimensionSelect, state.profile.category.length ? state.profile.category : state.columns, state.dimension);
  setOptions(els.dateSelect, ["", ...state.profile.date], state.dateColumn, "(none)");
  els.topNSelect.value = String(state.topN);
  els.activeOnly.checked = state.activeOnly;
  updateFilterOptions();
  els.fileName.textContent = state.fileName;
  els.rowCount.textContent = `${formatNumber(getActiveRows().length)} of ${formatNumber(state.rows.length)} rows`;
}

function updateFilterOptions() {
  const values = getDimensionValues(state.rows, state.dimension).slice(0, 250);
  const current = values.includes(state.filterValue) ? state.filterValue : "__all__";
  state.filterValue = current;
  els.filterSelect.innerHTML = "";
  const all = document.createElement("option");
  all.value = "__all__";
  all.textContent = `All ${state.dimension || "segments"}`;
  all.selected = current === "__all__";
  els.filterSelect.appendChild(all);
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    option.selected = value === current;
    els.filterSelect.appendChild(option);
  });
}

function getDimensionValues(rows, dimension) {
  if (!dimension) return [];
  const totals = groupBySum(rows, dimension, state.metric || state.profile?.numeric?.[0] || "").sort((a, b) => b.value - a.value);
  return totals.map((item) => item.name).filter((value) => value && value !== "Unassigned");
}

function getActiveRows() {
  let rows = state.rows;
  if (state.filterValue && state.filterValue !== "__all__" && state.dimension) {
    rows = rows.filter((row) => String(row[state.dimension] ?? "Unassigned").trim() === state.filterValue);
  }
  if (state.activeOnly && state.domain === "ims") {
    rows = rows.filter((row) => (parseNumber(row["IMS Active Periods"]) ?? 0) > 0);
  }
  return rows;
}

function setOptions(select, options, selected, emptyLabel) {
  select.innerHTML = "";
  if (!options.length) {
    const el = document.createElement("option");
    el.value = "";
    el.textContent = emptyLabel || "No fields";
    el.selected = true;
    select.appendChild(el);
    return;
  }
  options.forEach((option) => {
    const el = document.createElement("option");
    el.value = option;
    el.textContent = option || emptyLabel || option;
    el.selected = option === selected;
    select.appendChild(el);
  });
}

function renderDashboard() {
  applyThemeAndDensity();
  renderShellText();
  renderExecutiveSummary();
  renderKpis();
  renderCharts();
  renderInsights();
  renderStrategyPlan();
  renderTablePreview();
  hydrateIcons();
}

function applyThemeAndDensity() {
  document.body.classList.toggle("theme-copper", state.theme === "copper");
  document.body.classList.toggle("theme-harbor", state.theme === "harbor");
  document.body.classList.toggle("density-analyst", state.density === "analyst");
  document.body.classList.toggle("density-compact", state.density === "compact");
}

function renderShellText() {
  const rows = getActiveRows();
  const metric = state.metric || "Metric";
  const dimension = state.dimension || "segment";
  const viewLabel = getVerticalPreset(state.vertical).label || "Executive";
  els.dashboardTitle.textContent = state.domain === "ims" ? `${viewLabel} IMS Performance` : `${viewLabel} ${titleCase(metric)} Performance`;
  els.dataSourceLabel.textContent = `${state.fileName} - ${state.selectedSheet}`;
  const note = state.analysisNotes.length ? ` ${state.analysisNotes[0]}` : "";
  const criteria = state.filterValue !== "__all__" ? ` Filtered to ${state.filterValue}.` : "";
  els.rowCount.textContent = `${formatNumber(rows.length)} of ${formatNumber(state.rows.length)} rows`;
  els.summaryHeadline.textContent = rows.length
    ? `${formatNumber(rows.length)} records analyzed across ${formatNumber(state.columns.length)} fields, grouped by ${dimension}.${criteria}${note}`
    : "No usable table rows found. Try another sheet or export the workbook as CSV.";
  const filled = state.columns.reduce((acc, column) => acc + (state.profile.details[column]?.filled || 0), 0);
  const possible = Math.max(1, state.columns.length * Math.max(1, state.rows.length));
  els.healthScore.textContent = `${Math.round((filled / possible) * 100)}%`;
}

function renderExecutiveSummary() {
  const tiles = buildExecutiveTiles();
  els.executiveGrid.innerHTML = "";
  tiles.forEach((tile, index) => {
    const card = document.createElement("article");
    card.className = `executive-tile ${index === 0 ? "primary" : ""}`;
    card.innerHTML = `
      <div>
        <div class="executive-kicker">${escapeHtml(tile.kicker)}</div>
        <div class="executive-value">${escapeHtml(tile.value)}</div>
      </div>
      <div class="executive-note">${escapeHtml(tile.note)}</div>
    `;
    els.executiveGrid.appendChild(card);
  });
}

function buildExecutiveTiles() {
  const metric = state.metric;
  const dimension = state.dimension;
  const rows = getActiveRows();
  const grouped = groupBySum(rows, dimension, metric).sort((a, b) => b.value - a.value);
  const total = sum(grouped.map((item) => item.value));
  const top = grouped[0];
  const top3 = sum(grouped.slice(0, 3).map((item) => item.value));
  const concentration = total ? (top3 / total) * 100 : 0;
  const activeRows = state.domain === "ims"
    ? rows.filter((row) => (parseNumber(row["IMS Active Periods"]) ?? 0) > 0).length
    : rows.length;
  const coverage = rows.length ? (activeRows / rows.length) * 100 : 0;
  const driver = top ? `${top.name} leads with ${formatMetric(top.value, metric)}` : "No clear leader detected";
  const concentrationLabel = concentration >= 65 ? "Highly concentrated" : concentration >= 40 ? "Moderately concentrated" : "Broadly distributed";
  const domainLabel = state.domain === "ims" ? "market universe" : "dataset";

  return [
    {
      kicker: "Executive readout",
      value: driver,
      note: `${formatNumber(rows.length)} records in the ${domainLabel}; ${formatMetric(total, metric)} total ${titleCase(metric)}.`
    },
    {
      kicker: "Portfolio concentration",
      value: `${formatNumber(concentration)}%`,
      note: `${concentrationLabel}: top 3 ${titleCase(dimension)} contributors by ${titleCase(metric)}.`
    },
    {
      kicker: state.domain === "ims" ? "Active universe" : "Analysis coverage",
      value: `${formatNumber(coverage)}%`,
      note: state.domain === "ims" ? "Rows with activity across IMS measure periods." : "Rows included in the current analysis view."
    }
  ];
}

function renderKpis() {
  const rows = getActiveRows();
  const metric = state.metric;
  const dimension = state.dimension;
  const values = rows.map((row) => parseNumber(row[metric])).filter((value) => value !== null);
  const total = sum(values);
  const average = values.length ? total / values.length : 0;
  const grouped = groupBySum(rows, dimension, metric).sort((a, b) => b.value - a.value);
  const top = grouped[0];
  const trend = calculateTrend(rows, state.dateColumn, metric);
  const kpis = [
    {
      label: `Total ${titleCase(metric)}`,
      value: formatMetric(total, metric),
      note: state.domain === "ims" ? `${formatNumber(state.measureColumns.length)} IMS periods combined` : `${formatNumber(values.length)} numeric values`,
      style: "priority"
    },
    {
      label: `Average ${titleCase(metric)}`,
      value: formatMetric(average, metric),
      note: "Mean per record"
    },
    {
      label: `Top ${titleCase(dimension)}`,
      value: top ? top.name : "n/a",
      note: top ? formatMetric(top.value, metric) : "No category detected",
      style: "priority"
    },
    {
      label: trend.label,
      value: trend.value,
      note: trend.note,
      trend: trend.direction
    }
  ];

  els.kpiGrid.innerHTML = "";
  kpis.forEach((kpi) => {
    const card = document.createElement("article");
    card.className = `kpi-card ${kpi.style || ""} ${kpi.trend === "bad" ? "risk" : ""}`;
    card.innerHTML = `
      <div>
        <div class="kpi-label">${escapeHtml(kpi.label)}</div>
        <div class="kpi-value">${escapeHtml(kpi.value)}</div>
      </div>
      <div class="kpi-note ${kpi.trend || ""}">${escapeHtml(kpi.note)}</div>
    `;
    els.kpiGrid.appendChild(card);
  });
}

function renderCharts() {
  destroyCharts();
  const metric = state.metric;
  const dimension = state.dimension;
  const rows = getActiveRows();
  const trendData = getTrendData(metric);
  const rankData = groupBySum(rows, dimension, metric).sort((a, b) => b.value - a.value).slice(0, state.topN);
  const mixData = rankData.slice(0, 6);

  els.trendTitle.textContent = state.dateColumn || state.domain === "ims" ? `${titleCase(metric)} over time` : `${titleCase(metric)} sequence`;
  els.trendMeta.textContent = state.dateColumn ? `Monthly rollup from ${state.dateColumn}` : state.domain === "ims" ? "Rollup across detected IMS period columns" : "Record order used because no date field was found";
  els.trendBadge.textContent = state.dateColumn || state.domain === "ims" ? "Trend" : "Index";
  els.barTitle.textContent = `${titleCase(dimension)} leaderboard`;
  els.barMeta.textContent = `Top ${rankData.length || 0} contributors by ${titleCase(metric)}`;
  els.donutTitle.textContent = `${titleCase(dimension)} contribution mix`;
  els.donutMeta.textContent = `Share of ${titleCase(metric)}`;

  if (!window.Chart) {
    renderCanvasFallback("trendChart", trendData, "line");
    renderCanvasFallback("barChart", rankData, "bar");
    renderCanvasFallback("donutChart", mixData, "donut");
    return;
  }

  const css = getComputedStyle(document.documentElement);
  const axisColor = css.getPropertyValue("--muted").trim();
  const gridColor = css.getPropertyValue("--line").trim();

  state.charts.trend = new Chart(document.getElementById("trendChart"), {
    type: "line",
    data: {
      labels: trendData.map((item) => item.name),
      datasets: [
        {
          label: metric,
          data: trendData.map((item) => item.value),
          borderColor: chartPalette[0],
          backgroundColor: "rgba(15, 118, 110, 0.14)",
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.28,
          fill: true
        }
      ]
    },
    options: chartOptions(axisColor, gridColor)
  });

  state.charts.bar = new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels: rankData.map((item) => item.name),
      datasets: [
        {
          label: metric,
          data: rankData.map((item) => item.value),
          backgroundColor: chartPalette.slice(0, rankData.length),
          borderRadius: 5
        }
      ]
    },
    options: chartOptions(axisColor, gridColor, true)
  });

  state.charts.donut = new Chart(document.getElementById("donutChart"), {
    type: "doughnut",
    data: {
      labels: mixData.map((item) => item.name),
      datasets: [
        {
          data: mixData.map((item) => item.value),
          backgroundColor: chartPalette.slice(0, mixData.length),
          borderWidth: 2,
          borderColor: "#fffdf8"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 12,
            color: axisColor,
            font: { family: "Inter, sans-serif" }
          }
        }
      }
    }
  });
}

function chartOptions(axisColor, gridColor, indexAxis) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: indexAxis ? "y" : "x",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = indexAxis ? context.parsed.x : context.parsed.y;
            return `${context.dataset.label || "Value"}: ${formatNumber(value ?? context.raw)}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: axisColor, maxRotation: 0, autoSkip: true },
        grid: { color: gridColor }
      },
      y: {
        ticks: { color: axisColor },
        grid: { color: gridColor },
        beginAtZero: true
      }
    }
  };
}

function destroyCharts() {
  Object.values(state.charts).forEach((chart) => chart.destroy());
  state.charts = {};
}

function renderCanvasFallback(canvasId, data, type) {
  const canvas = document.getElementById(canvasId);
  const parent = canvas.parentElement;
  const rect = parent.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(320, rect.width) * dpr;
  canvas.height = Math.max(220, rect.height) * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#6d6b66";
  ctx.font = "12px Inter, sans-serif";
  if (!data.length) {
    ctx.fillText("No chartable data", 16, 30);
    return;
  }

  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  const max = Math.max(...data.map((item) => Math.abs(item.value)), 1);
  const pad = 34;

  if (type === "bar") {
    data.forEach((item, index) => {
      const barH = (height - pad * 2) / data.length - 8;
      const barW = ((width - pad * 2) * item.value) / max;
      const y = pad + index * (barH + 8);
      ctx.fillStyle = chartPalette[index % chartPalette.length];
      ctx.fillRect(pad, y, barW, barH);
      ctx.fillStyle = "#242424";
      ctx.fillText(item.name, pad, y - 3);
    });
    return;
  }

  if (type === "donut") {
    let start = -Math.PI / 2;
    const total = sum(data.map((item) => item.value)) || 1;
    const cx = width / 2;
    const cy = height / 2;
    data.forEach((item, index) => {
      const angle = (item.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, Math.min(width, height) / 2.5, start, start + angle);
      ctx.fillStyle = chartPalette[index % chartPalette.length];
      ctx.fill();
      start += angle;
    });
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(width, height) / 4, 0, Math.PI * 2);
    ctx.fillStyle = "#fffdf8";
    ctx.fill();
    return;
  }

  ctx.strokeStyle = chartPalette[0];
  ctx.lineWidth = 3;
  ctx.beginPath();
  data.forEach((item, index) => {
    const x = pad + (index / Math.max(1, data.length - 1)) * (width - pad * 2);
    const y = height - pad - (item.value / max) * (height - pad * 2);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function renderInsights() {
  const insights = buildInsights();
  els.insightList.innerHTML = "";
  if (!state.includeNarrative) {
    const li = document.createElement("li");
    li.textContent = "Narrative insights are hidden for this layout.";
    els.insightList.appendChild(li);
    return;
  }
  insights.forEach((insight) => {
    const li = document.createElement("li");
    li.textContent = insight;
    els.insightList.appendChild(li);
  });
}

function renderStrategyPlan() {
  const plan = buildStrategyPlan();
  els.strategyTitle.textContent = plan.title;
  els.strategyMeta.textContent = plan.meta;
  els.strategyGrid.innerHTML = "";
  plan.cards.forEach((card) => {
    const item = document.createElement("section");
    item.className = "strategy-card";
    item.innerHTML = `
      <h3>${escapeHtml(card.title)}</h3>
      <p>${card.body}</p>
    `;
    els.strategyGrid.appendChild(item);
  });
}

function buildStrategyPlan() {
  const rows = getActiveRows();
  const metric = state.metric;
  const dimension = state.dimension;
  const grouped = groupBySum(rows, dimension, metric).sort((a, b) => b.value - a.value);
  const total = sum(grouped.map((item) => item.value));
  const top = grouped[0] || { name: "No leader", value: 0 };
  const second = grouped[1] || top;
  const bottom = grouped[grouped.length - 1] || { name: "No laggard", value: 0 };
  const topShare = total ? (top.value / total) * 100 : 0;
  const top3Share = total ? (sum(grouped.slice(0, 3).map((item) => item.value)) / total) * 100 : 0;
  const integrity = getDataIntegrityStatement(rows);
  const label = getVerticalPreset(state.vertical).label || "Executive";
  const common = {
    leader: escapeHtml(top.name),
    challenger: escapeHtml(second.name),
    laggard: escapeHtml(bottom.name),
    metric: escapeHtml(titleCase(metric)),
    dimension: escapeHtml(titleCase(dimension)),
    topShare: formatNumber(topShare),
    top3Share: formatNumber(top3Share),
    total: escapeHtml(formatMetric(total, metric))
  };

  const playbooks = {
    executive: [
      ["Where to play", `<strong>${common.leader}</strong> leads ${common.dimension} with ${common.topShare}% share of ${common.metric}. Prioritize leadership review around the top contributors before expanding spend.`],
      ["How to win", `Use <strong>${common.challenger}</strong> as the challenger benchmark and compare route-to-market, price, pack, and channel execution against the leader.`],
      ["Governance", `${integrity} Track concentration (${common.top3Share}% in top 3) before making portfolio-level commitments.`]
    ],
    marketing: [
      ["Brand plan", `Build the core brand plan around <strong>${common.leader}</strong>: positioning, priority segments, message architecture, objection handling, and evidence calendar.`],
      ["Campaign design", `Allocate campaigns across awareness, conversion, and retention. Use <strong>${common.laggard}</strong> for turnaround tests only after message-market fit is validated.`],
      ["Measurement", `Use ${common.metric}, active periods, contribution share, and gap-to-leader as monthly brand-plan KPIs.`]
    ],
    strategy: [
      ["Portfolio choices", `Classify brands into grow, defend, fix, and deprioritize. <strong>${common.leader}</strong> is a defend/grow candidate; <strong>${common.laggard}</strong> needs diagnosis.`],
      ["Molecule strategy", `For molecule/company planning, compare leader share, challenger intensity, and pack/form concentration before selecting launch or expansion plays.`],
      ["End-to-end plan", `Translate the opportunity into brand objective, segment target, channel mix, investment ask, field execution, supply readiness, and review cadence.`]
    ],
    presales: [
      ["Opportunity map", `<strong>${common.leader}</strong> and adjacent high-share pockets are the strongest BD proof points. Use low-share but active pockets as whitespace stories.`],
      ["Account narrative", `Frame BD pitches around market size (${common.total}), concentration (${common.top3Share}%), and clear gaps versus the leader.`],
      ["Pipeline action", `Create account lists by ${common.dimension}, rank by ${common.metric}, and prioritize challenger segments for partnership conversations.`]
    ],
    finance: [
      ["Budget allocation", `Use top-share concentration to allocate base budget to proven contributors and reserve test budget for high-potential challengers.`],
      ["Scenario model", `Model three cases: defend leader, accelerate challenger, and fix laggard. Tie spend gates to incremental ${common.metric}.`],
      ["Controls", `${integrity} Budget decisions should be blocked if analysis is sampled and full-data validation is required.`]
    ],
    sales: [
      ["Gap diagnosis", `Use <strong>${common.leader}</strong> as the execution benchmark and <strong>${common.laggard}</strong> as the first gap review candidate.`],
      ["Field priorities", `Translate the leaderboard into territory/account priorities, call focus, objection scripts, and pack-level execution checks.`],
      ["Cadence", `Review latest-period trend, active periods, and rank movement monthly with sales managers.`]
    ],
    supply: [
      ["Demand signal", `<strong>${common.leader}</strong> is the primary demand signal for supply readiness, inventory coverage, and service-level planning.`],
      ["Pack risk", `Monitor pack/product concentration and laggard movement to avoid overstocking weak pockets and under-serving growth pockets.`],
      ["S&OP linkage", `Feed ${common.metric} trend, active IMS periods, and leader/challenger movement into S&OP and production allocation discussions.`]
    ],
    custom: [
      ["Selected view", `The selected view ranks ${common.dimension} by ${common.metric}. <strong>${common.leader}</strong> is the current leader.`],
      ["Action logic", `Compare leader, challenger, and laggard to define where to defend, grow, test, or exit.`],
      ["Integrity", integrity]
    ]
  };

  return {
    title: `${label} strategy plan`,
    meta: `${formatNumber(rows.length)} rows, ${common.metric} by ${common.dimension}`,
    cards: (playbooks[state.vertical] || playbooks.executive).map(([title, body]) => ({ title, body }))
  };
}

function getDataIntegrityStatement(rows) {
  if (!rows.length) return "No row-level evidence is available for this view.";
  if (state.isSampled) return `This is a sampled browser analysis of ${formatNumber(rows.length)} rows; do not present it as full-market truth without full-data processing.`;
  return `This view is based on ${formatNumber(rows.length)} loaded rows from the selected criteria.`;
}

function buildInsights() {
  const metric = state.metric;
  const dimension = state.dimension;
  const rows = getActiveRows();
  const grouped = groupBySum(rows, dimension, metric).sort((a, b) => b.value - a.value);
  const total = sum(grouped.map((item) => item.value));
  const top = grouped[0];
  const bottom = grouped[grouped.length - 1];
  const trend = calculateTrend(rows, state.dateColumn, metric);
  const numericCount = state.profile.numeric.length;
  const dateText = state.dateColumn ? `A ${state.dateColumn} field was detected, so trend exports will include monthly rollups.` : "No date field was detected, so the sequence chart uses row order.";
  const share = top && total ? `${((top.value / total) * 100).toFixed(1)}%` : "0%";
  const top3Share = total ? `${((sum(grouped.slice(0, 3).map((item) => item.value)) / total) * 100).toFixed(1)}%` : "0%";

  if (state.domain === "ims") {
    const activeRows = rows.filter((row) => (parseNumber(row["IMS Active Periods"]) ?? 0) > 0).length;
    const activeShare = rows.length ? `${((activeRows / rows.length) * 100).toFixed(1)}%` : "0%";
    return [
      ...state.analysisNotes.slice(0, 1),
      getRoleGuidance(top, bottom, share, top3Share),
      `${titleCase(metric)} totals ${formatMetric(total, metric)} across ${formatNumber(rows.length)} IMS product records.`,
      top ? `${top.name} is the lead ${titleCase(dimension)} contributor with ${share} of ${titleCase(metric)}.` : `No dominant ${dimension} segment was detected.`,
      `The top 3 ${titleCase(dimension)} contributors represent ${top3Share}, which frames the concentration risk and focus area for review.`,
      `${activeShare} of rows show activity across the detected IMS measure periods.`,
      bottom && top && bottom.name !== top.name ? `${bottom.name} has the lowest contribution in the current view and may need portfolio clean-up, deprioritization, or field validation.` : dateText
    ];
  }

  return [
    ...state.analysisNotes.slice(0, 1),
    getRoleGuidance(top, bottom, share, top3Share),
    `${titleCase(metric)} totals ${formatMetric(total, metric)} across ${formatNumber(rows.length)} records.`,
    top ? `${top.name} leads ${titleCase(dimension)} with ${share} of the selected metric.` : `No dominant ${dimension} segment was detected.`,
    bottom && top && bottom.name !== top.name ? `${bottom.name} is the smallest contributor, useful for pruning or targeted growth tests.` : dateText,
    trend.note ? `${trend.label}: ${trend.note}.` : dateText,
    `${numericCount} numeric fields are available for alternate dashboards and BI measures.`
  ];
}

function getRoleGuidance(top, bottom, share, top3Share) {
  const dimension = titleCase(state.dimension);
  const metric = titleCase(state.metric);
  const leader = top ? top.name : "the leading segment";
  const laggard = bottom ? bottom.name : "the lowest segment";
  const guidance = {
    executive: `${leader} is the board-level performance driver at ${share}; use the top contributors and concentration view to prioritize leadership discussion.`,
    marketing: `${leader} should anchor brand planning, while ${laggard} needs message, channel, pack, or lifecycle review before budget is increased.`,
    presales: `${leader} and adjacent high-share ${dimension} pockets are the strongest BD entry points; low-share pockets can frame whitespace conversations.`,
    finance: `${top3Share} of ${metricSafe(metric)} sits in the top 3 ${dimension} contributors, which is the clearest starting point for budget allocation and variance control.`,
    sales: `${laggard} is the first gap-analysis candidate, while ${leader} should be used as the benchmark for coverage, execution, and territory planning.`,
    custom: `${leader} leads the selected ${dimension} view; compare it with ${laggard} to define the next operating action.`
  };
  return guidance[state.vertical] || guidance.executive;
}

function metricSafe(metric) {
  return metric || "performance";
}

function renderTablePreview() {
  const activeRows = getActiveRows();
  const rows = activeRows.slice(0, 20);
  const columns = getPreviewColumns();
  els.tableMeta.textContent = `${formatNumber(Math.min(20, activeRows.length))} of ${formatNumber(activeRows.length)} rows`;
  els.previewTable.innerHTML = "";
  if (!columns.length) {
    const tbody = document.createElement("tbody");
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.textContent = "No columns detected";
    tr.appendChild(td);
    tbody.appendChild(tr);
    els.previewTable.appendChild(tbody);
    return;
  }
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  columns.forEach((column) => {
    const th = document.createElement("th");
    th.textContent = column;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  els.previewTable.appendChild(thead);

  const tbody = document.createElement("tbody");
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    columns.forEach((column) => {
      const td = document.createElement("td");
      td.textContent = formatCell(row[column]);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  els.previewTable.appendChild(tbody);
}

function getPreviewColumns() {
  if (state.domain === "ims") {
    const preferred = ["BRANDS", "MANUFACT. DESC", "GROUP", "PACK_DESC", "ACUTE_CHRONIC", "IMS Total", "IMS Latest", "IMS Active Periods"];
    const picked = preferred.filter((column) => state.columns.includes(column));
    const fallback = state.columns.filter((column) => !picked.includes(column)).slice(0, Math.max(0, 8 - picked.length));
    return [...picked, ...fallback].slice(0, 8);
  }
  return state.columns.slice(0, 8);
}

function groupBySum(rows, dimension, metric) {
  const map = new Map();
  rows.forEach((row) => {
    const key = String(row[dimension] ?? "Unassigned").trim() || "Unassigned";
    const value = parseNumber(row[metric]) ?? 0;
    map.set(key, (map.get(key) || 0) + value);
  });
  return Array.from(map, ([name, value]) => ({ name, value }));
}

function groupByDate(rows, dateColumn, metric) {
  const map = new Map();
  rows.forEach((row) => {
    const date = parseDate(row[dateColumn]);
    if (!date) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const value = parseNumber(row[metric]) ?? 0;
    map.set(key, (map.get(key) || 0) + value);
  });
  return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));
}

function groupByIndex(rows, metric) {
  const bucketSize = Math.max(1, Math.ceil(rows.length / 16));
  const buckets = [];
  for (let i = 0; i < rows.length; i += bucketSize) {
    const bucket = rows.slice(i, i + bucketSize);
    buckets.push({
      name: `${i + 1}-${i + bucket.length}`,
      value: sum(bucket.map((row) => parseNumber(row[metric]) ?? 0))
    });
  }
  return buckets;
}

function getTrendData(metric) {
  const rows = getActiveRows();
  if (state.domain === "ims" && state.measureColumns.length) return groupByMeasureColumns(rows);
  if (state.dateColumn) return groupByDate(rows, state.dateColumn, metric);
  return groupByIndex(rows, metric);
}

function groupByMeasureColumns(rows) {
  const maxPoints = 18;
  const columns = state.measureColumns;
  const step = Math.max(1, Math.ceil(columns.length / maxPoints));
  const points = [];
  for (let i = 0; i < columns.length; i += step) {
    const slice = columns.slice(i, i + step);
    const value = sum(rows.map((row) => sum(slice.map((column) => parseNumber(row[column]) ?? 0))));
    points.push({
      name: slice.length === 1 ? labelMeasureColumn(slice[0], i) : `${labelMeasureColumn(slice[0], i)}-${labelMeasureColumn(slice[slice.length - 1], i + slice.length - 1)}`,
      value
    });
  }
  return points;
}

function calculateTrend(rows, dateColumn, metric) {
  if (state.domain === "ims" && state.measureColumns.length >= 2) {
    const previousColumn = state.measureColumns[state.measureColumns.length - 2];
    const currentColumn = state.measureColumns[state.measureColumns.length - 1];
    const previous = sum(rows.map((row) => parseNumber(row[previousColumn]) ?? 0));
    const current = sum(rows.map((row) => parseNumber(row[currentColumn]) ?? 0));
    const change = previous === 0 ? 0 : ((current - previous) / Math.abs(previous)) * 100;
    return {
      label: "Latest IMS period",
      value: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
      note: `${labelMeasureColumn(currentColumn, state.measureColumns.length - 1)} vs ${labelMeasureColumn(previousColumn, state.measureColumns.length - 2)}`,
      direction: change >= 0 ? "good" : "bad"
    };
  }
  if (!dateColumn) {
    return { label: "Records", value: formatNumber(rows.length), note: "No date field found", direction: "" };
  }
  const series = groupByDate(rows, dateColumn, metric);
  if (series.length < 2) {
    return { label: "Trend", value: "n/a", note: "Need at least two periods", direction: "" };
  }
  const previous = series[series.length - 2].value;
  const current = series[series.length - 1].value;
  const change = previous === 0 ? 0 : ((current - previous) / Math.abs(previous)) * 100;
  return {
    label: "Latest period",
    value: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
    note: `${series[series.length - 1].name} vs ${series[series.length - 2].name}`,
    direction: change >= 0 ? "good" : "bad"
  };
}

function labelMeasureColumn(column, index) {
  const text = String(column || "").trim();
  if (!text) return `P${index + 1}`;
  if (/^\d{5,6}$/.test(text)) return `P${index + 1}`;
  return text.length > 12 ? `${text.slice(0, 12)}...` : text;
}

async function captureDashboard() {
  if (!window.html2canvas) {
    showToast("Image capture library did not load. Use browser print instead.");
    return null;
  }
  const canvas = await html2canvas(els.dashboardSurface, {
    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--surface").trim() || "#fffdf8",
    scale: 2,
    useCORS: true
  });
  return canvas;
}

async function exportPng() {
  const canvas = await captureDashboard();
  if (!canvas) return;
  downloadBlob(await canvasToBlob(canvas), `${safeFileBase()}-dashboard.png`);
  showToast("PNG downloaded.");
}

async function exportPdf() {
  if (!window.jspdf) {
    window.print();
    showToast("PDF library did not load. Browser print opened.");
    return;
  }
  const canvas = await captureDashboard();
  if (!canvas) return;
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 28;
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let y = margin;
  let remaining = imgHeight;
  const imgData = canvas.toDataURL("image/png", 1);
  pdf.addImage(imgData, "PNG", margin, y, imgWidth, imgHeight);
  remaining -= pageHeight - margin * 2;
  while (remaining > 0) {
    pdf.addPage();
    y = margin - (imgHeight - remaining);
    pdf.addImage(imgData, "PNG", margin, y, imgWidth, imgHeight);
    remaining -= pageHeight - margin * 2;
  }
  pdf.save(`${safeFileBase()}-dashboard.pdf`);
  showToast("PDF downloaded.");
}

async function exportPpt() {
  if (!window.pptxgen) {
    showToast("PowerPoint library did not load. Try HTML or PDF export.");
    return;
  }
  const canvas = await captureDashboard();
  if (!canvas) return;
  const deck = new pptxgen();
  deck.layout = "LAYOUT_WIDE";
  deck.author = "MarketLens IQ";
  deck.subject = "Excel dashboard export";
  deck.title = `${state.fileName} dashboard`;
  deck.company = "MarketLens IQ";
  deck.lang = "en-US";
  deck.theme = {
    headFontFace: "Aptos Display",
    bodyFontFace: "Aptos",
    lang: "en-US"
  };

  const titleSlide = deck.addSlide();
  titleSlide.background = { color: "F9F6EF" };
  titleSlide.addText("MarketLens IQ", { x: 0.55, y: 0.45, w: 2.6, h: 0.25, fontSize: 11, bold: true, color: "007A78" });
  titleSlide.addText(`${titleCase(state.metric)} Performance`, { x: 0.55, y: 1.1, w: 8.5, h: 0.55, fontSize: 32, bold: true, color: "242424" });
  titleSlide.addText(`${state.fileName} - ${formatNumber(getActiveRows().length)} rows analyzed`, { x: 0.55, y: 1.78, w: 8.5, h: 0.35, fontSize: 14, color: "6D6B66" });
  buildInsights().slice(0, 4).forEach((text, index) => {
    titleSlide.addText(text, { x: 0.75, y: 2.65 + index * 0.55, w: 10.6, h: 0.34, fontSize: 14, color: "242424", bullet: { type: "bullet" } });
  });

  const dashboardSlide = deck.addSlide();
  dashboardSlide.background = { color: "FFFDF8" };
  dashboardSlide.addImage({ data: canvas.toDataURL("image/png", 1), x: 0.28, y: 0.22, w: 12.75, h: 7.05 });

  const dataSlide = deck.addSlide();
  dataSlide.background = { color: "F9F6EF" };
  dataSlide.addText("BI handoff", { x: 0.55, y: 0.45, w: 5, h: 0.45, fontSize: 26, bold: true, color: "242424" });
  dataSlide.addText(`Primary metric: ${state.metric}`, { x: 0.6, y: 1.25, w: 5, h: 0.3, fontSize: 14, color: "242424" });
  dataSlide.addText(`Primary dimension: ${state.dimension}`, { x: 0.6, y: 1.65, w: 5, h: 0.3, fontSize: 14, color: "242424" });
  dataSlide.addText(`Date field: ${state.dateColumn || "none"}`, { x: 0.6, y: 2.05, w: 5, h: 0.3, fontSize: 14, color: "242424" });
  const measures = buildBiModel().measures.map((measure) => `${measure.name}: ${measure.expression}`);
  measures.slice(0, 6).forEach((text, index) => {
    dataSlide.addText(text, { x: 6.4, y: 1.15 + index * 0.45, w: 5.9, h: 0.28, fontSize: 12, color: "242424" });
  });

  await deck.writeFile({ fileName: `${safeFileBase()}-dashboard.pptx` });
  showToast("PPT deck downloaded.");
}

function exportCsv() {
  const csv = toCsv(getActiveRows(), state.columns);
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${safeFileBase()}-clean.csv`);
  showToast("CSV downloaded.");
}

function exportBiModel() {
  const model = buildBiModel();
  downloadBlob(new Blob([JSON.stringify(model, null, 2)], { type: "application/json" }), `${safeFileBase()}-bi-model.json`);
  showToast("BI model JSON downloaded.");
}

async function exportHtmlReport() {
  const canvas = await captureDashboard();
  const image = canvas ? canvas.toDataURL("image/png", 1) : "";
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(state.fileName)} dashboard</title>
  <style>
    body{font-family:Inter,Arial,sans-serif;margin:32px;background:#f5f3ef;color:#242424}
    main{max-width:1200px;margin:auto;background:#fffdf8;border:1px solid #ddd8cd;border-radius:8px;padding:24px}
    h1{margin:0 0 8px;font-size:30px} p{color:#6d6b66} img{width:100%;border:1px solid #ddd8cd;border-radius:8px}
    li{margin:10px 0;line-height:1.5}
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(titleCase(state.metric))} Performance</h1>
    <p>${escapeHtml(state.fileName)} - ${formatNumber(getActiveRows().length)} rows</p>
    ${image ? `<img src="${image}" alt="Dashboard snapshot" />` : ""}
    <h2>Analyst notes</h2>
    <ul>${buildInsights().map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  </main>
</body>
</html>`;
  downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), `${safeFileBase()}-report.html`);
  showToast("HTML report downloaded.");
}

function buildBiModel() {
  const rows = getActiveRows();
  const tableName = safeIdentifier(state.selectedSheet || "Data");
  const metric = state.metric;
  const date = state.dateColumn;
  const schema = state.columns.map((column) => ({
    name: column,
    type: state.profile.details[column]?.role || "text",
    role: column === metric ? "metric" : column === state.dimension ? "dimension" : column === date ? "date" : "attribute",
    filled: state.profile.details[column]?.filled || 0,
    unique: state.profile.details[column]?.unique || 0
  }));
  const numeric = state.profile.numeric;
  const measures = numeric.slice(0, 12).flatMap((column) => [
    {
      name: `Total ${column}`,
      expression: `SUM('${tableName}'[${column}])`
    },
    {
      name: `Average ${column}`,
      expression: `AVERAGE('${tableName}'[${column}])`
    }
  ]);

  return {
    app: "MarketLens IQ",
    generatedAt: new Date().toISOString(),
    source: {
      fileName: state.fileName,
      sheet: state.selectedSheet,
      rows: rows.length,
      columns: state.columns.length
    },
    schema,
    measures,
    visuals: [
      { type: "line", title: `${metric} trend`, metric, dimension: date || "row index" },
      { type: "bar", title: `${state.dimension} ranking`, metric, dimension: state.dimension },
      { type: "donut", title: `${state.dimension} mix`, metric, dimension: state.dimension }
    ],
    dataSample: rows.slice(0, 1000)
  };
}

function sheetToRows(sheet) {
  const table = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false
  });
  return tableToObjects(table);
}

async function readLargeXlsxSample(file, maxRows) {
  if (!("DecompressionStream" in window)) {
    throw new Error("This browser does not support streaming Excel decompression.");
  }

  const entries = await readZipDirectory(file);
  const workbookEntry = entries.get("xl/workbook.xml");
  const relsEntry = entries.get("xl/_rels/workbook.xml.rels");
  if (!workbookEntry || !relsEntry) throw new Error("Workbook metadata missing.");

  const workbookXml = parseXml(await readZipEntryText(file, workbookEntry));
  const relsXml = parseXml(await readZipEntryText(file, relsEntry));
  const relMap = new Map(Array.from(relsXml.querySelectorAll("Relationship")).map((rel) => [rel.getAttribute("Id"), rel.getAttribute("Target")]));
  const sheetMeta = Array.from(workbookXml.querySelectorAll("sheet")).map((sheet, index) => {
    const rid = sheet.getAttribute("r:id") || sheet.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
    return {
      name: sheet.getAttribute("name") || `Sheet ${index + 1}`,
      path: normalizeZipPath("xl", relMap.get(rid) || `worksheets/sheet${index + 1}.xml`)
    };
  }).filter((sheet) => entries.has(sheet.path));

  if (!sheetMeta.length) throw new Error("No readable sheets found.");

  const sharedEntry = entries.get("xl/sharedStrings.xml");
  const sharedStrings = sharedEntry ? parseSharedStrings(await readZipEntryText(file, sharedEntry)) : [];
  const sheets = {};
  for (const sheet of sheetMeta.slice(0, 3)) {
    showToast(`Large workbook mode: reading ${sheet.name} sample...`);
    const table = await readSheetRowsStreaming(file, entries.get(sheet.path), sharedStrings, maxRows);
    sheets[sheet.name] = tableToObjects(table);
  }

  return {
    sheetNames: sheetMeta.slice(0, 3).map((sheet) => sheet.name),
    sheets
  };
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

async function readSheetRowsStreaming(file, entry, sharedStrings, maxRows) {
  const rows = [];
  const stream = await zipEntryStream(file, entry);
  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  while (rows.length < maxRows) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let rowEnd = buffer.indexOf("</row>");
    while (rowEnd >= 0 && rows.length < maxRows) {
      const rowStart = buffer.lastIndexOf("<row", rowEnd);
      if (rowStart < 0) {
        buffer = buffer.slice(rowEnd + 6);
        rowEnd = buffer.indexOf("</row>");
        continue;
      }
      const rowXml = buffer.slice(rowStart, rowEnd + 6);
      const parsed = parseSheetRow(rowXml, sharedStrings);
      if (parsed.some((cell) => !isBlank(cell))) rows.push(parsed);
      buffer = buffer.slice(rowEnd + 6);
      rowEnd = buffer.indexOf("</row>");
    }
    if (rows.length && rows.length % 500 === 0) {
      showToast(`Large workbook mode: ${formatNumber(rows.length)} rows sampled...`);
    }
    if (buffer.length > 25000000) {
      const lastRowStart = buffer.lastIndexOf("<row");
      buffer = lastRowStart > 0 ? buffer.slice(lastRowStart) : buffer.slice(-1000000);
    }
  }

  try {
    await reader.cancel();
  } catch (error) {
    // The stream can already be closed after natural completion.
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
    if (type === "inlineStr") {
      value = decodeXmlText((body.match(/<t[^>]*>([\s\S]*?)<\/t>/) || [])[1] || "");
    } else {
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
  return String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
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

function tableToObjects(table) {
  const nonEmptyRows = table.filter((row) => row.some((cell) => !isBlank(cell)));
  if (!nonEmptyRows.length) return [];

  let headerIndex = 0;
  let bestScore = -Infinity;
  nonEmptyRows.slice(0, 15).forEach((row, index) => {
    const cells = row.map((cell) => String(cell ?? "").trim()).filter(Boolean);
    const unique = new Set(cells.map((cell) => normalize(cell))).size;
    const numericCells = cells.filter((cell) => parseNumber(cell) !== null).length;
    const score = cells.length * 2 + unique - numericCells * 0.7 - index * 0.1;
    if (cells.length >= 2 && score > bestScore) {
      bestScore = score;
      headerIndex = index;
    }
  });

  const headers = uniquifyHeaders(nonEmptyRows[headerIndex].map((cell, index) => {
    const label = String(cell ?? "").trim();
    return label || `Column ${index + 1}`;
  }));

  return nonEmptyRows.slice(headerIndex + 1).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = coerceCell(row[index] ?? "");
    });
    return record;
  });
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

function isBlank(value) {
  return String(value ?? "").trim() === "";
}

function parseDelimited(text, delimiter) {
  const rows = [];
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim() !== "");
  if (!lines.length) return rows;
  const headers = parseDelimitedLine(lines[0], delimiter).map((header, index) => header.trim() || `Column ${index + 1}`);
  for (let i = 1; i < lines.length; i += 1) {
    const values = parseDelimitedLine(lines[i], delimiter);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = coerceCell(values[index] ?? "");
    });
    rows.push(row);
  }
  return rows;
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
  return items.map((item) => {
    if (item && typeof item === "object" && !Array.isArray(item)) return flattenObject(item);
    return { Value: item };
  });
}

function flattenObject(input, prefix = "", output = {}) {
  Object.entries(input || {}).forEach(([key, value]) => {
    const name = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      flattenObject(value, name, output);
    } else {
      output[name] = Array.isArray(value) ? value.join(", ") : coerceCell(value);
    }
  });
  return output;
}

function parseSqlDump(text) {
  const maxRows = 50000;
  const tables = {};
  const schemas = parseSqlSchemas(text);
  const insertPattern = /insert\s+into\s+[`"\[]?([\w.\- ]+)[`"\]]?\s*(?:\(([^)]*)\))?\s*values\s*([\s\S]*?);/gi;
  let match;
  let totalRows = 0;
  let sampled = false;

  while ((match = insertPattern.exec(text))) {
    const tableName = cleanSqlIdentifier(match[1]) || "SQL data";
    const explicitColumns = match[2] ? splitSqlCsv(match[2]).map(cleanSqlIdentifier) : null;
    const valuesBlock = match[3];
    const tuples = extractSqlTuples(valuesBlock);
    if (!tables[tableName]) tables[tableName] = [];
    tuples.forEach((tuple) => {
      if (totalRows >= maxRows) {
        sampled = true;
        return;
      }
      const values = splitSqlCsv(tuple).map(sqlValue);
      const columns = explicitColumns || schemas[tableName] || values.map((_, index) => `Column ${index + 1}`);
      const row = {};
      columns.forEach((column, index) => {
        row[column || `Column ${index + 1}`] = values[index] ?? "";
      });
      tables[tableName].push(row);
      totalRows += 1;
    });
  }

  if (!Object.keys(tables).length) {
    const rows = parseDelimited(text, detectDelimiter(text));
    tables["SQL/text data"] = rows;
  }

  return {
    tables,
    sheetNames: Object.keys(tables),
    isSampled: sampled,
    rowLimit: sampled ? maxRows : 0
  };
}

function parseSqlSchemas(text) {
  const schemas = {};
  const createPattern = /create\s+table\s+[`"\[]?([\w.\- ]+)[`"\]]?\s*\(([\s\S]*?)\);/gi;
  let match;
  while ((match = createPattern.exec(text))) {
    const tableName = cleanSqlIdentifier(match[1]);
    const columns = [];
    splitSqlDefinitions(match[2]).forEach((definition) => {
      const first = definition.trim().match(/^[`"\[]?([\w.\- ]+)[`"\]]?/);
      if (!first) return;
      const column = cleanSqlIdentifier(first[1]);
      if (!/^(primary|foreign|unique|constraint|key|index|check)$/i.test(column)) columns.push(column);
    });
    if (columns.length) schemas[tableName] = columns;
  }
  return schemas;
}

function splitSqlDefinitions(text) {
  const parts = [];
  let current = "";
  let depth = 0;
  let quote = "";
  for (const char of text) {
    if (quote) {
      current += char;
      if (char === quote) quote = "";
      continue;
    }
    if (char === "'" || char === "\"" || char === "`") {
      quote = char;
      current += char;
      continue;
    }
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current);
  return parts;
}

function extractSqlTuples(valuesBlock) {
  const tuples = [];
  let depth = 0;
  let quote = "";
  let current = "";
  for (let i = 0; i < valuesBlock.length; i += 1) {
    const char = valuesBlock[i];
    const next = valuesBlock[i + 1];
    if (quote) {
      if (char === "\\" && next) {
        current += char + next;
        i += 1;
        continue;
      }
      if (char === quote && next === quote) {
        current += char + next;
        i += 1;
        continue;
      }
      if (char === quote) quote = "";
      current += char;
      continue;
    }
    if (char === "'" || char === "\"") {
      quote = char;
      current += char;
      continue;
    }
    if (char === "(") {
      if (depth > 0) current += char;
      depth += 1;
      continue;
    }
    if (char === ")") {
      depth -= 1;
      if (depth === 0) {
        tuples.push(current);
        current = "";
      } else {
        current += char;
      }
      continue;
    }
    if (depth > 0) current += char;
  }
  return tuples;
}

function splitSqlCsv(text) {
  const output = [];
  let current = "";
  let quote = "";
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quote) {
      if (char === "\\" && next) {
        current += next;
        i += 1;
        continue;
      }
      if (char === quote && next === quote) {
        current += quote;
        i += 1;
        continue;
      }
      if (char === quote) {
        quote = "";
      } else {
        current += char;
      }
      continue;
    }
    if (char === "'" || char === "\"" || char === "`") {
      quote = char;
      continue;
    }
    if (char === ",") {
      output.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  output.push(current.trim());
  return output;
}

function sqlValue(value) {
  const trimmed = String(value ?? "").trim();
  if (/^null$/i.test(trimmed)) return "";
  if (/^(true|false)$/i.test(trimmed)) return /^true$/i.test(trimmed);
  return coerceCell(trimmed);
}

function cleanSqlIdentifier(value) {
  return String(value || "").replace(/^[`"\[]|[`"\]]$/g, "").trim();
}

function parseDelimitedLine(line, delimiter) {
  const output = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      output.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }
  output.push(cell);
  return output;
}

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/)[0] || "";
  const comma = (firstLine.match(/,/g) || []).length;
  const tab = (firstLine.match(/\t/g) || []).length;
  const semicolon = (firstLine.match(/;/g) || []).length;
  if (tab > comma && tab > semicolon) return "\t";
  if (semicolon > comma) return ";";
  return ",";
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

function parseDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const text = String(value ?? "").trim();
  if (!text || /^\d+(\.\d+)?$/.test(text)) return null;
  if (!/[/-]/.test(text) && !/[a-zA-Z]{3,}/.test(text)) return null;
  const time = Date.parse(text);
  if (Number.isNaN(time)) return null;
  const date = new Date(time);
  if (date.getFullYear() < 1970 || date.getFullYear() > 2100) return null;
  return date;
}

function toCsv(rows, columns) {
  const lines = [columns.map(csvEscape).join(",")];
  rows.forEach((row) => {
    lines.push(columns.map((column) => csvEscape(formatCell(row[column]))).join(","));
  });
  return lines.join("\n");
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function safeFileBase() {
  return (state.fileName || "marketlens")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "marketlens";
}

function safeIdentifier(value) {
  return String(value || "Data").replace(/'/g, "").slice(0, 64);
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function titleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\w\S*/g, (text) => text.charAt(0).toUpperCase() + text.slice(1));
}

function sum(values) {
  return values.reduce((acc, value) => acc + (Number(value) || 0), 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(Number(value) || 0);
}

function formatMetric(value, columnName) {
  const name = normalize(columnName);
  const abs = Math.abs(Number(value) || 0);
  const compact = abs >= 1000000 || abs >= 10000;
  const currency = /(revenue|sales|amount|profit|cost|price|value)/.test(name) && state.domain !== "ims";
  const options = compact ? { notation: "compact", maximumFractionDigits: 1 } : { maximumFractionDigits: abs < 100 ? 1 : 0 };
  if (currency) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", ...options }).format(Number(value) || 0);
  }
  return new Intl.NumberFormat("en-US", options).format(Number(value) || 0);
}

function formatCell(value) {
  if (value instanceof Date) return localDateKey(value);
  if (typeof value === "number") return String(value);
  return String(value ?? "");
}

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function hydrateIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("is-visible"), 2600);
}

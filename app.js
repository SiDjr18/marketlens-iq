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
  measureColumns: [],
  pharmaMeasures: {
    matValueColumns: [],
    monthlyValueColumns: [],
    unitColumns: [],
    volumeColumns: [],
    valueColumns: []
  },
  uploadMeta: {
    rowsProcessed: 0,
    skippedRows: 0,
    totalRows: 0,
    mode: "idle"
  },
  dataHealth: {
    confidence: 0,
    missingFields: [],
    mappedCount: 0,
    requiredCount: 0,
    duplicateRows: 0,
    numericSuccess: 0,
    dateDetected: false,
    outlierCount: 0,
    status: "blocked"
  },
  columnMap: {},
  strategicFilters: {
    marketType: [],
    companyType: [],
    productType: [],
    brand: [],
    therapy: [],
    molecule: [],
    company: []
  },
  brandPlanGenerated: false
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
    "uploadProgress",
    "uploadProgressBar",
    "uploadStatus",
    "loadDemoData",
    "verticalSelect",
    "sheetSelect",
    "metricSelect",
    "dimensionSelect",
    "dateSelect",
    "filterSelect",
    "filterMarketType",
    "filterCompanyType",
    "filterProductType",
    "filterBrand",
    "filterTherapy",
    "filterMolecule",
    "filterCompany",
    "filterMarketTypeChips",
    "filterCompanyTypeChips",
    "filterProductTypeChips",
    "filterBrandChips",
    "filterTherapyChips",
    "filterMoleculeChips",
    "filterCompanyChips",
    "clearStrategicFilters",
    "generateBrandPlan",
    "mappingWarnings",
    "mapBrand",
    "mapTherapy",
    "mapMolecule",
    "mapCompany",
    "mapMarketType",
    "mapCompanyType",
    "mapProductType",
    "mapMatSales",
    "mapMonthlySales",
    "mapUnitSales",
    "mapVolumeSales",
    "mapValueSales",
    "topNSelect",
    "activeOnly",
    "themeSelect",
    "includeNarrative",
    "dashboardTitle",
    "dataSourceLabel",
    "summaryHeadline",
    "healthScore",
    "activeFilterRibbon",
    "dataHealthGate",
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
    "positioningMeta",
    "positioningGrid",
    "heatMapMeta",
    "heatMapGrid",
    "frameworkMeta",
    "frameworkGrid",
    "verticalPlanMeta",
    "verticalPlanGrid",
    "brandPlanMeta",
    "brandPlanOutput",
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
  els.navTabs = Array.from(document.querySelectorAll("[data-target]"));
  els.exportTriggers = Array.from(document.querySelectorAll("[data-export-trigger]"));
}

function bindEvents() {
  els.fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) handleFile(file);
  });

  els.loadDemoData.addEventListener("click", () => loadDemoDataset());

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

  getStrategicFilterConfig().forEach(({ role, id }) => {
    els[id].addEventListener("change", () => {
      state.strategicFilters[role] = getSelectedValues(els[id]);
      updateStrategicFilterOptions(role);
      renderDashboard();
    });
    const chipContainer = els[`${id}Chips`];
    chipContainer.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter-value]");
      if (!button || button.disabled) return;
      toggleStrategicFilter(role, button.dataset.filterValue);
      updateStrategicFilterOptions(role);
      renderDashboard();
    });
  });

  getMappingConfig().forEach(({ role, id }) => {
    els[id].addEventListener("change", () => {
      state.columnMap[role] = els[id].value;
      state.filterValue = "__all__";
      if (role === "valueSales" || role === "matSales" || role === "monthlySales" || role === "unitSales" || role === "volumeSales") {
        state.metric = getPreferredMetric();
      }
      if (role === "brand" || role === "therapy" || role === "molecule" || role === "company") {
        state.dimension = state.columnMap[role] || state.dimension;
      }
      clearInvalidStrategicFilters();
      updateControls();
      renderDashboard();
      showToast("Column mapping updated.");
    });
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

  els.navTabs.forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.target);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  els.exportTriggers.forEach((button) => {
    button.addEventListener("click", () => {
      const target = els[button.dataset.exportTrigger];
      if (target) target.click();
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
    clearStrategicFilterState();
    state.brandPlanGenerated = false;
    applyVerticalPreset();
    updateControls();
    renderDashboard();
    showToast("Criteria reset.");
  });

  els.clearStrategicFilters.addEventListener("click", () => {
    clearStrategicFilterState();
    updateControls();
    renderDashboard();
    showToast("Strategic filters cleared.");
  });

  els.generateBrandPlan.addEventListener("click", () => {
    if (!canGenerateStrategy()) {
      showToast("Fix column mapping/data health before generating a brand plan.");
      return;
    }
    state.brandPlanGenerated = true;
    renderBrandPlan();
    showToast("Brand plan generated from selected data.");
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

function loadDemoDataset() {
  const rows = buildDemoDataset();
  state.workbook = { "Demo pharma market": rows };
  state.sheetNames = ["Demo pharma market"];
  state.selectedSheet = "Demo pharma market";
  state.fileName = "Demo pharma market";
  state.isSampled = false;
  state.rowLimit = 0;
  state.uploadMeta = { rowsProcessed: rows.length, skippedRows: 0, totalRows: rows.length, mode: "demo" };
  finishUploadProgress("Demo dataset loaded. Replace it with your IMS/IQVIA file for real analysis.");
  setRows(rows);
  showToast("Demo pharma dataset loaded.");
}

function buildDemoDataset() {
  const therapies = ["CARDIAC", "ANTI DIABETIC", "RESPIRATORY", "PAIN / ANALGESICS", "UROLOGY", "GASTRO INTESTINAL"];
  const companies = [
    ["Aster Pharma", "MNC"],
    ["Cipla Demo", "Indian"],
    ["Novexa Health", "MNC"],
    ["Intas Demo", "Indian"],
    ["Glenmark Demo", "Indian"],
    ["Torrent Demo", "Indian"]
  ];
  const rows = [];
  therapies.forEach((therapy, therapyIndex) => {
    companies.forEach(([company, companyType], companyIndex) => {
      for (let brandIndex = 1; brandIndex <= 3; brandIndex += 1) {
        const base = 1200 + therapyIndex * 260 + companyIndex * 140 + brandIndex * 95;
        const growth = 0.94 + therapyIndex * 0.012 + brandIndex * 0.018;
        const previous = Math.round(base * growth);
        const current = Math.round(previous * (1.03 + companyIndex * 0.006 - therapyIndex * 0.002));
        const units = Math.round(current / (12 + brandIndex + companyIndex));
        const volume = Math.round(units * (1.1 + brandIndex * 0.08));
        rows.push({
          BRANDS: `${therapy.split(" ")[0]} Brand ${brandIndex}`,
          "MANUFACT. DESC": company,
          COMPANY: company,
          INDIAN_MNC: companyType,
          ACUTE_CHRONIC: ["Chronic", "Chronic", "Acute", "Acute", "Chronic", "Acute"][therapyIndex],
          "Plain/Combination": brandIndex % 2 ? "Plain" : "Combination",
          GROUP: therapy,
          SUBGROUP: `${therapy} Sub ${brandIndex}`,
          MOLECULE_DESC: `${therapy.split(" ")[0]} Molecule ${brandIndex}`,
          PACK_DESC: `${brandIndex * 10} TAB`,
          "NI MAT MAY'24": previous,
          "NI MAT MAY'25": current,
          "NI MONTH MAY'24": Math.round(previous / 12),
          "NI MONTH MAY'25": Math.round(current / 12),
          "UNIT MAY'24": Math.round(units * 0.96),
          "UNIT MAY'25": units,
          "VOLUME MAY'24": Math.round(volume * 0.95),
          "VOLUME MAY'25": volume
        });
      }
    });
  });
  return rows;
}

async function handleFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  resetUploadProgress(`Preparing ${file.name}...`);
  try {
    if (canUseWorkerFor(file, ext)) {
      try {
        const parsed = await ingestFileWithWorker(file);
        state.workbook = parsed.tables;
        state.sheetNames = parsed.sheetNames;
        state.selectedSheet = parsed.sheetNames[0];
        state.isSampled = false;
        state.rowLimit = 0;
        state.uploadMeta = parsed.meta || state.uploadMeta;
      } catch (workerError) {
        if (ext === "xlsx" && shouldUseLargeWorkbookMode(file)) throw workerError;
        showToast("Worker unavailable; using main-thread full parser.");
        await ingestFileOnMainThread(file, ext);
      }
    } else if (["csv", "tsv"].includes(ext)) {
      await ingestFileOnMainThread(file, ext);
    } else if (["json", "sql"].includes(ext)) {
      await ingestFileOnMainThread(file, ext);
    } else {
      const largeMode = shouldUseLargeWorkbookMode(file);
      if (!window.XLSX && !largeMode) {
        showToast("Excel parser did not load. Try CSV or connect to the internet.");
        return;
      }
      if (largeMode) {
        showToast("Full workbook streaming needs browser worker support. Try Chrome/Edge or export as CSV.");
        throw new Error("Worker streaming unavailable.");
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, {
          type: "array",
          cellDates: true,
          raw: false
        });
        state.isSampled = false;
        state.rowLimit = 0;
        const sheets = {};
        workbook.SheetNames.forEach((sheetName) => {
          sheets[sheetName] = sheetToRows(workbook.Sheets[sheetName]);
        });
        if (Object.values(sheets).every((rows) => !rows.length) && /\.xlsx$/i.test(file.name) && "DecompressionStream" in window) {
          const parsed = await ingestFileWithWorker(file);
          state.workbook = parsed.tables;
          state.sheetNames = parsed.sheetNames;
          state.selectedSheet = parsed.sheetNames[0];
          state.isSampled = false;
          state.rowLimit = 0;
          state.uploadMeta = parsed.meta || state.uploadMeta;
        } else {
          state.workbook = sheets;
          state.sheetNames = workbook.SheetNames;
          state.selectedSheet = workbook.SheetNames[0];
        }
      }
    }
    state.fileName = file.name;
    setRows(state.workbook[state.selectedSheet] || []);
    finishUploadProgress(`${file.name} fully imported.`);
    showToast(`${file.name} imported with full-file processing.`);
  } catch (error) {
    console.error(error);
    finishUploadProgress("Import failed. Check file format or try CSV.");
    showToast("Could not read that file. Check the format and try again.");
  } finally {
    els.fileInput.value = "";
  }
}

async function ingestFileOnMainThread(file, ext) {
  if (["csv", "tsv"].includes(ext)) {
    const text = await file.text();
    const delimiter = ext === "tsv" ? "\t" : detectDelimiter(text);
    const rows = parseDelimited(text, delimiter);
    state.workbook = { [file.name]: rows };
    state.sheetNames = [file.name];
    state.selectedSheet = file.name;
    state.isSampled = false;
    state.rowLimit = 0;
    state.uploadMeta = { rowsProcessed: rows.length, skippedRows: 0, totalRows: rows.length, mode: "main-thread" };
    return;
  }
  if (ext === "json") {
    const rows = parseJsonData(await file.text());
    state.workbook = { [file.name]: rows };
    state.sheetNames = [file.name];
    state.selectedSheet = file.name;
    state.isSampled = false;
    state.rowLimit = 0;
    state.uploadMeta = { rowsProcessed: rows.length, skippedRows: 0, totalRows: rows.length, mode: "main-thread" };
    return;
  }
  if (ext === "sql") {
    const parsed = parseSqlDump(await file.text());
    state.workbook = parsed.tables;
    state.sheetNames = parsed.sheetNames;
    state.selectedSheet = parsed.sheetNames[0];
    state.isSampled = false;
    state.rowLimit = 0;
    state.uploadMeta = { rowsProcessed: Object.values(parsed.tables).reduce((acc, rows) => acc + rows.length, 0), skippedRows: 0, totalRows: 0, mode: "main-thread" };
  }
}

function canUseWorkerFor(file, ext) {
  if (!window.Worker) return false;
  if (["csv", "tsv", "json", "sql"].includes(ext)) return true;
  return ext === "xlsx" && "DecompressionStream" in window && shouldUseLargeWorkbookMode(file);
}

function ingestFileWithWorker(file) {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./ingestion-worker.js?v=20260426-full-engine");
    worker.onmessage = (event) => {
      const message = event.data || {};
      if (message.type === "progress") updateUploadProgress(message);
      if (message.type === "done") {
        worker.terminate();
        resolve(message.payload);
      }
      if (message.type === "error") {
        worker.terminate();
        reject(new Error(message.error || "Worker ingestion failed."));
      }
    };
    worker.onerror = (error) => {
      worker.terminate();
      reject(error instanceof Error ? error : new Error(error.message || "Worker ingestion failed."));
    };
    worker.postMessage({ file });
  });
}

function resetUploadProgress(status) {
  state.uploadMeta = { rowsProcessed: 0, skippedRows: 0, totalRows: 0, mode: "loading" };
  updateUploadProgress({ status, rowsProcessed: 0, skippedRows: 0, totalRows: 0, percent: 4 });
}

function updateUploadProgress(message) {
  const percent = Math.max(0, Math.min(100, Math.round(message.percent || 0)));
  state.uploadMeta = {
    rowsProcessed: message.rowsProcessed || state.uploadMeta.rowsProcessed || 0,
    skippedRows: message.skippedRows || state.uploadMeta.skippedRows || 0,
    totalRows: message.totalRows || state.uploadMeta.totalRows || 0,
    mode: message.mode || state.uploadMeta.mode || "loading"
  };
  if (els.uploadProgressBar) els.uploadProgressBar.style.width = `${percent}%`;
  if (els.uploadStatus) {
    const rows = state.uploadMeta.rowsProcessed ? ` ${formatNumber(state.uploadMeta.rowsProcessed)} rows processed` : "";
    const skipped = state.uploadMeta.skippedRows ? `, ${formatNumber(state.uploadMeta.skippedRows)} skipped` : "";
    els.uploadStatus.textContent = `${message.status || "Processing..."}${rows}${skipped}`;
  }
}

function finishUploadProgress(status) {
  if (els.uploadProgressBar) els.uploadProgressBar.style.width = "100%";
  if (els.uploadStatus) els.uploadStatus.textContent = status;
}

function setRows(rows) {
  state.analysisNotes = [];
  state.rows = enrichRowsForAnalysis(rows.filter((row) => Object.values(row).some((value) => String(value ?? "").trim() !== "")));
  state.columns = getColumns(state.rows);
  state.profile = profileColumns(state.rows, state.columns);
  state.columnMap = autoMapColumns();
  state.dataHealth = computeDataHealth();
  clearInvalidStrategicFilters();
  state.brandPlanGenerated = false;
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
  state.pharmaMeasures = {
    matValueColumns: [],
    monthlyValueColumns: [],
    unitColumns: [],
    volumeColumns: [],
    valueColumns: []
  };
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
  const numericMeasureColumns = columns.filter((column) => {
    if (descriptorColumns.has(column) || idColumns.has(column)) return false;
    const details = profileSingleColumn(rows, column);
    return details.numericScore > 0.72;
  });

  state.pharmaMeasures = classifyPharmaMeasureColumns(numericMeasureColumns);
  state.measureColumns = state.pharmaMeasures.valueColumns;
  if (!numericMeasureColumns.length) {
    state.analysisNotes.push("IMS structure detected, but no numeric matrix columns were found.");
    return rows;
  }

  const enriched = rows.map((row) => {
    const mat = latestPairValue(row, state.pharmaMeasures.matValueColumns);
    const monthly = latestPairValue(row, state.pharmaMeasures.monthlyValueColumns);
    const unit = latestPairValue(row, state.pharmaMeasures.unitColumns);
    const volume = latestPairValue(row, state.pharmaMeasures.volumeColumns);
    const activeValues = numericMeasureColumns.map((column) => parseNumber(row[column]) ?? 0);
    const value = mat.current || monthly.current;
    const previousValue = mat.previous || monthly.previous;
    const growth = previousValue ? ((value - previousValue) / Math.abs(previousValue)) * 100 : 0;
    const priceBase = unit.current || volume.current;
    return {
      ...row,
      "MAT Value": mat.current,
      "Previous MAT Value": mat.previous,
      "Monthly Value": monthly.current,
      "Previous Monthly Value": monthly.previous,
      "Value Sales": value,
      "Unit Sales": unit.current,
      "Previous Unit Sales": unit.previous,
      "Volume Sales": volume.current,
      "Previous Volume Sales": volume.previous,
      "Growth %": growth,
      "Price Proxy": priceBase ? value / priceBase : 0,
      "IMS Active Periods": activeValues.filter((value) => value !== 0).length
    };
  });

  state.analysisNotes.push(`IMS matrix detected; ${formatNumber(numericMeasureColumns.length)} numeric period columns classified into value, MAT, monthly, unit, and volume measures without combining unrelated metrics.`);
  return enriched;
}

function classifyPharmaMeasureColumns(columns) {
  const cleanColumns = columns.filter(Boolean);
  const byToken = (patterns) => cleanColumns.filter((column) => patterns.some((pattern) => pattern.test(normalize(column))));
  const unitColumns = byToken([/unit/, /qty/, /quantity/, /packunit/]);
  const volumeColumns = byToken([/volume/, /\bvol\b/, /kg/, /litre/, /liter/]);
  const matValueColumns = byToken([/mat/, /movingannual/]).filter((column) => !unitColumns.includes(column) && !volumeColumns.includes(column));
  const monthlyValueColumns = cleanColumns.filter((column) => {
    const text = normalize(column);
    if (unitColumns.includes(column) || volumeColumns.includes(column) || matValueColumns.includes(column)) return false;
    return /month|mth|mon|latest|sales|value|revenue|ni/.test(text);
  });
  const valueColumns = matValueColumns.length ? matValueColumns : monthlyValueColumns.length ? monthlyValueColumns : cleanColumns.filter((column) => !unitColumns.includes(column) && !volumeColumns.includes(column));
  return {
    matValueColumns: sortPeriodColumns(matValueColumns),
    monthlyValueColumns: sortPeriodColumns(monthlyValueColumns),
    unitColumns: sortPeriodColumns(unitColumns),
    volumeColumns: sortPeriodColumns(volumeColumns),
    valueColumns: sortPeriodColumns(valueColumns)
  };
}

function sortPeriodColumns(columns) {
  return [...columns].sort((a, b) => getPeriodSortKey(a) - getPeriodSortKey(b));
}

function getPeriodSortKey(column) {
  const text = String(column || "").toUpperCase();
  const yearMatch = text.match(/(?:'|20)?(\d{2})(?!\d)/g);
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const monthIndex = monthNames.findIndex((month) => text.includes(month));
  const yearToken = yearMatch?.[yearMatch.length - 1] || "";
  const year = yearToken ? Number(yearToken.replace(/[^0-9]/g, "")) : 0;
  const fullYear = year < 70 ? 2000 + year : 1900 + year;
  return fullYear * 12 + Math.max(0, monthIndex);
}

function latestPairValue(row, columns) {
  if (!columns.length) return { current: 0, previous: 0 };
  const currentColumn = columns[columns.length - 1];
  const previousColumn = columns[columns.length - 2] || "";
  return {
    current: parseNumber(row[currentColumn]) ?? 0,
    previous: previousColumn ? parseNumber(row[previousColumn]) ?? 0 : 0
  };
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
    ? ["valuesales", "matvalue", "monthlyvalue", "growth", "revenue", "sales", "value", "total"]
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
  const imsMetrics = ["valuesales", "matvalue", "monthlyvalue", "growth", "priceproxy", "imsactiveperiods"];
  const presets = {
    executive: {
      label: "Executive",
      metricRank: state.domain === "ims" ? imsMetrics : ["revenue", "sales", "profit", "amount", "value", "total"],
      dimensionRank: state.domain === "ims" ? ["brands", "manufactdesc", "group", "acutechronic"] : ["region", "segment", "category", "product", "channel"]
    },
    marketing: {
      label: "Marketing",
      metricRank: state.domain === "ims" ? ["valuesales", "matvalue", "monthlyvalue", "growth"] : ["revenue", "sales", "orders", "value"],
      dimensionRank: state.domain === "ims" ? ["brands", "packdesc", "nfc", "acutechronic"] : ["product", "brand", "category", "channel", "campaign"]
    },
    presales: {
      label: "Pre-sales & BD",
      metricRank: state.domain === "ims" ? ["growth", "valuesales", "matvalue", "monthlyvalue"] : ["value", "revenue", "sales", "amount"],
      dimensionRank: state.domain === "ims" ? ["group", "manufactdesc", "nfc", "brands"] : ["market", "segment", "region", "industry", "account"]
    },
    finance: {
      label: "Finance",
      metricRank: state.domain === "ims" ? ["valuesales", "matvalue", "monthlyvalue", "priceproxy"] : ["profit", "cost", "revenue", "budget", "amount"],
      dimensionRank: state.domain === "ims" ? ["manufactdesc", "group", "brands", "acutechronic"] : ["department", "region", "category", "costcenter"]
    },
    sales: {
      label: "Sales",
      metricRank: state.domain === "ims" ? ["monthlyvalue", "valuesales", "matvalue", "growth"] : ["revenue", "sales", "orders", "pipeline"],
      dimensionRank: state.domain === "ims" ? ["manufactdesc", "brands", "group", "packdesc"] : ["region", "salesrep", "account", "territory", "product"]
    },
    supply: {
      label: "Supply Chain",
      metricRank: state.domain === "ims" ? ["unitsales", "volumesales", "monthlyvalue", "valuesales"] : ["orders", "demand", "sales", "quantity", "stock"],
      dimensionRank: state.domain === "ims" ? ["packdesc", "brands", "manufactdesc", "nfc"] : ["product", "sku", "warehouse", "region", "vendor"]
    },
    strategy: {
      label: "Brand Strategy",
      metricRank: state.domain === "ims" ? ["valuesales", "matvalue", "growth", "monthlyvalue"] : ["revenue", "sales", "profit", "value"],
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
  updateMappingControls();
  updateStrategicFilterOptions();
  renderMappingWarnings();
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
  rows = applyStrategicFilters(rows);
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

function getStrategicFilterConfig() {
  return [
    { role: "marketType", id: "filterMarketType", label: "Market type", limit: 12 },
    { role: "companyType", id: "filterCompanyType", label: "Company type", limit: 12 },
    { role: "productType", id: "filterProductType", label: "Product type", limit: 12 },
    { role: "brand", id: "filterBrand", label: "Brand", limit: 36 },
    { role: "therapy", id: "filterTherapy", label: "Therapy", limit: 36 },
    { role: "molecule", id: "filterMolecule", label: "Molecule", limit: 36 },
    { role: "company", id: "filterCompany", label: "Company / competitor", limit: 36 }
  ];
}

function getMappingConfig() {
  return [
    { role: "brand", id: "mapBrand", label: "Brand", aliases: ["brands", "brand", "productname", "product"] },
    { role: "therapy", id: "mapTherapy", label: "Therapy", aliases: ["therapy", "supergroup", "group", "subgroup", "therapeuticclass", "market"] },
    { role: "molecule", id: "mapMolecule", label: "Molecule", aliases: ["moleculedesc", "molecule", "composition", "generic"] },
    { role: "company", id: "mapCompany", label: "Company", aliases: ["manufactdesc", "company", "manufacturer", "corporation", "marketer"] },
    { role: "marketType", id: "mapMarketType", label: "Market type", aliases: ["acutechronic", "markettype", "acute", "chronic"] },
    { role: "companyType", id: "mapCompanyType", label: "Company type", aliases: ["indianmnc", "companytype", "ownership", "mnc"] },
    { role: "productType", id: "mapProductType", label: "Product type", aliases: ["plaincombination", "plain", "combination", "producttype"] },
    { role: "matSales", id: "mapMatSales", label: "MAT sales", aliases: ["matvalue", "mat", "movingannualtotal"] },
    { role: "monthlySales", id: "mapMonthlySales", label: "Monthly sales", aliases: ["monthlyvalue", "monthlysales", "monthsales", "latest"] },
    { role: "unitSales", id: "mapUnitSales", label: "Unit sales", aliases: ["unitsales", "unit", "units", "qty", "quantity"] },
    { role: "volumeSales", id: "mapVolumeSales", label: "Volume sales", aliases: ["volumesales", "volume", "vol", "kg", "litre", "liter"] },
    { role: "valueSales", id: "mapValueSales", label: "Value sales", aliases: ["valuesales", "value", "sales", "revenue", "amount", "matvalue"] }
  ];
}

function autoMapColumns() {
  const map = {};
  const numeric = state.profile?.numeric || [];
  const allColumns = state.columns || [];
  getMappingConfig().forEach(({ role, aliases }) => {
    const pool = isMeasureRole(role) ? [...numeric, ...allColumns] : allColumns;
    map[role] = pickByRank(pool, aliases) || "";
  });
  if (!map.company && allColumns.includes("MANUFACT. DESC")) map.company = "MANUFACT. DESC";
  if (!map.brand && allColumns.includes("BRANDS")) map.brand = "BRANDS";
  if (!map.therapy && allColumns.includes("GROUP")) map.therapy = "GROUP";
  if (!map.molecule && allColumns.includes("MOLECULE_DESC")) map.molecule = "MOLECULE_DESC";
  if (!map.marketType && allColumns.includes("ACUTE_CHRONIC")) map.marketType = "ACUTE_CHRONIC";
  if (!map.companyType && allColumns.includes("INDIAN_MNC")) map.companyType = "INDIAN_MNC";
  if (!map.productType && allColumns.includes("Plain/Combination")) map.productType = "Plain/Combination";
  if (!map.matSales && allColumns.includes("MAT Value")) map.matSales = "MAT Value";
  if (!map.monthlySales && allColumns.includes("Monthly Value")) map.monthlySales = "Monthly Value";
  if (!map.valueSales && allColumns.includes("Value Sales")) map.valueSales = "Value Sales";
  if (!map.unitSales && allColumns.includes("Unit Sales")) map.unitSales = "Unit Sales";
  if (!map.volumeSales && allColumns.includes("Volume Sales")) map.volumeSales = "Volume Sales";
  if (!map.valueSales) map.valueSales = map.matSales || map.monthlySales || numeric[0] || "";
  if (!map.unitSales) map.unitSales = pickPeriodColumn(/unit|qty|quantity/i) || "";
  if (!map.volumeSales) map.volumeSales = pickPeriodColumn(/vol|volume/i) || "";
  return map;
}

function isMeasureRole(role) {
  return ["matSales", "monthlySales", "unitSales", "volumeSales", "valueSales"].includes(role);
}

function pickPeriodColumn(pattern) {
  return state.columns.find((column) => pattern.test(String(column))) || "";
}

function updateMappingControls() {
  const allOptions = ["", ...state.columns];
  getMappingConfig().forEach(({ role, id }) => {
    setOptions(els[id], allOptions, state.columnMap[role] || "", "(not mapped)");
  });
}

function renderMappingWarnings() {
  const required = ["brand", "therapy", "molecule", "company", "marketType", "companyType", "productType", "valueSales"];
  const missing = required
    .filter((role) => !state.columnMap[role])
    .map((role) => getMappingConfig().find((item) => item.role === role)?.label || role);
  if (!missing.length) {
    els.mappingWarnings.innerHTML = `<div class="mapping-ok">All key pharma fields mapped.</div>`;
    return;
  }
  els.mappingWarnings.innerHTML = `<div class="mapping-warning">Missing: ${escapeHtml(missing.join(", "))}. Use manual mapping if the uploaded column uses another name.</div>`;
}

function updateStrategicFilterOptions(changedRole) {
  getStrategicFilterConfig().forEach(({ role, id, label, limit }) => {
    const column = state.columnMap[role];
    const selected = role === changedRole ? state.strategicFilters[role] : state.strategicFilters[role].filter(Boolean);
    const baseRows = applyStrategicFilters(state.rows, role);
    const values = column ? getTopCategoricalValues(baseRows, column, limit || 36) : [];
    els[id].innerHTML = "";
    const chipContainer = els[`${id}Chips`];
    chipContainer.innerHTML = "";
    if (!column) {
      const option = document.createElement("option");
      option.textContent = `Map ${label} first`;
      option.disabled = true;
      els[id].appendChild(option);
      chipContainer.innerHTML = `<button class="filter-chip is-disabled" type="button" disabled>Map ${escapeHtml(label)} first</button>`;
      return;
    }
    if (!values.length) {
      chipContainer.innerHTML = `<button class="filter-chip is-disabled" type="button" disabled>No values</button>`;
    }
    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      option.selected = selected.includes(value);
      els[id].appendChild(option);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `filter-chip ${selected.includes(value) ? "is-selected" : ""}`;
      button.dataset.filterValue = value;
      button.textContent = value;
      button.setAttribute("aria-pressed", selected.includes(value) ? "true" : "false");
      chipContainer.appendChild(button);
    });
    state.strategicFilters[role] = selected.filter((value) => values.includes(value));
  });
}

function toggleStrategicFilter(role, value) {
  const current = new Set(state.strategicFilters[role] || []);
  if (current.has(value)) current.delete(value);
  else current.add(value);
  state.strategicFilters[role] = Array.from(current);
}

function getTopCategoricalValues(rows, column, limit) {
  const metric = getPreferredMetric();
  const grouped = groupBySum(rows, column, metric).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  return grouped.map((item) => item.name).filter((value) => value && value !== "Unassigned").slice(0, limit);
}

function getSelectedValues(select) {
  return Array.from(select.selectedOptions).map((option) => option.value).filter(Boolean);
}

function clearStrategicFilterState() {
  Object.keys(state.strategicFilters).forEach((role) => {
    state.strategicFilters[role] = [];
  });
}

function clearInvalidStrategicFilters() {
  Object.keys(state.strategicFilters).forEach((role) => {
    if (!state.columnMap[role]) state.strategicFilters[role] = [];
  });
}

function applyStrategicFilters(rows, skipRole) {
  return getStrategicFilterConfig().reduce((currentRows, { role }) => {
    if (role === skipRole) return currentRows;
    const column = state.columnMap[role];
    const selected = state.strategicFilters[role] || [];
    if (!column || !selected.length) return currentRows;
    const allowed = new Set(selected.map((value) => normalizeFilterValue(value)));
    return currentRows.filter((row) => allowed.has(normalizeFilterValue(row[column])));
  }, rows);
}

function normalizeFilterValue(value) {
  return String(value ?? "Unassigned").trim() || "Unassigned";
}

function getPreferredMetric(role = "valueSales") {
  return state.columnMap[role] || state.columnMap.matSales || state.columnMap.monthlySales || state.metric || state.profile?.numeric?.[0] || "";
}

function getPrimaryDimension() {
  return state.columnMap.brand || state.columnMap.company || state.columnMap.therapy || state.dimension || "";
}

function getSelectedFocusLabel() {
  const priority = ["brand", "molecule", "therapy", "company", "marketType", "companyType", "productType"];
  for (const role of priority) {
    const values = state.strategicFilters[role] || [];
    if (values.length) return values.slice(0, 3).join(", ");
  }
  const grouped = groupBySum(getActiveRows(), getPrimaryDimension(), getPreferredMetric()).sort((a, b) => b.value - a.value);
  return grouped[0]?.name || "selected market";
}

function renderDashboard() {
  applyThemeAndDensity();
  renderShellText();
  renderDataHealthGate();
  renderExecutiveSummary();
  renderKpis();
  renderCharts();
  renderInsights();
  renderStrategyPlan();
  renderCompetitorPositioning();
  renderHeatMap();
  renderFrameworkOutputs();
  renderVerticalPlans();
  renderBrandPlan();
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
  renderActiveFilterRibbon();
}

function renderActiveFilterRibbon() {
  const active = getStrategicFilterConfig().flatMap(({ role, label }) => {
    return (state.strategicFilters[role] || []).map((value) => ({ role, label, value }));
  });
  if (!active.length) {
    els.activeFilterRibbon.innerHTML = `
      <div class="ribbon-empty">
        <i data-lucide="sliders-horizontal" aria-hidden="true"></i>
        <span>No strategic filters selected. Tap filter buttons to focus the dashboard.</span>
      </div>
    `;
    return;
  }
  els.activeFilterRibbon.innerHTML = `
    <div class="ribbon-label">Active view</div>
    <div class="ribbon-chips">
      ${active.map((item) => `
        <button class="active-filter-chip" type="button" data-role="${escapeHtml(item.role)}" data-filter-value="${escapeHtml(item.value)}">
          <span>${escapeHtml(item.label)}</span>
          ${escapeHtml(item.value)}
          <i data-lucide="x" aria-hidden="true"></i>
        </button>
      `).join("")}
    </div>
  `;
  els.activeFilterRibbon.querySelectorAll("[data-role]").forEach((button) => {
    button.addEventListener("click", () => {
      toggleStrategicFilter(button.dataset.role, button.dataset.filterValue);
      updateControls();
      renderDashboard();
    });
  });
}

function computeDataHealth() {
  const rows = state.rows || [];
  const requiredRoles = state.domain === "ims"
    ? ["brand", "company", "therapy", "molecule", "marketType", "companyType", "productType", "valueSales"]
    : ["valueSales"];
  const missingFields = requiredRoles.filter((role) => !state.columnMap[role]);
  const mappedCount = requiredRoles.length - missingFields.length;
  const metric = getPreferredMetric();
  const metricValues = metric ? rows.map((row) => row[metric]).filter((value) => !isBlank(value)) : [];
  const numericHits = metricValues.filter((value) => parseNumber(value) !== null).length;
  const numericSuccess = metricValues.length ? (numericHits / metricValues.length) * 100 : 0;
  const duplicateRows = countDuplicateRows(rows, requiredRoles.map((role) => state.columnMap[role]).filter(Boolean));
  const outlierCount = countOutliers(metricValues.map(parseNumber).filter((value) => value !== null));
  const dateDetected = Boolean(state.dateColumn || getPeriodColumnsForMetric(metric).length >= 2);
  const rowScore = rows.length ? 18 : 0;
  const mappingScore = requiredRoles.length ? (mappedCount / requiredRoles.length) * 34 : 0;
  const numericScore = Math.min(24, numericSuccess * 0.24);
  const periodScore = dateDetected ? 14 : 0;
  const duplicatePenalty = rows.length ? Math.min(8, (duplicateRows / rows.length) * 100) : 0;
  const outlierPenalty = metricValues.length ? Math.min(5, (outlierCount / metricValues.length) * 100) : 0;
  const confidence = Math.max(0, Math.min(100, Math.round(rowScore + mappingScore + numericScore + periodScore + 10 - duplicatePenalty - outlierPenalty)));
  return {
    confidence,
    missingFields,
    mappedCount,
    requiredCount: requiredRoles.length,
    duplicateRows,
    numericSuccess,
    dateDetected,
    outlierCount,
    status: confidence >= 62 && !missingFields.includes("valueSales") ? "ready" : "blocked"
  };
}

function countDuplicateRows(rows, columns) {
  if (!rows.length || !columns.length) return 0;
  const seen = new Set();
  let duplicates = 0;
  rows.forEach((row) => {
    const key = columns.map((column) => normalizeFilterValue(row[column])).join("|");
    if (seen.has(key)) duplicates += 1;
    else seen.add(key);
  });
  return duplicates;
}

function countOutliers(values) {
  if (values.length < 10) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  if (!iqr) return 0;
  const low = q1 - iqr * 3;
  const high = q3 + iqr * 3;
  return values.filter((value) => value < low || value > high).length;
}

function canGenerateStrategy() {
  return state.dataHealth.status === "ready" && getActiveRows().length > 0;
}

function renderDataHealthGate() {
  const health = state.dataHealth;
  const missing = health.missingFields.map((role) => getMappingConfig().find((item) => item.role === role)?.label || role);
  const statusText = health.status === "ready" ? "Ready for strategy" : "Strategy locked until mapping improves";
  els.dataHealthGate.innerHTML = `
    <div class="health-gate-head">
      <div>
        <span class="eyebrow">Data health gate</span>
        <h2>${escapeHtml(statusText)}</h2>
      </div>
      <strong class="health-pill ${health.status}">${formatNumber(health.confidence)}% confidence</strong>
    </div>
    <div class="health-grid">
      ${healthTile("Rows loaded", formatNumber(state.rows.length), `${formatNumber(state.uploadMeta.rowsProcessed || state.rows.length)} processed`)}
      ${healthTile("Columns mapped", `${health.mappedCount}/${health.requiredCount}`, missing.length ? `Missing ${missing.join(", ")}` : "All required fields mapped")}
      ${healthTile("Numeric parsing", `${formatNumber(health.numericSuccess)}%`, "Selected value metric")}
      ${healthTile("Duplicate rows", formatNumber(health.duplicateRows), "Based on mapped pharma keys")}
      ${healthTile("Periods", health.dateDetected ? "Detected" : "Missing", "Month/MAT trend support")}
      ${healthTile("Outliers", formatNumber(health.outlierCount), "Flagged for review")}
    </div>
    ${health.status === "ready" ? "" : `<div class="health-warning">Fix the mapping wizard fields before generating strategy or brand plans. Dashboards still render, but strategy output is blocked to avoid unsupported recommendations.</div>`}
  `;
}

function healthTile(label, value, note) {
  return `
    <section class="health-tile">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(note)}</small>
    </section>
  `;
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
  const panelColor = css.getPropertyValue("--panel").trim() || "#151b2a";

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
          borderColor: panelColor
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
  if (!canGenerateStrategy()) {
    els.strategyTitle.textContent = "Strategy locked";
    els.strategyMeta.textContent = "Improve data health and mapping before recommendations are generated";
    els.strategyGrid.innerHTML = `<section class="strategy-card"><h3>Data-backed gate</h3><p>Strategy recommendations are blocked because confidence is ${formatNumber(state.dataHealth.confidence)}%. Map brand/company/therapy/molecule and a value metric to unlock framework output.</p></section>`;
    return;
  }
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
      ["What happened", `<strong>${common.leader}</strong> leads ${common.dimension} with ${common.topShare}% share of ${common.metric} using ${formatNumber(rows.length)} filtered rows.`],
      ["Why it matters", `Top-3 concentration is ${common.top3Share}%, so leadership can decide whether this is a defend, diversify, or challenger-invest market.`],
      ["Recommended action", `${integrity} Review leader/challenger gaps and fund only segments where mapped value, growth, and share support the decision.`]
    ],
    marketing: [
      ["What happened", `<strong>${common.leader}</strong> is the leading brand/segment in the filtered market at ${common.topShare}% share.`],
      ["Business implication", `Marketing spend should not be spread evenly; it should defend the leader and test challenger pockets supported by growth data.`],
      ["Recommended action", `Build campaigns with KPIs tied to ${common.metric}, rank movement, share gap, and period growth.`]
    ],
    strategy: [
      ["What happened", `The filtered portfolio shows ${common.leader} leading while ${common.laggard} trails the selected ${common.dimension} universe.`],
      ["Business implication", `Frameworks should be applied only to segments with enough mapped value, growth, and competitor evidence.`],
      ["Recommended action", `Classify each pocket into defend, invest, optimize, or reposition and attach budget gates to measured performance.`]
    ],
    presales: [
      ["Opportunity map", `<strong>${common.leader}</strong> and adjacent high-share pockets are the strongest BD proof points. Use low-share but active pockets as whitespace stories.`],
      ["Account narrative", `Frame BD pitches around market size (${common.total}), concentration (${common.top3Share}%), and clear gaps versus the leader.`],
      ["Pipeline action", `Create account lists by ${common.dimension}, rank by ${common.metric}, and prioritize challenger segments for partnership conversations.`]
    ],
    finance: [
      ["Budget allocation", `Use top-share concentration to allocate base budget to proven contributors and reserve test budget for high-potential challengers.`],
      ["Scenario model", `Model three cases: defend leader, accelerate challenger, and fix laggard. Tie spend gates to incremental ${common.metric}.`],
      ["Controls", `${integrity} Budget decisions should be blocked when required mappings or numeric parsing confidence are weak.`]
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
  return `This view is based on ${formatNumber(rows.length)} rows after selected filters, with ${formatNumber(state.dataHealth.confidence)}% data-health confidence.`;
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

function buildCompetitiveSet() {
  const rows = getActiveRows();
  const metric = getPreferredMetric("valueSales");
  const monthlyMetric = getPreferredMetric("monthlySales");
  const unitMetric = state.columnMap.unitSales || metric;
  const volumeMetric = state.columnMap.volumeSales || metric;
  const dimension = state.columnMap.brand || state.columnMap.company || state.dimension;
  const total = sum(rows.map((row) => parseNumber(row[metric]) ?? 0));
  const periodGrowth = calculateTrend(rows, "", metric);
  const grouped = groupBySum(rows, dimension, metric).sort((a, b) => b.value - a.value);
  const rowsByDimension = new Map();
  rows.forEach((row) => {
    const key = normalizeFilterValue(row[dimension]);
    if (!rowsByDimension.has(key)) rowsByDimension.set(key, []);
    rowsByDimension.get(key).push(row);
  });
  const entries = grouped.map((item, index) => {
    const itemRows = rowsByDimension.get(item.name) || [];
    const latest = sum(itemRows.map((row) => parseNumber(row[monthlyMetric]) ?? 0));
    const units = sum(itemRows.map((row) => parseNumber(row[unitMetric]) ?? 0));
    const volume = sum(itemRows.map((row) => parseNumber(row[volumeMetric]) ?? 0));
    const growth = getRowsGrowth(itemRows, metric);
    return {
      ...item,
      rank: index + 1,
      share: total ? (item.value / total) * 100 : 0,
      matValue: item.value,
      latest,
      units,
      volume,
      growth
    };
  });
  return {
    rows,
    metric,
    dimension,
    total,
    entries,
    focus: getSelectedFocusLabel(),
    marketGrowth: parseNumber(periodGrowth.value) ?? 0
  };
}

function getRowsGrowth(rows, metric) {
  const periodColumns = getPeriodColumnsForMetric(metric);
  if (state.domain === "ims" && periodColumns.length >= 2) {
    const previousColumn = periodColumns[periodColumns.length - 2];
    const currentColumn = periodColumns[periodColumns.length - 1];
    const previous = sum(rows.map((row) => parseNumber(row[previousColumn]) ?? 0));
    const current = sum(rows.map((row) => parseNumber(row[currentColumn]) ?? 0));
    return previous ? ((current - previous) / Math.abs(previous)) * 100 : 0;
  }
  return parseNumber(calculateTrend(rows, state.dateColumn, metric).value) ?? 0;
}

function renderCompetitorPositioning() {
  const comp = buildCompetitiveSet();
  els.positioningMeta.textContent = `${formatNumber(comp.rows.length)} rows filtered; ${titleCase(comp.dimension)} ranked by ${titleCase(comp.metric)}`;
  if (!comp.entries.length) {
    els.positioningGrid.innerHTML = `<div class="empty-state">Upload or select IMS data to build competitor positioning.</div>`;
    return;
  }
  const leader = comp.entries[0];
  const focus = comp.entries.find((item) => item.name === comp.focus) || leader;
  const topCompetitors = comp.entries.filter((item) => item.name !== focus.name).slice(0, 5);
  const gap = Math.max(0, leader.value - focus.value);
  const priceProxy = focus.volume ? focus.value / focus.volume : focus.units ? focus.value / focus.units : 0;
  const summaryCards = [
    ["Market share", `${formatNumber(focus.share)}%`, `${focus.name} share of selected universe`],
    ["Growth", `${focus.growth >= 0 ? "+" : ""}${formatNumber(focus.growth)}%`, "Latest period movement"],
    ["Rank", `#${focus.rank}`, `${titleCase(comp.dimension)} rank`],
    ["MAT value", formatMetric(focus.matValue, comp.metric), `Gap to leader: ${formatMetric(gap, comp.metric)}`],
    ["Units", formatNumber(focus.units), "Mapped unit sales"],
    ["Volume", formatNumber(focus.volume), "Mapped volume sales"],
    ["Price proxy", priceProxy ? formatMetric(priceProxy, comp.metric) : "n/a", "Value divided by units or volume"],
    ["Opportunity gap", formatMetric(gap, comp.metric), gap ? "Close through share capture" : "Leader position"]
  ];
  const rows = comp.entries.slice(0, state.topN).map((item) => `
    <tr>
      <td>${item.rank}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${formatNumber(item.share)}%</td>
      <td>${item.growth >= 0 ? "+" : ""}${formatNumber(item.growth)}%</td>
      <td>${formatMetric(item.value, comp.metric)}</td>
      <td>${formatNumber(item.units)}</td>
      <td>${formatNumber(item.volume)}</td>
    </tr>
  `).join("");
  els.positioningGrid.innerHTML = `
    <div class="positioning-cards">
      ${summaryCards.map(([label, value, note]) => `
        <section class="mini-metric">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
          <small>${escapeHtml(note)}</small>
        </section>
      `).join("")}
    </div>
    <div class="competitor-list">
      <strong>Top competitors:</strong> ${topCompetitors.map((item) => escapeHtml(item.name)).join(", ") || "No competitor split available"}
    </div>
    <div class="table-wrap compact-table">
      <table>
        <thead><tr><th>Rank</th><th>${escapeHtml(titleCase(comp.dimension))}</th><th>Share</th><th>Growth</th><th>Value</th><th>Units</th><th>Volume</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderHeatMap() {
  const comp = buildCompetitiveSet();
  const entries = comp.entries.slice(0, Math.max(8, state.topN));
  if (!entries.length) {
    els.heatMapGrid.innerHTML = `<div class="empty-state">Heat map will appear after upload.</div>`;
    return;
  }
  const avgShare = entries.length ? sum(entries.map((item) => item.share)) / entries.length : 0;
  const avgGrowth = entries.length ? sum(entries.map((item) => item.growth)) / entries.length : 0;
  const quadrants = [
    { key: "defend", title: "Defend & Grow", test: (item) => item.growth >= avgGrowth && item.share >= avgShare },
    { key: "invest", title: "Invest & Capture", test: (item) => item.growth >= avgGrowth && item.share < avgShare },
    { key: "optimize", title: "Optimize & Harvest", test: (item) => item.growth < avgGrowth && item.share >= avgShare },
    { key: "reposition", title: "Reposition or Exit", test: (item) => item.growth < avgGrowth && item.share < avgShare }
  ];
  els.heatMapMeta.textContent = `Thresholds: ${formatNumber(avgShare)}% share and ${avgGrowth >= 0 ? "+" : ""}${formatNumber(avgGrowth)}% growth`;
  els.heatMapGrid.innerHTML = quadrants.map((quadrant) => {
    const items = entries.filter(quadrant.test).slice(0, 8);
    return `
      <section class="quadrant ${quadrant.key}">
        <h3>${quadrant.title}</h3>
        <div class="quadrant-items">
          ${items.length ? items.map((item) => `
            <span title="Share ${formatNumber(item.share)}%, growth ${formatNumber(item.growth)}%">
              ${escapeHtml(item.name)}
              <small>${formatNumber(item.share)}% | ${item.growth >= 0 ? "+" : ""}${formatNumber(item.growth)}%</small>
            </span>
          `).join("") : "<em>No competitor in this quadrant</em>"}
        </div>
      </section>
    `;
  }).join("");
}

function renderFrameworkOutputs() {
  if (!canGenerateStrategy()) {
    els.frameworkMeta.textContent = "Frameworks require mapped, healthy data";
    els.frameworkGrid.innerHTML = `<section class="framework-card"><h3>Blocked</h3><p>Framework output is disabled until the data health gate reaches the ready threshold. This prevents generic or unsupported recommendations.</p></section>`;
    return;
  }
  const framework = buildFrameworkOutputs();
  els.frameworkMeta.textContent = `${framework.focus} strategy logic from selected filters`;
  els.frameworkGrid.innerHTML = framework.cards.map((card) => `
    <section class="framework-card">
      <h3>${escapeHtml(card.title)}</h3>
      <p>${escapeHtml(card.body)}</p>
    </section>
  `).join("");
}

function buildFrameworkOutputs() {
  const comp = buildCompetitiveSet();
  const focus = comp.entries.find((item) => item.name === comp.focus) || comp.entries[0] || { name: "Selected brand", share: 0, growth: 0, rank: 0, value: 0 };
  const leader = comp.entries[0] || focus;
  const intensity = comp.entries.length > 6 ? "high" : comp.entries.length > 2 ? "moderate" : "low";
  const quadrant = focus.growth >= 0 && focus.share >= 10 ? "Defend & Grow" : focus.growth >= 0 ? "Invest & Capture" : focus.share >= 10 ? "Optimize & Harvest" : "Reposition or Exit";
  const cards = [
    ["SWOT", `Strength: rank #${focus.rank} with ${formatNumber(focus.share)}% share. Weakness: ${leader.name === focus.name ? "leadership must be defended" : `gap to ${leader.name}`}. Opportunity: capture under-served competitor pockets. Threat: ${intensity} competitive intensity.`],
    ["BCG Matrix", `${focus.name} sits in ${quadrant}. Use share and growth together before committing spend.`],
    ["Ansoff Matrix", `Prioritize market penetration in mapped therapy/company pockets, then product development for molecule or pack whitespace if growth remains above market.`],
    ["4Ps Marketing Mix", `Product: sharpen molecule/pack promise. Price: compare value per unit/volume. Place: focus field coverage where share is low. Promotion: align brand message with therapy drivers.`],
    ["STP", `Segment by therapy, molecule, market type, and company type; target high-growth low-share pockets; position ${focus.name} against the top competitor with evidence-led differentiation.`],
    ["Porter's Five Forces", `Rivalry is ${intensity}; buyer power rises when many competitors show similar value. Defend through KOL advocacy, supply reliability, and differentiated clinical/brand evidence.`],
    ["Brand Equity", `Build salience, credibility, consideration, and loyalty by linking brand promise to measurable share, trend, and prescriber/customer activation KPIs.`],
    ["Go-To-Market", `Translate opportunity into priority accounts, call plan, digital journey, KOL calendar, access plan, and weekly sales governance.`],
    ["Opportunity Matrix", `Score pockets by value, growth, competitive gap, execution ease, and supply readiness; fund high-value high-growth gaps first.`]
  ];
  return { focus: focus.name, cards: cards.map(([title, body]) => ({ title, body })) };
}

function renderVerticalPlans() {
  if (!canGenerateStrategy()) {
    els.verticalPlanMeta.textContent = "Team plans require mapped, healthy data";
    els.verticalPlanGrid.innerHTML = `<section class="framework-card"><h3>Blocked</h3><p>Upload a dataset and complete the mapping wizard before department plans are generated.</p></section>`;
    return;
  }
  const plans = buildVerticalPlans();
  els.verticalPlanMeta.textContent = `Action plan for ${formatNumber(getActiveRows().length)} selected rows`;
  els.verticalPlanGrid.innerHTML = plans.map((plan) => `
    <section class="framework-card">
      <h3>${escapeHtml(plan.title)}</h3>
      <p>${escapeHtml(plan.body)}</p>
    </section>
  `).join("");
}

function buildVerticalPlans() {
  const comp = buildCompetitiveSet();
  const focus = comp.entries.find((item) => item.name === comp.focus) || comp.entries[0] || { name: "selected brand", share: 0, growth: 0 };
  return [
    { title: "Marketing team", body: `Build campaigns around ${focus.name} with message tracks for awareness, conversion, retention, and competitor switch.` },
    { title: "Branding team", body: `Codify positioning, claims, visual language, and core message based on therapy, molecule, and competitor gaps.` },
    { title: "Sales team", body: `Turn ranking into coverage priorities, territory gap reviews, objection handling, and monthly rank movement goals.` },
    { title: "Finance team", body: `Allocate base budget to defend proven share and test budget to high-growth low-share pockets with KPI gates.` },
    { title: "BD / Pre-sales team", body: `Use whitespace, competitor intensity, and therapy attractiveness to shape partnership and account-entry narratives.` },
    { title: "Portfolio strategy", body: `Classify assets into defend, invest, optimize, and exit paths using the heat-map quadrant.` },
    { title: "Leadership / CXO", body: `Review share, growth, rank, opportunity gap, risk, and resource asks in a single monthly governance pack.` }
  ];
}

function renderBrandPlan() {
  if (!state.brandPlanGenerated) {
    els.brandPlanOutput.innerHTML = `<div class="empty-state">${canGenerateStrategy() ? "Select filters, then click Generate Brand Plan." : "Brand plan is locked until the data health gate is ready."}</div>`;
    return;
  }
  if (!canGenerateStrategy()) {
    state.brandPlanGenerated = false;
    els.brandPlanOutput.innerHTML = `<div class="empty-state">Brand plan blocked because the data health gate is not ready.</div>`;
    return;
  }
  const sections = buildBrandPlan();
  els.brandPlanMeta.textContent = `${sections.focus} plan generated from ${formatNumber(getActiveRows().length)} rows`;
  els.brandPlanOutput.innerHTML = sections.items.map((item) => `
    <section class="brand-plan-section">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.body)}</p>
    </section>
  `).join("");
}

function buildBrandPlan() {
  const comp = buildCompetitiveSet();
  const focus = comp.entries.find((item) => item.name === comp.focus) || comp.entries[0] || { name: "Selected brand", share: 0, growth: 0, rank: 0, value: 0 };
  const leader = comp.entries[0] || focus;
  const therapy = selectedOrMappedValue("therapy");
  const molecule = selectedOrMappedValue("molecule");
  const marketType = selectedOrMappedValue("marketType");
  const companyType = selectedOrMappedValue("companyType");
  const productType = selectedOrMappedValue("productType");
  const items = [
    ["Executive summary", `${focus.name} ranks #${focus.rank} with ${formatNumber(focus.share)}% share and ${focus.growth >= 0 ? "+" : ""}${formatNumber(focus.growth)}% latest growth in the selected universe.`],
    ["Market overview", `Selected market: ${marketType}; company type: ${companyType}; product type: ${productType}. Total selected value is ${formatMetric(comp.total, comp.metric)}.`],
    ["Therapy landscape", `Therapy focus is ${therapy}. Use growth and share pockets to decide where to defend, invest, optimize, or reposition.`],
    ["Brand performance", `${focus.name} MAT/value is ${formatMetric(focus.value, comp.metric)} with rank #${focus.rank}. Gap to leader ${leader.name} is ${formatMetric(Math.max(0, leader.value - focus.value), comp.metric)}.`],
    ["Competitor analysis", `Primary competitor benchmark is ${leader.name}. Compare market share, growth, price proxy, units, volume, and field execution.`],
    ["Customer segmentation", `Segment doctors/customers by therapy potential, molecule relevance, brand switching likelihood, and account access.`],
    ["Doctor/customer targeting", `Target high-value accounts in high-growth low-share cells first, then defend top-prescribing pockets.`],
    ["Positioning statement", `For priority ${therapy} customers seeking reliable outcomes in ${molecule}, ${focus.name} should be positioned as a differentiated, evidence-led option with clear value versus competitors.`],
    ["Core brand message", `Deliver a concise message linking efficacy/benefit, patient or customer relevance, access, and trust proof.`],
    ["Growth drivers", `Share capture, portfolio/pack focus, improved coverage, KOL advocacy, digital activation, and supply reliability.`],
    ["Barriers", `Competitive intensity, low differentiation, access friction, field execution gaps, and budget constraints.`],
    ["Tactical plan", `Deploy field detailing, digital content, KOL programs, therapy education, competitor-switch aids, and periodic performance reviews.`],
    ["Sales force strategy", `Prioritize accounts by value gap and growth; use weekly call plan, objection scripts, and rank/share scorecards.`],
    ["Digital marketing strategy", `Run targeted content journeys for awareness, consideration, and conversion with KPI tracking by segment.`],
    ["KOL strategy", `Identify therapy advocates, build evidence discussion forums, and connect KOL activity to account activation.`],
    ["Financial forecast", `Base case follows latest growth; upside case closes 25% of the gap to leader; downside case assumes flat share and requires spend containment.`],
    ["KPIs", `Market share, growth %, rank, MAT value, monthly trend, units, volume, price proxy, opportunity gap, campaign engagement, call coverage.`],
    ["90-day plan", `Validate mapping, lock priority segments, activate sales message, and launch first campaign/control dashboard.`],
    ["180-day plan", `Scale winning pockets, refine budget allocation, expand KOL and digital programs, and review competitor response.`],
    ["1-year action plan", `Institutionalize portfolio governance, full-year forecast, launch/line-extension decisions, and CXO performance review.`]
  ];
  return { focus: focus.name, items: items.map(([title, body]) => ({ title, body })) };
}

function selectedOrMappedValue(role) {
  const selected = state.strategicFilters[role] || [];
  if (selected.length) return selected.slice(0, 3).join(", ");
  const column = state.columnMap[role];
  if (!column) return "not mapped";
  const value = getTopCategoricalValues(getActiveRows(), column, 1)[0];
  return value || "not available";
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
    const preferred = ["BRANDS", "MANUFACT. DESC", "GROUP", "PACK_DESC", "ACUTE_CHRONIC", "MAT Value", "Monthly Value", "Growth %", "Price Proxy", "IMS Active Periods"];
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
  if (state.domain === "ims") {
    const columns = getPeriodColumnsForMetric(metric);
    if (columns.length) return groupByMeasureColumns(rows, columns);
  }
  if (state.dateColumn) return groupByDate(rows, state.dateColumn, metric);
  return groupByIndex(rows, metric);
}

function groupByMeasureColumns(rows, periodColumns = state.measureColumns) {
  const maxPoints = 18;
  const columns = periodColumns;
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
  if (state.domain === "ims") {
    const periodColumns = getPeriodColumnsForMetric(metric);
    if (periodColumns.length >= 2) {
    const previousColumn = periodColumns[periodColumns.length - 2];
    const currentColumn = periodColumns[periodColumns.length - 1];
    const previous = sum(rows.map((row) => parseNumber(row[previousColumn]) ?? 0));
    const current = sum(rows.map((row) => parseNumber(row[currentColumn]) ?? 0));
    const change = previous === 0 ? 0 : ((current - previous) / Math.abs(previous)) * 100;
    return {
      label: "Latest IMS period",
      value: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
      note: `${labelMeasureColumn(currentColumn, periodColumns.length - 1)} vs ${labelMeasureColumn(previousColumn, periodColumns.length - 2)}`,
      direction: change >= 0 ? "good" : "bad"
    };
    }
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

function getPeriodColumnsForMetric(metric) {
  const name = normalize(metric);
  if (/unit/.test(name)) return state.pharmaMeasures.unitColumns || [];
  if (/volume|vol/.test(name)) return state.pharmaMeasures.volumeColumns || [];
  if (/monthly|month/.test(name)) return state.pharmaMeasures.monthlyValueColumns || [];
  if (/mat|value|sales|revenue|growth/.test(name)) return state.pharmaMeasures.valueColumns || [];
  return state.measureColumns || [];
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
  const tables = {};
  const schemas = parseSqlSchemas(text);
  const insertPattern = /insert\s+into\s+[`"\[]?([\w.\- ]+)[`"\]]?\s*(?:\(([^)]*)\))?\s*values\s*([\s\S]*?);/gi;
  let match;
  let totalRows = 0;

  while ((match = insertPattern.exec(text))) {
    const tableName = cleanSqlIdentifier(match[1]) || "SQL data";
    const explicitColumns = match[2] ? splitSqlCsv(match[2]).map(cleanSqlIdentifier) : null;
    const valuesBlock = match[3];
    const tuples = extractSqlTuples(valuesBlock);
    if (!tables[tableName]) tables[tableName] = [];
    tuples.forEach((tuple) => {
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
    isSampled: false,
    rowLimit: 0
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

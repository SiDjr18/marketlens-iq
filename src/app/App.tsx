import { useDeferredValue, useMemo, useRef, useState, type ChangeEvent } from "react";
import { FILTER_DEFAULTS, STATIC_FILTER_OPTIONS } from "../lib/utils/constants";
import type { AnalyticsContext, DashboardTab, DataHealth, FieldMapping, FilterState, MappingConfidence, ParsedDataset, ParseProgress, RawRow, UploadMeta } from "../lib/utils/types";
import { parseFile, getColumns } from "../lib/ingestion/parseFile";
import { autoMapColumns } from "../lib/mapping/autoMapColumns";
import { validateMapping } from "../lib/mapping/validateMapping";
import { applyFilters, collectFilterOptions } from "../lib/analytics/aggregateData";
import { calculateKpis } from "../lib/analytics/calculateKpis";
import { generateInsights } from "../lib/strategy/insightEngine";
import { cellText } from "../lib/utils/formatters";
import { AppShell } from "../components/layout/AppShell";
import type { FilterOptions } from "../components/layout/TopFilterBar";
import { UploadDropzone } from "../components/upload/UploadDropzone";
import { UploadProgress } from "../components/upload/UploadProgress";
import { FilePreview } from "../components/upload/FilePreview";
import { SheetSelector } from "../components/upload/SheetSelector";
import { DataHealthPanel } from "../components/mapping/DataHealthPanel";
import { FieldMappingModal } from "../components/mapping/FieldMappingModal";
import { OverviewDashboard } from "../components/dashboard/OverviewDashboard";
import { MarketLandscape } from "../components/dashboard/MarketLandscape";
import { CompetitorPositioning } from "../components/dashboard/CompetitorPositioning";
import { BrandDeepDive } from "../components/dashboard/BrandDeepDive";
import { TherapyAnalysis } from "../components/dashboard/TherapyAnalysis";
import { MoleculeAnalysis } from "../components/dashboard/MoleculeAnalysis";
import { StrategyLab } from "../components/dashboard/StrategyLab";
import { BrandPlan } from "../components/dashboard/BrandPlan";
import { ExportCenter } from "../components/dashboard/ExportCenter";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";

const idleProgress: ParseProgress = { phase: "idle", percent: 0, rowsProcessed: 0, message: "" };

function buildMeta(fileName: string, rows: RawRow[], columns: string[]): UploadMeta {
  return {
    fileName,
    fileType: "DEMO",
    sheetName: "Demo Pharma",
    sheetNames: ["Demo Pharma"],
    rowsDetected: rows.length,
    columnsDetected: columns.length,
    rowsProcessed: rows.length,
    skippedRows: 0,
    errors: []
  };
}

function demoRows(): RawRow[] {
  const therapies = ["Cardiac", "Diabetes", "Respiratory", "Pain", "Anti Infective", "Gastro"];
  const companies = ["Apex Pharma", "Nova MNC", "Zenith Labs", "Helix Healthcare", "Orbit Remedies"];
  return Array.from({ length: 420 }, (_, index) => {
    const therapy = therapies[index % therapies.length];
    const company = companies[index % companies.length];
    const month = `2025-${String((index % 12) + 1).padStart(2, "0")}`;
    const base = 120000 + (index % 37) * 4200 + therapies.indexOf(therapy) * 18000;
    return {
      Brand: `${therapy.split(" ")[0]}-${(index % 9) + 1}`,
      Company: company,
      Therapy: therapy,
      Molecule: `${therapy} molecule ${(index % 6) + 1}`,
      "Acute Chronic": index % 3 === 0 ? "Acute" : "Chronic",
      "Indian MNC": company.includes("MNC") ? "MNC" : "Indian",
      "Plain Combination": index % 4 === 0 ? "Combination" : "Plain",
      "Value Sales": base,
      Units: 500 + (index % 40) * 11,
      Volume: 120 + (index % 25) * 4,
      MAT: base * 12,
      Month: month,
      Pack: `${(index % 5) + 1}x${(index % 10) + 10}`
    };
  });
}

export default function App() {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [activeSheet, setActiveSheet] = useState("");
  const [mapping, setMapping] = useState<FieldMapping>({});
  const [mappingConfidence, setMappingConfidence] = useState<MappingConfidence>({});
  const [draftFilters, setDraftFilters] = useState<FilterState>(FILTER_DEFAULTS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(FILTER_DEFAULTS);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [mappingOpen, setMappingOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [progress, setProgress] = useState<ParseProgress>(idleProgress);
  const deferredDraftFilters = useDeferredValue(draftFilters);

  const activeRows = useMemo(() => (dataset ? dataset.tables[activeSheet || dataset.activeSheet] ?? [] : []), [dataset, activeSheet]);
  const columns = useMemo(() => getColumns(activeRows), [activeRows]);
  const meta = useMemo<UploadMeta | null>(() => {
    if (!dataset) return null;
    return {
      ...dataset.meta,
      sheetName: activeSheet || dataset.activeSheet,
      rowsDetected: activeRows.length,
      rowsProcessed: activeRows.length,
      columnsDetected: columns.length
    };
  }, [dataset, activeSheet, activeRows.length, columns.length]);
  const health = useMemo<DataHealth>(() => validateMapping(activeRows, columns, mapping), [activeRows, columns, mapping]);
  const filteredRows = useMemo(() => applyFilters(activeRows, mapping, appliedFilters), [activeRows, mapping, appliedFilters]);

  const status = useMemo(() => {
    if (!activeRows.length) return "No data" as const;
    if (health.status === "ready") return "Ready" as const;
    return "Mapping required" as const;
  }, [activeRows.length, health.status]);

  const filterOptions = useMemo<FilterOptions>(() => {
    const observed = collectFilterOptions(activeRows, mapping, deferredDraftFilters);
    const merge = (...groups: string[][]) => Array.from(new Set(groups.flat().filter(Boolean)));
    return {
      marketType: merge(STATIC_FILTER_OPTIONS.marketType, deferredDraftFilters.marketType, observed.marketType),
      companyType: merge(STATIC_FILTER_OPTIONS.companyType, deferredDraftFilters.companyType, observed.companyType),
      productType: merge(STATIC_FILTER_OPTIONS.productType, deferredDraftFilters.productType, observed.productType),
      brand: merge(deferredDraftFilters.brand, observed.brand),
      therapy: merge(deferredDraftFilters.therapy, observed.therapy),
      molecule: merge(deferredDraftFilters.molecule, observed.molecule),
      company: merge(deferredDraftFilters.company, observed.company),
      timePeriod: merge(deferredDraftFilters.timePeriod, observed.timePeriod)
    };
  }, [activeRows, mapping, deferredDraftFilters]);

  const context: AnalyticsContext = useMemo(
    () => ({ rows: filteredRows, mapping, health, filters: appliedFilters }),
    [filteredRows, mapping, health, appliedFilters]
  );
  async function ingestFile(file: File) {
    setProgress({ phase: "reading", percent: 5, rowsProcessed: 0, message: "Preparing upload" });
    const parsed = await parseFile(file, setProgress);
    setDataset(parsed);
    setActiveSheet(parsed.activeSheet);
    const rows = parsed.tables[parsed.activeSheet] ?? [];
    const detectedColumns = getColumns(rows);
    const auto = autoMapColumns(detectedColumns, rows);
    const nextHealth = validateMapping(rows, detectedColumns, auto.mapping);
    setMapping(auto.mapping);
    setMappingConfidence(auto.confidence);
    setDraftFilters(FILTER_DEFAULTS);
    setAppliedFilters(FILTER_DEFAULTS);
    setActiveTab("overview");
    setMappingOpen(nextHealth.status !== "ready");
  }

  function loadDemo() {
    const rows = demoRows();
    const detectedColumns = getColumns(rows);
    const auto = autoMapColumns(detectedColumns, rows);
    setDataset({
      tables: { "Demo Pharma": rows },
      sheetNames: ["Demo Pharma"],
      activeSheet: "Demo Pharma",
      meta: buildMeta("demo-pharma-commercial-data.csv", rows, detectedColumns)
    });
    setActiveSheet("Demo Pharma");
    setMapping(auto.mapping);
    setMappingConfidence(auto.confidence);
    setDraftFilters(FILTER_DEFAULTS);
    setAppliedFilters(FILTER_DEFAULTS);
    setProgress(idleProgress);
  }

  function handleSheetChange(sheet: string) {
    if (!dataset) return;
    const rows = dataset.tables[sheet] ?? [];
    const detectedColumns = getColumns(rows);
    const auto = autoMapColumns(detectedColumns, rows);
    const nextHealth = validateMapping(rows, detectedColumns, auto.mapping);
    setActiveSheet(sheet);
    setMapping(auto.mapping);
    setMappingConfidence(auto.confidence);
    setDraftFilters(FILTER_DEFAULTS);
    setAppliedFilters(FILTER_DEFAULTS);
    setMappingOpen(nextHealth.status !== "ready");
  }

  function handleMappingChange(nextMapping: FieldMapping) {
    setMapping(nextMapping);
    setMappingConfidence((current) => {
      const next: MappingConfidence = {};
      Object.entries(nextMapping).forEach(([field, column]) => {
        if (column) next[field as keyof MappingConfidence] = current[field as keyof MappingConfidence] ?? 100;
      });
      return next;
    });
  }

  function onHiddenUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void ingestFile(file);
    event.target.value = "";
  }

  function saveView() {
    localStorage.setItem("marketlens-iq-saved-view", JSON.stringify(draftFilters));
    setNotice("Saved current filter view in this browser.");
    window.setTimeout(() => setNotice(""), 2500);
  }

  function clearFilters() {
    setDraftFilters(FILTER_DEFAULTS);
    setAppliedFilters(FILTER_DEFAULTS);
  }

  function updateFilters(nextFilters: FilterState) {
    setDraftFilters(nextFilters);
  }

  function openTab(tab: DashboardTab) {
    if (health.status !== "ready" && (tab === "strategy" || tab === "brandPlan")) {
      setMappingOpen(true);
      return;
    }
    setActiveTab(tab);
  }

  const content = renderContent();

  function renderContent() {
    if (!activeRows.length) {
      return (
        <div className="space-y-4">
          <UploadDropzone onFile={(file) => void ingestFile(file)} />
          <UploadProgress progress={progress} />
          <Card className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-navy">Need a quick check?</h3>
              <p className="text-sm text-slate-600">Load a small pharma-shaped demo dataset. It is clearly marked and never replaces your uploaded IMS file.</p>
            </div>
            <Button onClick={loadDemo}>Load Demo Dataset</Button>
          </Card>
        </div>
      );
    }

    if (health.status !== "ready") {
      return (
        <div className="space-y-4">
          <FilePreview meta={meta} />
          <SheetSelector meta={meta} value={activeSheet} onChange={handleSheetChange} />
          <DataHealthPanel health={health} onOpenMapping={() => setMappingOpen(true)} />
          <EmptyState title="Mapping required before analytics" description="Map Brand, Company, Therapy or Molecule, Value Sales or MAT, and Month where available. This prevents incorrect IMS/IQVIA dashboards." action={<Button variant="primary" onClick={() => setMappingOpen(true)}>Open Field Mapping</Button>} />
        </div>
      );
    }

    if (!filteredRows.length) {
      return (
        <div className="space-y-4">
          <FilePreview meta={meta} />
          <EmptyState title="No records match selected filters" description="The current filter combination returns zero rows from the full dataset." action={<Button variant="primary" onClick={clearFilters}>Clear Filters</Button>} />
        </div>
      );
    }

    switch (activeTab) {
      case "market":
        return <MarketLandscape context={context} />;
      case "competitor":
        return <CompetitorPositioning context={context} />;
      case "brand":
        return <BrandDeepDive context={context} />;
      case "therapy":
        return <TherapyAnalysis context={context} />;
      case "molecule":
        return <MoleculeAnalysis context={context} />;
      case "strategy":
        return <StrategyLab context={context} onOpenMapping={() => setMappingOpen(true)} />;
      case "brandPlan":
        return <BrandPlan context={context} onOpenMapping={() => setMappingOpen(true)} />;
      case "exports":
        return <ExportCenter context={context} kpis={calculateKpis(context.rows, context.mapping, context.filters)} insights={generateInsights(context)} />;
      case "overview":
      default:
        return <OverviewDashboard context={context} />;
    }
  }

  return (
    <>
      <input ref={uploadInputRef} type="file" accept=".xlsx,.xls,.csv,.tsv,.sql,.json" className="hidden" onChange={onHiddenUpload} />
      <AppShell
        status={status}
        activeTab={activeTab}
        filters={draftFilters}
        filterOptions={filterOptions}
        filtersDisabled={!activeRows.length}
        disabledTabs={health.status === "ready" ? [] : ["strategy", "brandPlan"]}
        onUploadClick={() => uploadInputRef.current?.click()}
        onSettingsClick={() => setSettingsOpen(true)}
        onTabChange={openTab}
        onFilterChange={updateFilters}
        onApplyFilters={() => setAppliedFilters(draftFilters)}
        onClearFilters={clearFilters}
        onSaveView={saveView}
        onOpenMapping={() => setMappingOpen(true)}
      >
        {notice && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{notice}</div>}
        {activeRows.length > 0 && health.status === "ready" && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-600">
              {cellText(meta?.fileName)} - {filteredRows.length.toLocaleString("en-IN")} of {activeRows.length.toLocaleString("en-IN")} rows analyzed
            </div>
            <SheetSelector meta={meta} value={activeSheet} onChange={handleSheetChange} />
          </div>
        )}
        {content}
      </AppShell>
      <FieldMappingModal
        open={mappingOpen}
        columns={columns}
        mapping={mapping}
        confidence={mappingConfidence}
        healthScore={health.confidence}
        onClose={() => setMappingOpen(false)}
        onChange={handleMappingChange}
      />
      <Modal title="Privacy and deployment settings" open={settingsOpen} onClose={() => setSettingsOpen(false)} widthClass="max-w-2xl">
        <div className="space-y-4 text-sm leading-6 text-slate-700">
          <p>
            MarketLens IQ runs as a static GitHub Pages app. Uploaded files are parsed in the browser session and are not sent to a server by this codebase.
          </p>
          <p>
            People who pull your public GitHub code can use the app with their own data, but they cannot access files on your local system through GitHub Pages.
          </p>
          <p>
            Repository write protection is controlled in GitHub settings. Keep branch protection enabled on main and do not share write collaborator access unless you trust the person.
          </p>
        </div>
      </Modal>
    </>
  );
}

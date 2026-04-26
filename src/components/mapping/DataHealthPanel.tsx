import { AlertTriangle, CheckCircle2, Database, ListChecks } from "lucide-react";
import type { ReactNode } from "react";
import { FIELD_LABELS } from "../../lib/utils/constants";
import type { DataHealth } from "../../lib/utils/types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type DataHealthPanelProps = {
  health: DataHealth;
  onOpenMapping: () => void;
};

export function DataHealthPanel({ health, onOpenMapping }: DataHealthPanelProps) {
  const ready = health.status === "ready";
  return (
    <Card className="border-l-4 border-l-teal">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {ready ? <CheckCircle2 className="h-5 w-5 text-emerald" /> : <AlertTriangle className="h-5 w-5 text-amber-500" />}
            <h2 className="text-xl font-bold text-navy">Data health gate</h2>
            <Badge tone={ready ? "success" : "warning"}>{ready ? "Ready" : "Mapping required"}</Badge>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Dashboards use the full loaded dataset. Strategy and brand plans unlock only after minimum pharma fields pass validation.
          </p>
        </div>
        <Button variant="primary" onClick={onOpenMapping}>
          Field Mapping
        </Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={<Database className="h-4 w-4" />} label="Rows loaded" value={health.rowsLoaded.toLocaleString("en-IN")} />
        <Metric icon={<ListChecks className="h-4 w-4" />} label="Columns detected" value={health.columnsDetected.toLocaleString("en-IN")} />
        <Metric label="Numeric parsing" value={`${health.numericParsingSuccess}%`} />
        <Metric label="Confidence" value={`${health.confidence}%`} />
      </div>

      {health.missingFields.length > 0 && (
        <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          Missing or low confidence fields: {health.missingFields.map((field) => FIELD_LABELS[field]).join(", ")}
        </div>
      )}
      {health.duplicateRows > 0 && (
        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          Duplicate warning from sample scan: {health.duplicateRows.toLocaleString("en-IN")} repeated rows detected.
        </div>
      )}
    </Card>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-xl font-bold text-navy">{value}</div>
    </div>
  );
}

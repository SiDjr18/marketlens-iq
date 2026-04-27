import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { FIELD_LABELS } from "../../lib/utils/constants";
import type { FieldMapping, PharmaField } from "../../lib/utils/types";

type MappingRowProps = {
  field: PharmaField;
  columns: string[];
  mapping: FieldMapping;
  confidence?: number;
  onChange: (field: PharmaField, column: string) => void;
};

export function MappingRow({ field, columns, mapping, confidence = 0, onChange }: MappingRowProps) {
  const mapped = Boolean(mapping[field]);
  return (
    <div className={`rounded-lg border p-3 transition ${mapped ? "border-emerald-200 bg-emerald-50/40" : "border-border bg-white"}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${mapped ? "bg-emerald-100 text-emerald-700" : "bg-amber-50 text-amber-600"}`}>
            {mapped ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          </span>
          <span className="truncate text-sm font-black text-slate-900">{FIELD_LABELS[field]}</span>
        </div>
        <span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-black ${mapped ? "bg-white text-emerald-700 ring-1 ring-emerald-200" : "bg-amber-50 text-amber-700"}`}>
          {mapped ? `${Math.round(confidence)}%` : "Missing"}
        </span>
      </div>
      <select
        value={mapping[field] ?? ""}
        onChange={(event) => onChange(field, event.target.value)}
        className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-semibold text-slate-900 shadow-control outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20"
      >
        <option value="">Not mapped</option>
        {columns.map((column) => (
          <option key={column} value={column}>
            {column}
          </option>
        ))}
      </select>
    </div>
  );
}

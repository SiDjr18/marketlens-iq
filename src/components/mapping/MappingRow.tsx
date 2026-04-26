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
    <div className="grid gap-3 rounded-xl border border-border bg-white p-3 sm:grid-cols-[220px_1fr_90px] sm:items-center">
      <div className="flex items-center gap-2">
        {mapped ? <CheckCircle2 className="h-4 w-4 text-emerald" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
        <span className="font-semibold text-slate-900">{FIELD_LABELS[field]}</span>
      </div>
      <select
        value={mapping[field] ?? ""}
        onChange={(event) => onChange(field, event.target.value)}
        className="h-10 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
      >
        <option value="">Not mapped</option>
        {columns.map((column) => (
          <option key={column} value={column}>
            {column}
          </option>
        ))}
      </select>
      <span className={`rounded-full px-2 py-1 text-center text-xs font-bold ${mapped ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
        {mapped ? `${Math.round(confidence)}%` : "Missing"}
      </span>
    </div>
  );
}

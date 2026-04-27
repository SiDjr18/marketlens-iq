import { CheckCircle2, Columns3, Sparkles } from "lucide-react";
import { REQUIRED_FIELDS } from "../../lib/utils/constants";
import type { FieldMapping, MappingConfidence, PharmaField } from "../../lib/utils/types";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { MappingRow } from "./MappingRow";

type FieldMappingModalProps = {
  open: boolean;
  columns: string[];
  mapping: FieldMapping;
  confidence: MappingConfidence;
  healthScore: number;
  onClose: () => void;
  onChange: (mapping: FieldMapping) => void;
};

export function FieldMappingModal({ open, columns, mapping, confidence, healthScore, onClose, onChange }: FieldMappingModalProps) {
  const mappedCount = REQUIRED_FIELDS.filter((field) => mapping[field]).length;

  function update(field: PharmaField, column: string) {
    onChange({ ...mapping, [field]: column || undefined });
  }

  return (
    <Modal title="Pharma Field Mapping" open={open} onClose={onClose} widthClass="max-w-[980px]">
      <div className="mb-4 overflow-hidden rounded-lg border border-border bg-gradient-to-br from-navy to-slate-800 text-white shadow-control">
        <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-teal-100">
              <Sparkles className="h-4 w-4" />
              IMS/IQVIA mapping wizard
            </div>
            <div className="mt-2 text-2xl font-black">Mapping confidence {healthScore}%</div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-200">
              Confirm the detected columns once, then dashboards, filters, strategy cards, and brand plans use the same deterministic field map.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
              <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald" />
                {mappedCount} of {REQUIRED_FIELDS.length} fields mapped
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1">
                <Columns3 className="h-3.5 w-3.5 text-teal" />
                {columns.length} detected columns
              </span>
            </div>
          </div>
          <Button variant="primary" className="bg-teal text-white hover:bg-teal/90" onClick={onClose}>
            Apply Mapping
          </Button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {REQUIRED_FIELDS.map((field) => (
          <MappingRow
            key={field}
            field={field}
            columns={columns}
            mapping={mapping}
            confidence={confidence[field]}
            onChange={update}
          />
        ))}
      </div>
    </Modal>
  );
}

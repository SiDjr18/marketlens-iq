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
  function update(field: PharmaField, column: string) {
    onChange({ ...mapping, [field]: column || undefined });
  }

  return (
    <Modal title="Pharma Field Mapping" open={open} onClose={onClose} widthClass="max-w-[860px]">
      <div className="mb-4 rounded-xl border border-border bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-navy">Mapping confidence: {healthScore}%</div>
            <p className="mt-1 text-sm text-slate-600">Edit any detected field. Missing critical fields block strategy and brand plans.</p>
          </div>
          <Button variant="primary" onClick={onClose}>
            Apply Mapping
          </Button>
        </div>
      </div>
      <div className="grid gap-2">
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

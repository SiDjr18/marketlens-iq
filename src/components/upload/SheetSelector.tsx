import type { UploadMeta } from "../../lib/utils/types";
import { Select } from "../ui/Select";

type SheetSelectorProps = {
  meta: UploadMeta | null;
  value: string;
  onChange: (sheet: string) => void;
};

export function SheetSelector({ meta, value, onChange }: SheetSelectorProps) {
  if (!meta || meta.sheetNames.length <= 1) return null;
  return (
    <Select
      label="Sheet"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      options={meta.sheetNames.map((sheet) => ({ label: sheet, value: sheet }))}
    />
  );
}

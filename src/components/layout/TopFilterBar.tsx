import { Save, SlidersHorizontal, XCircle } from "lucide-react";
import { FILTER_DEFAULTS, METRIC_OPTIONS } from "../../lib/utils/constants";
import type { FilterState, PharmaField } from "../../lib/utils/types";
import { Button } from "../ui/Button";
import { MultiSelect } from "../ui/MultiSelect";
import { Select } from "../ui/Select";

export type FilterOptions = {
  marketType: string[];
  companyType: string[];
  productType: string[];
  brand: string[];
  therapy: string[];
  molecule: string[];
  company: string[];
  timePeriod: string[];
};

type TopFilterBarProps = {
  filters: FilterState;
  options: FilterOptions;
  disabled: boolean;
  onChange: (filters: FilterState) => void;
  onApply: () => void;
  onClear: () => void;
  onSave: () => void;
  onOpenMapping: () => void;
};

export function TopFilterBar({ filters, options, disabled, onChange, onApply, onClear, onSave, onOpenMapping }: TopFilterBarProps) {
  function setFilter(key: keyof FilterState, value: string[] | PharmaField) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <section className="z-30 shrink-0 border-b border-border bg-white px-6 py-3 shadow-sm">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <MultiSelect label="Market Type" options={options.marketType} value={filters.marketType} onChange={(value) => setFilter("marketType", value)} disabled={disabled} />
          <MultiSelect label="Company Type" options={options.companyType} value={filters.companyType} onChange={(value) => setFilter("companyType", value)} disabled={disabled} />
          <MultiSelect label="Product Type" options={options.productType} value={filters.productType} onChange={(value) => setFilter("productType", value)} disabled={disabled} />
          <MultiSelect label="Brand" options={options.brand} value={filters.brand} onChange={(value) => setFilter("brand", value)} disabled={disabled} />
          <MultiSelect label="Therapy" options={options.therapy} value={filters.therapy} onChange={(value) => setFilter("therapy", value)} disabled={disabled} />
          <MultiSelect label="Molecule" options={options.molecule} value={filters.molecule} onChange={(value) => setFilter("molecule", value)} disabled={disabled} />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <MultiSelect label="Company / Competitor" options={options.company} value={filters.company} onChange={(value) => setFilter("company", value)} disabled={disabled} />
          <MultiSelect label="Time Period" options={options.timePeriod} value={filters.timePeriod} onChange={(value) => setFilter("timePeriod", value)} disabled={disabled} />
          <Select
            label="Metric"
            value={filters.metric}
            onChange={(event) => setFilter("metric", event.target.value as PharmaField)}
            options={METRIC_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
          />
          <Button icon={<SlidersHorizontal className="h-4 w-4" />} onClick={onOpenMapping}>
            Field Mapping
          </Button>
          <Button variant="primary" onClick={onApply} disabled={disabled}>
            Apply Filters
          </Button>
          <Button icon={<XCircle className="h-4 w-4" />} onClick={onClear} disabled={disabled}>
            Clear All
          </Button>
          <Button icon={<Save className="h-4 w-4" />} onClick={onSave} disabled={disabled || JSON.stringify(filters) === JSON.stringify(FILTER_DEFAULTS)}>
            Save View
          </Button>
        </div>
      </div>
    </section>
  );
}

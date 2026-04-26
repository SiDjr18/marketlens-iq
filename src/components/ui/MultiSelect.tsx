import { ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

type MultiSelectProps = {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function MultiSelect({ label, options, value, onChange, placeholder = "All", disabled = false }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => options.filter((option) => option.toLowerCase().includes(query.toLowerCase())).slice(0, 80),
    [options, query]
  );

  function toggleOption(option: string) {
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);
  }

  return (
    <div className="relative min-w-[180px] max-w-full flex-1">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-border bg-white px-3 text-left text-sm font-semibold text-slate-900 shadow-sm outline-none transition hover:border-teal disabled:opacity-50"
      >
        <span className="min-w-0 truncate">{value.length ? `${value.length} selected` : placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
      </button>
      {value.length > 0 && (
        <div className="mt-1 flex max-w-full flex-wrap gap-1">
          {value.slice(0, 3).map((item) => (
            <span key={item} className="inline-flex max-w-[140px] items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
              <span className="truncate">{item}</span>
              <button type="button" onClick={() => toggleOption(item)} aria-label={`Remove ${item}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {value.length > 3 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">+{value.length - 3}</span>}
        </div>
      )}
      {open && (
        <div className="absolute z-50 mt-2 w-[280px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-white p-2 shadow-panel">
          <div className="flex items-center gap-2 rounded-lg border border-border px-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-9 w-full outline-none"
              placeholder="Search"
            />
          </div>
          <div className="mt-2 max-h-64 overflow-y-auto">
            {filtered.length ? (
              filtered.map((option) => (
                <label key={option} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50">
                  <input type="checkbox" checked={value.includes(option)} onChange={() => toggleOption(option)} className="h-4 w-4 accent-teal" />
                  <span className="truncate">{option}</span>
                </label>
              ))
            ) : (
              <div className="px-2 py-3 text-sm text-slate-500">No options found</div>
            )}
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-2">
            <button type="button" className="text-xs font-semibold text-slate-500" onClick={() => onChange([])}>
              Clear
            </button>
            <button type="button" className="text-xs font-semibold text-teal-700" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

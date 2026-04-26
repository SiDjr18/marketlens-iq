import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: Array<{ label: string; value: string }>;
};

export function Select({ label, options, className = "", ...props }: SelectProps) {
  return (
    <label className="flex min-w-[150px] flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
      <select
        className={`h-10 rounded-xl border border-border bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-900 outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

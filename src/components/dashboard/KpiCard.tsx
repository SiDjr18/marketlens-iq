import type { ReactNode } from "react";
import { Card } from "../ui/Card";

type KpiCardProps = {
  label: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
  tone?: "navy" | "teal" | "emerald" | "amber";
};

const toneClasses = {
  navy: "text-navy from-navy/12 to-slate-50 border-t-navy",
  teal: "text-teal from-teal/12 to-slate-50 border-t-teal",
  emerald: "text-emerald-700 from-emerald/12 to-slate-50 border-t-emerald",
  amber: "text-amber-700 from-amber-100 to-slate-50 border-t-amber-500"
};

export function KpiCard({ label, value, helper, icon, tone = "navy" }: KpiCardProps) {
  const textClass = toneClasses[tone].split(" ")[0];
  return (
    <Card className={`relative overflow-hidden border-t-4 bg-gradient-to-br ${toneClasses[tone]}`}>
      <div className="absolute right-0 top-0 h-16 w-20 bg-white/40" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
          <div className={`mt-2 truncate text-2xl font-black ${textClass}`}>{value}</div>
          {helper && <div className="mt-2 text-xs font-medium text-slate-500">{helper}</div>}
        </div>
        {icon && <div className="relative z-10 rounded-lg border border-white/70 bg-white p-2 text-slate-500 shadow-control">{icon}</div>}
      </div>
    </Card>
  );
}

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
  navy: "text-navy border-l-navy",
  teal: "text-teal border-l-teal",
  emerald: "text-emerald-700 border-l-emerald",
  amber: "text-amber-700 border-l-amber-500"
};

export function KpiCard({ label, value, helper, icon, tone = "navy" }: KpiCardProps) {
  return (
    <Card className={`border-l-4 ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
          <div className={`mt-2 text-2xl font-black ${toneClasses[tone].split(" ")[0]}`}>{value}</div>
          {helper && <div className="mt-2 text-xs font-medium text-slate-500">{helper}</div>}
        </div>
        {icon && <div className="rounded-xl bg-slate-50 p-2 text-slate-500">{icon}</div>}
      </div>
    </Card>
  );
}

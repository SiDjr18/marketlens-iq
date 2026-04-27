import { DatabaseZap, Settings, ShieldCheck, Upload } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

type HeaderProps = {
  status: "No data" | "Uploaded" | "Mapping required" | "Ready";
  onUploadClick: () => void;
  onSettingsClick: () => void;
};

export function Header({ status, onUploadClick, onSettingsClick }: HeaderProps) {
  const tone = status === "Ready" ? "success" : status === "Mapping required" ? "warning" : status === "Uploaded" ? "info" : "neutral";
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-white/95 px-6 shadow-sm backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-navy via-teal to-emerald text-sm font-black text-white shadow-control">
          ML
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-black text-navy">MarketLens IQ</h1>
            <span className="hidden rounded-full border border-teal/20 bg-teal/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-teal md:inline-flex">
              IMS Ready
            </span>
          </div>
          <p className="truncate text-xs font-semibold text-slate-500">Pharma Commercial Intelligence</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-emerald/20 bg-emerald/10 px-3 py-1.5 text-xs font-bold text-emerald-700 lg:flex">
          <ShieldCheck className="h-4 w-4" />
          Browser-private analysis
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 xl:flex">
          <DatabaseZap className="h-4 w-4 text-teal" />
          Full-data engine
        </div>
        <Button variant="primary" icon={<Upload className="h-4 w-4" />} onClick={onUploadClick}>
          Upload Data
        </Button>
        <Badge tone={tone}>{status}</Badge>
        <button onClick={onSettingsClick} className="rounded-lg border border-border bg-white p-2 text-slate-600 shadow-control transition hover:bg-slate-50" aria-label="Settings">
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

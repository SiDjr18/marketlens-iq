import { Settings, Upload } from "lucide-react";
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
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-white px-6 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy via-teal to-emerald text-sm font-black text-white">
          ML
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-black text-navy">MarketLens IQ</h1>
          <p className="truncate text-xs font-semibold text-slate-500">Pharma Commercial Intelligence</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="primary" icon={<Upload className="h-4 w-4" />} onClick={onUploadClick}>
          Upload Data
        </Button>
        <Badge tone={tone}>{status}</Badge>
        <button onClick={onSettingsClick} className="rounded-xl border border-border bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50" aria-label="Settings">
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

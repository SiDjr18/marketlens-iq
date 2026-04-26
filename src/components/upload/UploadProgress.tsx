import type { ParseProgress } from "../../lib/utils/types";

type UploadProgressProps = {
  progress: ParseProgress;
};

export function UploadProgress({ progress }: UploadProgressProps) {
  if (progress.phase === "idle") return null;
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-navy">{progress.message}</span>
        <span className="font-semibold text-teal">{progress.percent}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${progress.percent}%` }} />
      </div>
      <div className="mt-2 text-xs text-slate-500">{progress.rowsProcessed.toLocaleString("en-IN")} rows processed</div>
    </div>
  );
}

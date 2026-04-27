import type { ParseProgress } from "../../lib/utils/types";

type UploadProgressProps = {
  progress: ParseProgress;
};

export function UploadProgress({ progress }: UploadProgressProps) {
  if (progress.phase === "idle") return null;
  const hasBytes = Number.isFinite(progress.bytesProcessed) && Number.isFinite(progress.totalBytes) && (progress.totalBytes ?? 0) > 0;
  const byteText = hasBytes
    ? `${formatBytes(progress.bytesProcessed ?? 0)} of ${formatBytes(progress.totalBytes ?? 0)} processed`
    : `${progress.rowsProcessed.toLocaleString("en-IN")} rows processed`;
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-navy">{progress.message}</span>
        <span className="font-semibold text-teal">{progress.percent}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${progress.percent}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>{progress.rowsProcessed.toLocaleString("en-IN")} rows processed</span>
        {hasBytes && <span>{byteText}</span>}
      </div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

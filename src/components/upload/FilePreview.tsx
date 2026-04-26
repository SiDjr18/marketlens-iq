import type { UploadMeta } from "../../lib/utils/types";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

type FilePreviewProps = {
  meta: UploadMeta | null;
};

export function FilePreview({ meta }: FilePreviewProps) {
  if (!meta) return null;
  return (
    <Card className="grid gap-3 sm:grid-cols-4">
      <div className="sm:col-span-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Uploaded file</div>
        <div className="mt-1 truncate text-sm font-bold text-navy">{meta.fileName}</div>
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rows</div>
        <div className="mt-1 text-sm font-bold text-slate-900">{meta.rowsProcessed.toLocaleString("en-IN")}</div>
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Columns</div>
        <div className="mt-1 text-sm font-bold text-slate-900">{meta.columnsDetected.toLocaleString("en-IN")}</div>
      </div>
      {meta.errors.length > 0 && (
        <div className="sm:col-span-4">
          <Badge tone="warning">{meta.errors.length} parsing warning</Badge>
          <p className="mt-2 text-sm text-amber-700">{meta.errors[0]}</p>
        </div>
      )}
    </Card>
  );
}

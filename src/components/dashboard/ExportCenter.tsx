import { Download, FileImage, FileSpreadsheet, FileText, Presentation } from "lucide-react";
import type { ReactNode } from "react";
import type { AnalyticsContext, KpiSet, Insight } from "../../lib/utils/types";
import { exportCsv } from "../../lib/export/exportCsv";
import { exportPdf } from "../../lib/export/exportPdf";
import { exportPng } from "../../lib/export/exportPng";
import { exportPpt } from "../../lib/export/exportPpt";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type ExportCenterProps = {
  context: AnalyticsContext;
  kpis: KpiSet;
  insights: Insight[];
};

export function ExportCenter({ context, kpis, insights }: ExportCenterProps) {
  const fileName = "marketlens-current-view";
  return (
    <div className="grid grid-cols-12 gap-4">
      <Card className="col-span-12">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-50 p-3 text-teal">
            <Download className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-navy">Export Center</h2>
            <p className="text-sm text-slate-600">Exports use the current filtered state and skip empty sections.</p>
          </div>
        </div>
      </Card>
      <ExportCard title="CSV" description="Download current filtered rows." icon={<FileSpreadsheet className="h-5 w-5" />} onClick={() => exportCsv(context.rows, fileName)} disabled={!context.rows.length} />
      <ExportCard title="PDF" description="Capture the visible dashboard as a clean PDF." icon={<FileText className="h-5 w-5" />} onClick={() => void exportPdf("dashboard-scroll", fileName)} disabled={!context.rows.length} />
      <ExportCard title="PPT" description="Create a board-pack summary with KPIs and insights." icon={<Presentation className="h-5 w-5" />} onClick={() => void exportPpt(kpis, insights, fileName)} disabled={!context.rows.length} />
      <ExportCard title="PNG" description="Export the current dashboard view as an image." icon={<FileImage className="h-5 w-5" />} onClick={() => void exportPng("dashboard-scroll", fileName)} disabled={!context.rows.length} />
    </div>
  );
}

function ExportCard({ title, description, icon, onClick, disabled }: { title: string; description: string; icon: ReactNode; onClick: () => void; disabled: boolean }) {
  return (
    <Card className="col-span-12 md:col-span-3">
      <div className="rounded-xl bg-slate-50 p-3 text-teal">{icon}</div>
      <h3 className="mt-4 text-lg font-black text-navy">{title}</h3>
      <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-600">{description}</p>
      <Button className="mt-4 w-full" variant="primary" onClick={onClick} disabled={disabled}>
        Export {title}
      </Button>
    </Card>
  );
}

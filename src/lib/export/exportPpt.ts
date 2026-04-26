import pptxgen from "pptxgenjs";
import type { Insight, KpiSet } from "../utils/types";
import { formatCurrency, formatNumber, formatPercent, safeFileName } from "../utils/formatters";

export async function exportPpt(kpis: KpiSet, insights: Insight[], fileName = "marketlens-board-pack"): Promise<void> {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "MarketLens IQ";
  pptx.subject = "Pharma Commercial Intelligence";
  pptx.title = "MarketLens IQ Dashboard";

  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: "F7F9FC" };
  titleSlide.addText("MarketLens IQ", { x: 0.6, y: 0.5, w: 7, h: 0.5, fontFace: "Arial", bold: true, fontSize: 28, color: "0B1F3B" });
  titleSlide.addText("Pharma Commercial Intelligence", { x: 0.6, y: 1.0, w: 7, h: 0.3, fontSize: 14, color: "6B7280" });
  titleSlide.addText(`Total market: ${formatCurrency(kpis.totalMarket)}`, { x: 0.6, y: 1.8, w: 4, h: 0.3, fontSize: 18, bold: true, color: "111827" });
  titleSlide.addText(`Growth: ${formatPercent(kpis.growth)}`, { x: 0.6, y: 2.25, w: 4, h: 0.3, fontSize: 16, color: "0F766E" });
  titleSlide.addText(`Units: ${formatNumber(kpis.units)} | Volume: ${formatNumber(kpis.volume)}`, { x: 0.6, y: 2.7, w: 6, h: 0.3, fontSize: 14, color: "111827" });
  titleSlide.addText(`Top brand: ${kpis.topBrand} | Top company: ${kpis.topCompany}`, { x: 0.6, y: 3.15, w: 9, h: 0.3, fontSize: 14, color: "111827" });

  const insightSlide = pptx.addSlide();
  insightSlide.background = { color: "FFFFFF" };
  insightSlide.addText("Data-backed insights", { x: 0.6, y: 0.4, w: 6, h: 0.4, fontSize: 24, bold: true, color: "0B1F3B" });
  insights.slice(0, 5).forEach((insight, index) => {
    const y = 1 + index * 0.85;
    insightSlide.addText(insight.title, { x: 0.7, y, w: 4, h: 0.25, bold: true, fontSize: 12, color: "0F766E" });
    insightSlide.addText(`${insight.whatHappened} Action: ${insight.recommendedAction}`, { x: 0.7, y: y + 0.25, w: 11, h: 0.45, fontSize: 10, color: "111827", fit: "shrink" });
  });

  await pptx.writeFile({ fileName: `${safeFileName(fileName)}.pptx` });
}

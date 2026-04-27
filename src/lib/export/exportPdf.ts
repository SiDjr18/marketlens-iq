import { safeFileName } from "../utils/formatters";

export async function exportPdf(elementId = "dashboard-scroll", fileName = "marketlens-report"): Promise<void> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const element = document.getElementById(elementId);
  if (!element) throw new Error("Dashboard area was not found for PDF export.");
  const canvas = await html2canvas(element, { backgroundColor: "#F7F9FC", scale: 2, useCORS: true });
  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const width = pdf.internal.pageSize.getWidth();
  const height = (canvas.height * width) / canvas.width;
  pdf.addImage(img, "PNG", 0, 0, width, Math.min(height, pdf.internal.pageSize.getHeight()));
  pdf.save(`${safeFileName(fileName)}.pdf`);
}

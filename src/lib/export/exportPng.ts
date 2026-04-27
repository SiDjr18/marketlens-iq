import { safeFileName } from "../utils/formatters";

export async function exportPng(elementId = "dashboard-scroll", fileName = "marketlens-dashboard"): Promise<void> {
  const { default: html2canvas } = await import("html2canvas");
  const element = document.getElementById(elementId);
  if (!element) throw new Error("Dashboard area was not found for PNG export.");
  const canvas = await html2canvas(element, { backgroundColor: "#F7F9FC", scale: 2, useCORS: true });
  const link = document.createElement("a");
  link.download = `${safeFileName(fileName)}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

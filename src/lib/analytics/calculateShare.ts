export function calculateShare(value: number, total: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total === 0) return 0;
  return (value / total) * 100;
}

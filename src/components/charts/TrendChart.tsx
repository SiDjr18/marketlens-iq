import { formatNumber } from "../../lib/utils/formatters";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";

type TrendChartProps = {
  title: string;
  data: Array<{ period: string; value: number }>;
};

export function TrendChart({ title, data }: TrendChartProps) {
  if (data.length < 2) return <EmptyState title="Trend unavailable" description="Map a month or time period field to enable monthly trend analysis." />;
  const width = 760;
  const height = 260;
  const padding = 36;
  const max = Math.max(...data.map((point) => point.value), 1);
  const points = data.map((point, index) => {
    const x = padding + (index / Math.max(1, data.length - 1)) * (width - padding * 2);
    const y = height - padding - (point.value / max) * (height - padding * 2);
    return { ...point, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <Card>
      <div className="mb-3">
        <h3 className="text-base font-bold text-navy">{title}</h3>
        <p className="text-sm text-slate-500">Full filtered dataset trend</p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[280px] w-full overflow-visible">
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = height - padding - tick * (height - padding * 2);
          return (
            <g key={tick}>
              <line x1={padding} x2={width - padding} y1={y} y2={y} stroke="#E5E7EB" />
              <text x={0} y={y + 4} fill="#6B7280" fontSize="11">
                {formatNumber(max * tick)}
              </text>
            </g>
          );
        })}
        <path d={path} fill="none" stroke="#0FB9B1" strokeWidth="4" strokeLinecap="round" />
        <path d={`${path} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`} fill="#0FB9B1" opacity="0.12" />
        {points.map((point) => (
          <circle key={point.period} cx={point.x} cy={point.y} r="4" fill="#0B1F3B" />
        ))}
        {points.map((point, index) =>
          index % Math.ceil(points.length / 6) === 0 || index === points.length - 1 ? (
            <text key={`${point.period}-label`} x={point.x} y={height - 8} textAnchor="middle" fill="#6B7280" fontSize="11">
              {point.period}
            </text>
          ) : null
        )}
      </svg>
    </Card>
  );
}

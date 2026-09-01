import { stateColor } from "@/components/admin/crm/crmShared";
import type { StatePoint } from "@/components/admin/crm/crmShared";

const WIDTH = 100;
const HEIGHT = 28;
const PAD_X = 4;
const PAD_Y = 4;

export default function StateSparkline({ history }: { history?: StatePoint[] }) {
  const points = (history ?? []).filter((p) => p.value != null) as { date: string; value: number }[];
  if (points.length < 2) return null;

  const innerW = WIDTH - PAD_X * 2;
  const innerH = HEIGHT - PAD_Y * 2;
  const step = innerW / (points.length - 1);
  const coords = points.map((p, i) => ({
    x: PAD_X + i * step,
    y: PAD_Y + innerH * (1 - p.value / 10),
    value: p.value,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");

  const first = points[0].value;
  const last = points[points.length - 1].value;
  const trend = last > first ? "up" : last < first ? "down" : "flat";

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0" title="Динамика общего состояния за последние отчёты">
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <path d={linePath} fill="none" stroke="#a3a3a3" strokeWidth={1.5} />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={2.5} fill={stateColor(c.value)} />
        ))}
      </svg>
      <span className={`text-xs ${trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-ink/40"}`}>
        {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
      </span>
    </div>
  );
}

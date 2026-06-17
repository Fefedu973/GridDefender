import { formatPercent } from "@/lib/format";

type GaugeTone = "good" | "warning" | "critical" | "blue" | "neutral";

interface MetricGaugeProps {
  label: string;
  value: number;
  detail?: string;
  tone?: GaugeTone;
}

const toneClasses: Record<GaugeTone, string> = {
  good: "from-emerald-300 to-lime-300 shadow-emerald-400/30",
  warning: "from-amber-300 to-orange-400 shadow-amber-400/30",
  critical: "from-rose-400 to-red-500 shadow-red-500/35",
  blue: "from-cyan-300 to-blue-400 shadow-cyan-400/30",
  neutral: "from-zinc-300 to-zinc-500 shadow-zinc-400/20",
};

export function metricTone(value: number, reverse = false): GaugeTone {
  const normalized = reverse ? 100 - value : value;
  if (normalized >= 68) return "good";
  if (normalized >= 42) return "warning";
  return "critical";
}

export function MetricGauge({
  label,
  value,
  detail,
  tone = metricTone(value),
}: MetricGaugeProps) {
  const width = Math.max(3, Math.min(100, value));

  return (
    <div className="min-w-0 rounded-[6px] border border-white/10 bg-white/[0.035] p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="truncate text-xs font-medium text-zinc-300">{label}</span>
        <span className="font-mono text-sm font-semibold text-white">
          {formatPercent(value)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/40">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${toneClasses[tone]} shadow-[0_0_18px] transition-all duration-500`}
          style={{ width: `${width}%` }}
        />
      </div>
      {detail && <p className="mt-2 truncate text-[11px] text-zinc-500">{detail}</p>}
    </div>
  );
}

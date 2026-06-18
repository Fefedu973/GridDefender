"use client";

import type { ReactNode } from "react";

/* Shared HUD building blocks: glass panels, gauges, chips, metric colors. */

export function metricColor(value: number): string {
  if (value >= 66) return "#34f5b0";
  if (value >= 40) return "#ffd447";
  return "#ff2f5f";
}

export function HudPanel({
  eyebrow,
  title,
  icon,
  action,
  children,
  className = "",
  strong = false,
}: {
  eyebrow?: string;
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  strong?: boolean;
}) {
  return (
    <section className={`brackets rounded-md ${strong ? "glass-strong" : "glass"} ${className}`}>
      {(eyebrow || title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-[var(--glass-border-soft)] px-3.5 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && <span className="text-[var(--c-cyan)]">{icon}</span>}
            <div className="min-w-0">
              {eyebrow && <p className="hud-eyebrow leading-none">{eyebrow}</p>}
              {title && <h2 className="hud-title truncate text-[15px] leading-tight text-white">{title}</h2>}
            </div>
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

/* Horizontal bar gauge used in the metric rail. */
export function BarGauge({
  label,
  value,
  unit = "%",
  color,
  hint,
  big = false,
}: {
  label: string;
  value: number;
  unit?: string;
  color?: string;
  hint?: string;
  big?: boolean;
}) {
  const c = color ?? metricColor(value);
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className="group">
      <div className="flex items-baseline justify-between gap-2">
        <span className="hud-eyebrow text-[var(--c-muted)] normal-case tracking-wide">{label}</span>
        <span className="hud-num leading-none" style={{ color: c, fontSize: big ? 20 : 15 }}>
          {Math.round(value)}
          <span className="ml-0.5 text-[10px] opacity-70">{unit}</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-out"
          style={{ width: `${pct}%`, background: c, boxShadow: `0 0 10px ${c}` }}
        />
      </div>
      {hint && <p className="mt-1 text-[10px] leading-3 text-[var(--c-muted)]/70">{hint}</p>}
    </div>
  );
}

/* Radial gauge for the hero metric (stability). */
export function RadialGauge({
  label,
  value,
  color,
  size = 96,
}: {
  label: string;
  value: number;
  color?: string;
  size?: number;
}) {
  const c = color ?? metricColor(value);
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 overflow-visible">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={c}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ filter: `drop-shadow(0 0 6px ${c})`, transition: "stroke-dasharray 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="hud-num text-2xl leading-none" style={{ color: c }}>
            {Math.round(value)}
          </span>
          <span className="text-[9px] text-[var(--c-muted)]">/100</span>
        </div>
      </div>
      <span className="hud-eyebrow mt-1 text-center text-white/80">{label}</span>
    </div>
  );
}

export function Chip({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "cyan" | "danger" | "good";
}) {
  const toneClass =
    tone === "danger"
      ? "text-[var(--c-red)]"
      : tone === "cyan"
        ? "text-[var(--c-cyan-bright)]"
        : tone === "good"
          ? "text-[var(--c-green)]"
          : "text-white";
  return (
    <div className="flex flex-col rounded border border-[var(--glass-border-soft)] bg-white/[0.03] px-2.5 py-1">
      <span className="hud-eyebrow text-[9px] leading-none text-[var(--c-muted)]">{label}</span>
      <span className={`hud-num text-sm leading-tight ${toneClass}`}>{value}</span>
    </div>
  );
}

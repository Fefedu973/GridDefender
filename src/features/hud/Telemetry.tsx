"use client";

import { Activity, BarChart3, CircleCheck, ScrollText, Siren, X } from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useGameStore } from "@/store/gameStore";
import { formatClock } from "@/lib/format";

const tooltipStyle = {
  background: "rgba(5,14,19,0.95)",
  border: "1px solid rgba(125,249,255,0.2)",
  borderRadius: 6,
  color: "#fff",
  fontSize: 12,
};

function Charts() {
  const timeline = useGameStore((state) => state.game.timeline);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded border border-[var(--glass-border-soft)] bg-black/30 p-2.5">
        <p className="hud-eyebrow mb-1 text-zinc-300">Production vs demande</p>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={timeline}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" stroke="#5b7079" fontSize={10} minTickGap={24} />
            <YAxis stroke="#5b7079" fontSize={10} width={30} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="productionMw" name="Prod MW" stroke="#34f5b0" fill="#34f5b0" fillOpacity={0.16} strokeWidth={2} />
            <Area type="monotone" dataKey="demandMw" name="Dem MW" stroke="#ffd447" fill="#ffd447" fillOpacity={0.1} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded border border-[var(--glass-border-soft)] bg-black/30 p-2.5">
        <p className="hud-eyebrow mb-1 text-zinc-300">Stabilité · IA · batterie</p>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={timeline}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" stroke="#5b7079" fontSize={10} minTickGap={24} />
            <YAxis stroke="#5b7079" fontSize={10} width={30} domain={[0, 100]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="stability" name="Stabilité" stroke="#34f5b0" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="batteryLevel" name="Batterie" stroke="#a78bfa" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="aiLoadMw" name="Charge IA" stroke="#22d3ee" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Journal() {
  const incidents = useGameStore((state) => state.game.incidents);
  const actions = useGameStore((state) => state.game.actionHistory);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <p className="hud-eyebrow mb-1.5 flex items-center gap-1.5 text-zinc-300">
          <Siren className="h-3.5 w-3.5 text-[var(--c-red)]" /> Incidents
        </p>
        <div className="grid gap-1.5">
          {incidents.length === 0 && <p className="rounded border border-[var(--glass-border-soft)] bg-white/[0.02] p-2 text-[11px] text-[var(--c-muted)]">Aucun incident. Le pic arrive bientôt.</p>}
          {incidents.slice(0, 5).map((i) => (
            <div key={i.id} className="rounded border border-[var(--glass-border-soft)] bg-white/[0.025] p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[12px] font-semibold text-zinc-100">{i.title}</span>
                {i.resolvedAt ? <CircleCheck className="h-3.5 w-3.5 shrink-0 text-[var(--c-green)]" /> : <Activity className="h-3.5 w-3.5 shrink-0 text-[var(--c-amber)]" />}
              </div>
              <p className="mono mt-0.5 text-[10px] text-[var(--c-muted)]">
                {formatClock(i.openedAt)}
                {i.resolvedAt ? ` → résolu ${formatClock(i.resolvedAt)}` : " → en cours"}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="hud-eyebrow mb-1.5 text-zinc-300">Actions récentes</p>
        <div className="grid gap-1.5">
          {actions.length === 0 && <p className="rounded border border-[var(--glass-border-soft)] bg-white/[0.02] p-2 text-[11px] text-[var(--c-muted)]">Aucune action pour l’instant.</p>}
          {actions.slice(0, 5).map((a) => (
            <div key={a.id} className="rounded border border-[var(--glass-border-soft)] bg-white/[0.025] p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[12px] font-semibold text-zinc-200">{a.label}</span>
                <span className="mono text-[10px] text-[var(--c-muted)]">{formatClock(a.minute)}</span>
              </div>
              <p className="mt-0.5 text-[10px] leading-3 text-[var(--c-muted)]">{a.result}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Telemetry() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"charts" | "journal">("charts");

  return (
    <div className="pointer-events-auto flex flex-col items-end gap-2">
      {open && (
        <div className="glass-strong brackets hud-rise w-[640px] max-w-[88vw] rounded-md">
          <div className="flex items-center justify-between border-b border-[var(--glass-border-soft)] px-3 py-2">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setTab("charts")}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition ${tab === "charts" ? "bg-[var(--c-cyan)]/15 text-[var(--c-cyan-bright)]" : "text-[var(--c-muted)] hover:text-white"}`}
              >
                <BarChart3 className="h-3.5 w-3.5" /> Tendances
              </button>
              <button
                type="button"
                onClick={() => setTab("journal")}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition ${tab === "journal" ? "bg-[var(--c-cyan)]/15 text-[var(--c-cyan-bright)]" : "text-[var(--c-muted)] hover:text-white"}`}
              >
                <ScrollText className="h-3.5 w-3.5" /> Journal
              </button>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="grid h-7 w-7 place-items-center rounded text-[var(--c-muted)] hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-3">{tab === "charts" ? <Charts /> : <Journal />}</div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="glass-strong flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-white transition hover:border-[var(--c-cyan)]/50"
      >
        <BarChart3 className="h-4 w-4 text-[var(--c-cyan-bright)]" />
        Télémétrie
      </button>
    </div>
  );
}

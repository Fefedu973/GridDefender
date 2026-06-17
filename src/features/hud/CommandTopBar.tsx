"use client";

import { Activity, Pause, Play, RotateCcw } from "lucide-react";
import { Chip } from "@/features/hud/hudKit";
import { useGameStore } from "@/store/gameStore";
import { formatClock } from "@/lib/format";

export function CommandTopBar() {
  const game = useGameStore((state) => state.game);
  const phase = useGameStore((state) => state.phase);
  const speed = useGameStore((state) => state.speed);
  const setSpeed = useGameStore((state) => state.setSpeed);
  const togglePause = useGameStore((state) => state.togglePause);
  const resetMission = useGameStore((state) => state.resetMission);
  const m = game.metrics;

  return (
    <header className="glass-strong pointer-events-auto flex items-center gap-3 rounded-md px-3.5 py-2">
      {/* Identity */}
      <div className="flex items-center gap-3 pr-3">
        <div className="grid h-9 w-9 place-items-center rounded border border-[var(--c-cyan)]/40 bg-[var(--c-cyan)]/10">
          <Activity className="h-5 w-5 text-[var(--c-cyan-bright)]" />
        </div>
        <div className="leading-none">
          <p className="hud-title text-[17px] tracking-wide text-white">GRID DEFENDER</p>
          <p className="hud-eyebrow mt-0.5 text-[var(--c-muted)]">{game.scenario.name}</p>
        </div>
      </div>

      <div className="h-9 w-px bg-[var(--glass-border-soft)]" />

      {/* Clock */}
      <div className="flex items-center gap-2 px-1">
        <span className="hud-num text-2xl tracking-wider text-white">{formatClock(game.minute)}</span>
        <span className="hud-eyebrow text-[var(--c-muted)]">
          / {formatClock(game.scenario.endMinute)}
        </span>
      </div>

      {/* Key metrics */}
      <div className="ml-1 hidden items-center gap-2 lg:flex">
        <Chip label="Stabilité" value={`${Math.round(m.stability)}%`} tone={m.stability < 45 ? "danger" : "good"} />
        <Chip label="IA" value={`${Math.round(m.aiProductivity)}%`} tone="cyan" />
        <Chip label="CO₂" value={`${Math.round(m.carbon)}%`} />
        <Chip label="Souv." value={`${Math.round(m.sovereignty)}%`} />
        <Chip label="Réserve" value={`${Math.round(m.reserveMw)} MW`} tone={m.reserveMw < 0 ? "danger" : "default"} />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Speed */}
        <div className="flex overflow-hidden rounded border border-[var(--glass-border-soft)] bg-white/[0.03]">
          {[1, 2, 4].map((value) => (
            <button
              key={value}
              type="button"
              title={`Vitesse x${value}`}
              onClick={() => setSpeed(value as 1 | 2 | 4)}
              className={`hud-num h-8 w-9 text-sm transition ${
                speed === value ? "bg-[var(--c-cyan)] text-black" : "text-zinc-300 hover:bg-white/10"
              }`}
            >
              ×{value}
            </button>
          ))}
        </div>

        <button
          type="button"
          title={phase === "running" ? "Pause" : "Reprendre"}
          onClick={togglePause}
          disabled={phase === "ended" || phase === "ready"}
          className="grid h-9 w-9 place-items-center rounded border border-[var(--glass-border-soft)] bg-white/[0.03] text-white transition hover:border-[var(--c-cyan)]/50 hover:bg-[var(--c-cyan)]/10 disabled:opacity-40"
        >
          {phase === "running" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button
          type="button"
          title="Réinitialiser"
          onClick={() => resetMission(true)}
          className="grid h-9 w-9 place-items-center rounded border border-[var(--glass-border-soft)] bg-white/[0.03] text-white transition hover:border-amber-300/50 hover:bg-amber-300/10"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <div
          className={`hidden h-9 items-center gap-2 rounded border px-3 text-xs font-semibold xl:flex ${
            phase === "ended"
              ? "border-white/15 bg-white/5 text-zinc-300"
              : "border-[var(--c-green)]/25 bg-[var(--c-green)]/10 text-[var(--c-green)]"
          }`}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
          {phase === "paused" ? "PAUSE" : phase === "ended" ? "TERMINÉE" : "EN LIGNE"}
        </div>
      </div>
    </header>
  );
}

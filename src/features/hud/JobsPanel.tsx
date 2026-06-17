"use client";

import { Cpu, ShieldAlert } from "lucide-react";
import type { AIJobStatus } from "@/game/types";
import { HudPanel } from "@/features/hud/hudKit";
import { useGameStore } from "@/store/gameStore";
import { formatClock, formatMw } from "@/lib/format";

const statusMeta: Record<AIJobStatus, { label: string; color: string }> = {
  queued: { label: "En file", color: "#8aa1ab" },
  active: { label: "Actif", color: "#22d3ee" },
  deferred: { label: "Reporté", color: "#ffd447" },
  completed: { label: "Terminé", color: "#34f5b0" },
  failed: { label: "Échoué", color: "#ff2f5f" },
  throttled: { label: "Optimisé", color: "#7dd3fc" },
};

export function JobsPanel() {
  const jobs = useGameStore((state) => state.game.aiJobs);
  const selectedJobId = useGameStore((state) => state.selectedJobId);
  const selectJob = useGameStore((state) => state.selectJob);

  return (
    <HudPanel eyebrow="PromptWatt" title="Datacenter IA" icon={<Cpu className="h-4 w-4" />}>
      <div className="grid gap-1.5 p-2.5">
        {jobs.map((job) => {
          const meta = statusMeta[job.status];
          const selected = selectedJobId === job.id;
          const powerPct = Math.min(100, (job.currentPowerMw / 32) * 100);
          return (
            <button
              key={job.id}
              type="button"
              title={job.narrative}
              onClick={() => selectJob(job.id)}
              className={`w-full rounded border px-2.5 py-2 text-left transition ${
                selected
                  ? "border-[var(--c-cyan)]/55 bg-[var(--c-cyan)]/10"
                  : "border-[var(--glass-border-soft)] bg-white/[0.025] hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  {job.criticality === "critical" && <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-[var(--c-red)]" />}
                  <span className="truncate text-[13px] font-semibold text-zinc-100">{job.name}</span>
                </div>
                <span className="hud-eyebrow shrink-0" style={{ color: meta.color }}>
                  {meta.label}
                </span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-black/40">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(2, job.progress)}%`, background: "linear-gradient(90deg,#22d3ee,#34f5b0)" }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--c-muted)]">
                <span className="mono">{formatMw(job.currentPowerMw)}</span>
                <span className="flex-1 px-2">
                  <span className="block h-0.5 rounded-full bg-white/10">
                    <span className="block h-full rounded-full bg-[var(--c-cyan)]/60" style={{ width: `${powerPct}%` }} />
                  </span>
                </span>
                <span className="mono">⏱ {formatClock(job.deadlineMinute)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </HudPanel>
  );
}

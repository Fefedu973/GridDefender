"use client";

import { Server, ShieldCheck } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { useGameStore } from "@/store/gameStore";
import { formatClock, formatMw } from "@/lib/format";

const statusLabel = {
  queued: "En file",
  active: "Actif",
  deferred: "Reporte",
  completed: "Termine",
  failed: "Echoue",
  throttled: "Optimise",
};

const statusClass = {
  queued: "text-zinc-400",
  active: "text-cyan-200",
  deferred: "text-amber-200",
  completed: "text-emerald-200",
  failed: "text-red-200",
  throttled: "text-blue-200",
};

export function AIJobsPanel() {
  const jobs = useGameStore((state) => state.game.aiJobs);
  const selectedJobId = useGameStore((state) => state.selectedJobId);
  const selectJob = useGameStore((state) => state.selectJob);

  return (
    <Panel
      title="Datacenter IA"
      eyebrow="PromptWatt"
      action={<Server className="h-4 w-4 text-cyan-200" aria-hidden="true" />}
    >
      <div className="space-y-2 p-3">
        {jobs.map((job) => (
          <button
            key={job.id}
            type="button"
            title={job.narrative}
            onClick={() => selectJob(job.id)}
            className={`w-full rounded-[6px] border p-3 text-left transition ${
              selectedJobId === job.id
                ? "border-cyan-300/50 bg-cyan-300/10"
                : "border-white/10 bg-white/[0.035] hover:border-white/25"
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-100">{job.name}</p>
                <p className="text-[11px] text-zinc-500">
                  Deadline {formatClock(job.deadlineMinute)}
                </p>
              </div>
              <span className={`shrink-0 text-xs font-semibold ${statusClass[job.status]}`}>
                {statusLabel[job.status]}
              </span>
            </div>
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-black/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-all duration-500"
                style={{ width: `${Math.max(2, job.progress)}%` }}
              />
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400">
              <span>{formatMw(job.currentPowerMw)}</span>
              <span>{Math.round(job.progress)}%</span>
              {job.criticality === "critical" && (
                <span className="inline-flex items-center gap-1 text-red-200">
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  Critique
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </Panel>
  );
}

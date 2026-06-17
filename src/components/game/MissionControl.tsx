"use client";

import { AlertTriangle, Activity, BatteryCharging, Brain, Clock3, ShieldCheck, Zap } from "lucide-react";
import { getAdvisorRecommendation } from "@/game/advisor/rules";
import type { GameMetrics, IncidentSeverity } from "@/game/types";
import { useGameStore } from "@/store/gameStore";
import { formatClock, formatMw } from "@/lib/format";

const statusTone = {
  info: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
  warning: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  critical: "border-red-400/40 bg-red-500/10 text-red-100",
};

function missionTone(metrics: GameMetrics): IncidentSeverity {
  if (metrics.stability < 40 || metrics.reserveMw < -25) return "critical";
  if (metrics.stability < 62 || metrics.reserveMw < -8) return "warning";
  return "info";
}

export function MissionControl() {
  const game = useGameStore((state) => state.game);
  const recommendation = getAdvisorRecommendation(game);
  const nextEvent = game.scenario.events.find((event) => event.minute > game.minute);
  const currentIncident = game.incidents.find((incident) => !incident.resolvedAt);
  const tone = currentIncident?.severity ?? missionTone(game.metrics);
  const nextDelay = nextEvent ? nextEvent.minute - game.minute : 0;

  return (
    <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(560px,0.78fr)]">
      <div className={`border p-3 ${statusTone[tone]}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase opacity-80">
              <Activity className="h-4 w-4" aria-hidden="true" />
              Situation operationnelle
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              {currentIncident?.title ?? "Reseau sous surveillance active"}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-5 opacity-85">
              {currentIncident?.description ??
                "Gardez une marge avant le pic du soir et protegez les jobs IA critiques."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[520px]">
            <MissionStat label="Stabilite" value={`${Math.round(game.metrics.stability)}%`} tone={tone} />
            <MissionStat label="Marge" value={formatMw(game.metrics.reserveMw)} tone={tone} />
            <MissionStat label="Charge IA" value={formatMw(game.metrics.aiLoadMw)} tone="info" />
            <MissionStat label="Batterie" value={`${Math.round(game.metrics.batteryLevel)}%`} tone="warning" />
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="border border-white/10 bg-[#0a0f14]/90 p-3">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center border border-cyan-300/25 bg-cyan-300/10 text-cyan-100">
              <Brain className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-cyan-200/80">ATHENA recommande</p>
              <h3 className="mt-1 text-base font-semibold text-white">{recommendation.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-400">{recommendation.body}</p>
            </div>
          </div>
        </div>

        <div className="border border-white/10 bg-[#0a0f14]/90 p-3">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center border border-amber-300/25 bg-amber-300/10 text-amber-100">
              <Clock3 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-amber-100/80">Prochain choc</p>
              <h3 className="mt-1 text-base font-semibold text-white">
                {nextEvent ? nextEvent.title : "Fin de mission"}
              </h3>
              <p className="mt-1 text-sm leading-5 text-zinc-400">
                {nextEvent
                  ? `${formatClock(nextEvent.minute)} - dans ${nextDelay} min simulees`
                  : "Le debrief arrive au prochain tick."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MissionTimeline() {
  const game = useGameStore((state) => state.game);

  return (
    <section className="border border-white/10 bg-[#0a0f14]/90 px-4 py-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase text-zinc-400">Timeline mission</p>
        <p className="font-mono text-xs text-zinc-500">
          {formatClock(game.scenario.startMinute)} - {formatClock(game.scenario.endMinute)}
        </p>
      </div>
      <div className="grid gap-2 md:grid-cols-5">
        {game.scenario.events.map((event) => {
          const triggered = game.triggeredEventIds.includes(event.id);
          const active = triggered && game.incidents.some((incident) => incident.id === event.id && !incident.resolvedAt);
          const upcoming = !triggered && event.minute > game.minute;
          const className = active
            ? "border-red-400/45 bg-red-500/10 text-red-100"
            : triggered
              ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
              : upcoming
                ? "border-white/10 bg-white/[0.035] text-zinc-300"
                : "border-zinc-700 bg-zinc-900/50 text-zinc-500";

          return (
            <div key={event.id} className={`min-h-16 border p-2.5 ${className}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-mono text-xs">{formatClock(event.minute)}</span>
                {active ? (
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                ) : triggered ? (
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                ) : event.id === "agent-loop" ? (
                  <Brain className="h-4 w-4" aria-hidden="true" />
                ) : event.id === "solar-drop" ? (
                  <BatteryCharging className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Zap className="h-4 w-4" aria-hidden="true" />
                )}
              </div>
              <p className="text-sm font-semibold leading-4">{event.title}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MissionStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: IncidentSeverity;
}) {
  const valueClass =
    tone === "critical" ? "text-red-100" : tone === "warning" ? "text-amber-100" : "text-white";

  return (
    <div className="border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase text-zinc-500">{label}</p>
      <p className={`mt-1 font-mono text-xl font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

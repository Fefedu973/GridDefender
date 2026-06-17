"use client";

import { Medal, RotateCcw, Trophy } from "lucide-react";
import { DashboardCharts } from "@/components/charts/DashboardCharts";
import { Panel } from "@/components/ui/Panel";
import { useGameStore } from "@/store/gameStore";
import { formatMw } from "@/lib/format";

export function ResultsScreen() {
  const game = useGameStore((state) => state.game);
  const leaderboard = useGameStore((state) => state.leaderboard);
  const resetMission = useGameStore((state) => state.resetMission);
  const clearLeaderboard = useGameStore((state) => state.clearLeaderboard);
  const completedJobs = game.aiJobs.filter((job) => job.status === "completed").length;
  const deferredJobs = game.aiJobs.filter((job) => job.status === "deferred").length;
  const failedJobs = game.aiJobs.filter((job) => job.status === "failed").length;
  const cacheCount = game.aiJobs.filter((job) => job.cached).length;
  const outcome = game.outcome;

  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <div className="grid-bg fixed inset-0 opacity-55" />
      <div className="relative z-10 mx-auto max-w-[1480px] space-y-4 px-4 py-4">
        <section className="border border-white/10 bg-[#0a0f14]/90 p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase text-cyan-200">Debrief mission</p>
              <h1 className="mt-1 text-4xl font-semibold text-white md:text-6xl">
                {outcome?.result === "victory" ? "Mission reussie" : "Mission compromise"}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-400">
                {outcome?.summary}
              </p>
            </div>
            <div className="grid min-w-[260px] gap-2 rounded-[6px] border border-cyan-300/20 bg-cyan-300/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-cyan-100">Score final</span>
                <Trophy className="h-5 w-5 text-amber-200" aria-hidden="true" />
              </div>
              <p className="font-mono text-5xl font-semibold text-white">
                {Math.round(outcome?.score ?? game.metrics.score)}
              </p>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-100">
                <Medal className="h-4 w-4" aria-hidden="true" />
                {outcome?.badge ?? "Score mission"}
              </p>
              <button
                type="button"
                onClick={() => resetMission(true)}
                className="mt-2 inline-flex h-10 items-center justify-center gap-2 rounded-[6px] bg-cyan-300 px-4 text-sm font-bold text-black transition hover:bg-cyan-200"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Rejouer
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.55fr)]">
          <div className="space-y-4">
            <DashboardCharts compact />
            <div className="grid gap-4 md:grid-cols-2">
              <Panel title="Bilan IA" eyebrow="PromptWatt">
                <div className="grid grid-cols-2 gap-3 p-3">
                  <ResultStat label="Jobs termines" value={completedJobs} />
                  <ResultStat label="Jobs reportes" value={deferredJobs} />
                  <ResultStat label="Jobs echoues" value={failedJobs} danger={failedJobs > 0} />
                  <ResultStat label="Caches actifs" value={cacheCount} />
                  <ResultStat label="Charge finale IA" value={formatMw(game.metrics.aiLoadMw)} />
                  <ResultStat label="Productivite IA" value={`${Math.round(game.metrics.aiProductivity)}%`} />
                </div>
              </Panel>
              <Panel title="Bilan energie" eyebrow="Grid">
                <div className="grid grid-cols-2 gap-3 p-3">
                  <ResultStat label="Stabilite" value={`${Math.round(game.metrics.stability)}%`} />
                  <ResultStat label="CO2 score" value={`${Math.round(game.metrics.carbon)}%`} />
                  <ResultStat label="Cout" value={`${Math.round(game.metrics.cost)}%`} />
                  <ResultStat label="Batterie" value={`${Math.round(game.metrics.batteryLevel)}%`} />
                  <ResultStat label="Production" value={formatMw(game.metrics.productionMw)} />
                  <ResultStat label="Demande" value={formatMw(game.metrics.demandMw)} />
                </div>
              </Panel>
            </div>
          </div>

          <div className="space-y-4">
            <Panel title="Recommandation" eyebrow="ATHENA">
              <div className="space-y-3 p-4 text-sm leading-6 text-zinc-300">
                <p>
                  La meilleure strategie consiste a lisser les EV avant le pic, reporter les
                  jobs IA non critiques et garder la batterie pour la chute solaire.
                </p>
                <p>
                  Le point cle du jeu reste l&apos;orchestration: l&apos;IA n&apos;est pas coupee, elle est
                  priorisee selon sa valeur, son urgence et la tension reseau.
                </p>
              </div>
            </Panel>

            <Panel
              title="Leaderboard local"
              eyebrow="Stand demo"
              action={
                <button
                  type="button"
                  onClick={clearLeaderboard}
                  className="rounded-[5px] border border-white/10 px-2 py-1 text-xs text-zinc-400 hover:text-white"
                >
                  Reset
                </button>
              }
            >
              <div className="space-y-2 p-3">
                {leaderboard.length === 0 && (
                  <p className="rounded-[6px] border border-white/10 bg-white/[0.035] p-3 text-sm text-zinc-500">
                    Terminez une mission pour enregistrer un score local.
                  </p>
                )}
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="grid grid-cols-[28px_1fr_auto] items-center gap-3 rounded-[6px] border border-white/10 bg-white/[0.04] p-3"
                  >
                    <span className="font-mono text-sm text-zinc-500">#{index + 1}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-100">{entry.badge}</p>
                      <p className="text-[11px] text-zinc-500">
                        IA {Math.round(entry.aiProductivity)}% - CO2 {Math.round(entry.carbon)}%
                      </p>
                    </div>
                    <span className="font-mono text-lg font-semibold text-cyan-100">
                      {Math.round(entry.score)}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </main>
  );
}

function ResultStat({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string | number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-[6px] border border-white/10 bg-white/[0.04] p-3">
      <p className="text-[11px] text-zinc-500">{label}</p>
      <p className={`mt-1 truncate font-mono text-lg font-semibold ${danger ? "text-red-200" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

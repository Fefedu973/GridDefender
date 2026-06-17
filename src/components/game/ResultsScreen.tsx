"use client";

import { Award, Medal, RotateCcw, Trophy } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarGauge, HudPanel } from "@/features/hud/hudKit";
import { useGameStore } from "@/store/gameStore";
import { formatMw } from "@/lib/format";

const tooltipStyle = {
  background: "rgba(5,14,19,0.95)",
  border: "1px solid rgba(125,249,255,0.2)",
  borderRadius: 6,
  color: "#fff",
  fontSize: 12,
};

export function ResultsScreen() {
  const game = useGameStore((state) => state.game);
  const timeline = useGameStore((state) => state.game.timeline);
  const leaderboard = useGameStore((state) => state.leaderboard);
  const resetMission = useGameStore((state) => state.resetMission);
  const clearLeaderboard = useGameStore((state) => state.clearLeaderboard);
  const outcome = game.outcome;
  const m = game.metrics;
  const victory = outcome?.result === "victory";

  const completed = game.aiJobs.filter((j) => j.status === "completed").length;
  const deferred = game.aiJobs.filter((j) => j.status === "deferred").length;
  const failed = game.aiJobs.filter((j) => j.status === "failed").length;
  const cached = game.aiJobs.filter((j) => j.cached).length;

  return (
    <main className="relative min-h-screen w-screen overflow-x-hidden bg-[#030a10] text-white">
      <div className="grid-bg pointer-events-none fixed inset-0 opacity-40" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.12),transparent_45%)]" />

      <div className="relative z-10 mx-auto max-w-[1320px] space-y-4 px-4 py-6">
        {/* Hero */}
        <section className="glass-strong brackets flex flex-col items-start gap-6 rounded-md p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="hud-eyebrow text-[var(--c-cyan-bright)]">Débrief mission · {game.scenario.name}</p>
            <h1 className="hud-title mt-2 text-5xl text-white md:text-6xl">
              {victory ? "Mission réussie" : "Mission compromise"}
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-zinc-300">{outcome?.summary}</p>
          </div>

          <div className="w-full min-w-[260px] max-w-[300px] rounded-md border border-[var(--c-cyan)]/25 bg-[var(--c-cyan)]/[0.07] p-5">
            <div className="flex items-center justify-between">
              <span className="hud-eyebrow text-[var(--c-cyan-bright)]">Score final</span>
              <Trophy className="h-5 w-5 text-[var(--c-amber)]" />
            </div>
            <p className="hud-num mt-1 text-6xl text-white">{Math.round(outcome?.score ?? m.score)}</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[var(--c-green)]">
              <Award className="h-4 w-4" />
              {outcome?.badge ?? "Score mission"}
            </p>
            <button
              type="button"
              onClick={() => resetMission(true)}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--c-cyan)] text-sm font-bold uppercase tracking-wide text-black transition hover:bg-[var(--c-cyan-bright)]"
            >
              <RotateCcw className="h-4 w-4" /> Rejouer
            </button>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            <HudPanel eyebrow="Telemetry" title="Courbe de la mission">
              <div className="p-3">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={timeline}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="label" stroke="#5b7079" fontSize={11} minTickGap={28} />
                    <YAxis stroke="#5b7079" fontSize={11} width={32} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="productionMw" name="Prod MW" stroke="#34f5b0" fill="#34f5b0" fillOpacity={0.16} strokeWidth={2} />
                    <Area type="monotone" dataKey="demandMw" name="Dem MW" stroke="#ffd447" fill="#ffd447" fillOpacity={0.1} strokeWidth={2} />
                    <Area type="monotone" dataKey="aiLoadMw" name="IA MW" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.08} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </HudPanel>

            <div className="grid gap-4 md:grid-cols-2">
              <HudPanel eyebrow="Grid" title="Bilan énergie">
                <div className="grid gap-3 p-3.5">
                  <BarGauge label="Stabilité" value={m.stability} />
                  <BarGauge label="Score CO₂" value={m.carbon} />
                  <BarGauge label="Coût maîtrisé" value={m.cost} />
                  <BarGauge label="Souveraineté" value={m.sovereignty} />
                </div>
              </HudPanel>
              <HudPanel eyebrow="PromptWatt" title="Bilan IA">
                <div className="grid grid-cols-2 gap-2 p-3.5">
                  <ResultStat label="Jobs terminés" value={completed} accent="#34f5b0" />
                  <ResultStat label="Jobs reportés" value={deferred} accent="#ffd447" />
                  <ResultStat label="Jobs échoués" value={failed} accent={failed > 0 ? "#ff2f5f" : "#fff"} />
                  <ResultStat label="Caches actifs" value={cached} accent="#7dd3fc" />
                  <ResultStat label="Charge IA finale" value={formatMw(m.aiLoadMw)} />
                  <ResultStat label="Productivité IA" value={`${Math.round(m.aiProductivity)}%`} accent="#22d3ee" />
                </div>
              </HudPanel>
            </div>
          </div>

          <div className="space-y-4">
            <HudPanel eyebrow="ATHENA" title="Recommandation">
              <div className="space-y-3 p-4 text-[13px] leading-6 text-zinc-300">
                <p>
                  La meilleure stratégie : lisser les EV avant le pic, reporter les jobs IA non critiques et garder la
                  batterie pour la chute solaire.
                </p>
                <p>
                  Le cœur du jeu reste l’orchestration : l’IA n’est pas coupée, elle est priorisée selon sa valeur, son
                  urgence et la tension réseau.
                </p>
              </div>
            </HudPanel>

            <HudPanel
              eyebrow="Stand démo"
              title="Leaderboard local"
              action={
                <button
                  type="button"
                  onClick={clearLeaderboard}
                  className="rounded border border-[var(--glass-border-soft)] px-2 py-1 text-[11px] text-[var(--c-muted)] hover:text-white"
                >
                  Reset
                </button>
              }
            >
              <div className="grid gap-1.5 p-3">
                {leaderboard.length === 0 && (
                  <p className="rounded border border-[var(--glass-border-soft)] bg-white/[0.02] p-3 text-[12px] text-[var(--c-muted)]">
                    Terminez une mission pour enregistrer un score local.
                  </p>
                )}
                {leaderboard.map((entry, index) => (
                  <div key={entry.id} className="grid grid-cols-[26px_1fr_auto] items-center gap-3 rounded border border-[var(--glass-border-soft)] bg-white/[0.03] p-2.5">
                    <span className="mono text-sm text-[var(--c-muted)]">#{index + 1}</span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-zinc-100">{entry.badge}</p>
                      <p className="text-[10px] text-[var(--c-muted)]">
                        IA {Math.round(entry.aiProductivity)}% · CO₂ {Math.round(entry.carbon)}%
                      </p>
                    </div>
                    <span className="hud-num text-lg text-[var(--c-cyan-bright)]">{Math.round(entry.score)}</span>
                  </div>
                ))}
              </div>
            </HudPanel>
          </div>
        </div>
      </div>
    </main>
  );
}

function ResultStat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded border border-[var(--glass-border-soft)] bg-white/[0.03] p-2.5">
      <p className="hud-eyebrow text-[9px] text-[var(--c-muted)]">{label}</p>
      <p className="hud-num mt-0.5 truncate text-lg" style={{ color: accent ?? "#fff" }}>
        {value}
      </p>
    </div>
  );
}

"use client";

import { ArrowRight, Award, RotateCcw, Trophy } from "lucide-react";
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
import { crisisRunDoctrines, nextCrisisRunWave, parseCrisisRunScenarioId } from "@/content/modes/crisisRun";
import { getNextCampaignMissionDefinition } from "@/content/missions/missionRegistry";
import { leaderboardModeForScenario, useGameStore } from "@/store/gameStore";
import { formatMw } from "@/lib/format";
import { VictoryConfettiOverlay } from "@/components/game/VictoryConfettiOverlay";
import { createMissionDebrief } from "@/game/progression/missionDebrief";
import { createMissionReplay, type MissionReplayFrame } from "@/game/progression/missionReplay";
import { formatObjectiveRule, formatObjectiveValue } from "@/game/progression/objectivePresentation";
import { isMissionUnlocked } from "@/game/progression/campaignProgress";

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
  const progress = useGameStore((state) => state.progress);
  const resetMission = useGameStore((state) => state.resetMission);
  const startMission = useGameStore((state) => state.startMission);
  const startScenario = useGameStore((state) => state.startScenario);
  const clearLeaderboard = useGameStore((state) => state.clearLeaderboard);
  const outcome = game.outcome;
  const m = game.metrics;
  const c = game.cumulative;
  const victory = outcome?.result === "victory";
  const replayMoment = outcome?.replayMoment ?? game.criticalMoments[0];
  const crisisRun = parseCrisisRunScenarioId(game.scenario.id);
  const canContinueCrisisRun = Boolean(crisisRun && crisisRun.waveIndex < 3 && victory);
  const nextCampaignMissionCandidate = victory ? getNextCampaignMissionDefinition(game.scenario.id) : undefined;
  const nextCampaignMission =
    nextCampaignMissionCandidate &&
    isMissionUnlocked(progress, nextCampaignMissionCandidate.id, nextCampaignMissionCandidate.unlockAfter)
      ? nextCampaignMissionCandidate
      : undefined;
  const objectiveResults = outcome?.objectiveResults ?? [];
  const currentLeaderboardMode = leaderboardModeForScenario(game.scenario);
  const comparableLeaderboard = leaderboard.filter(
    (entry) => entry.mode === currentLeaderboardMode && entry.scenarioId === game.scenario.id,
  );
  const leaderboardRows = comparableLeaderboard.length > 0 ? comparableLeaderboard : leaderboard;

  const completed = game.aiJobs.filter((j) => j.status === "completed").length;
  const deferred = game.aiJobs.filter((j) => j.status === "deferred").length;
  const failed = game.aiJobs.filter((j) => j.status === "failed").length;
  const cached = game.aiJobs.filter((j) => j.cached).length;
  const debrief = createMissionDebrief({ metrics: m, cumulative: c, actions: game.actionHistory });
  const replay = createMissionReplay({
    moment: replayMoment,
    timeline,
    actions: game.actionHistory,
  });

  return (
    <main className="relative min-h-screen w-screen overflow-x-hidden bg-[#030a10] text-white">
      <div className="grid-bg pointer-events-none fixed inset-0 opacity-40" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.12),transparent_45%)]" />
      {victory && <VictoryConfettiOverlay seed={`${game.scenario.id}:${Math.round(outcome?.score ?? m.score)}:${outcome?.badge ?? "score"}`} />}

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
            {nextCampaignMission && (
              <button
                type="button"
                onClick={() => startMission(nextCampaignMission.id)}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--c-green)] text-sm font-bold uppercase tracking-wide text-black transition hover:bg-[#86ffd6]"
              >
                <ArrowRight className="h-4 w-4" /> Mission suivante
              </button>
            )}
            <button
              type="button"
              onClick={() => resetMission(true)}
              className={`${nextCampaignMission ? "mt-2" : "mt-4"} inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--c-cyan)] text-sm font-bold uppercase tracking-wide text-black transition hover:bg-[var(--c-cyan-bright)]`}
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
                    <Area type="monotone" dataKey="demandMw" name="Dem MW" stroke="#ff6b5f" fill="#ff6b5f" fillOpacity={0.1} strokeWidth={2} />
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
              <HudPanel eyebrow="Cumul mission" title="Dette opérationnelle">
                <div className="grid grid-cols-2 gap-2 p-3.5">
                  <ResultStat label="Surcharge" value={`${Math.round(c.overloadMinutes)} min`} accent={c.overloadMinutes > 0 ? "#ffd447" : "#34f5b0"} />
                  <ResultStat label="Énergie non servie" value={`${c.unservedEnergyMwh.toFixed(1)} MWh`} accent={c.unservedEnergyMwh > 0 ? "#ff6b5f" : "#34f5b0"} />
                  <ResultStat label="Trips lignes" value={c.lineTrips} accent={c.lineTrips > 0 ? "#ff2f5f" : "#34f5b0"} />
                  <ResultStat label="Capacité dépensée" value={`${Math.round(c.commandCapacitySpent)} CP`} accent="#7dd3fc" />
                  <ResultStat label="Autopilot ATHENA" value={c.athenaAutopilotUses} accent={c.athenaAutopilotUses > 0 ? "#ffd447" : "#34f5b0"} />
                  <ResultStat label="CO₂ cumulé" value={`${c.co2Tons.toFixed(1)} t`} />
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
              {objectiveResults.length > 0 && (
                <HudPanel eyebrow="Objectifs" title="Objectifs mesurés">
                  <div className="grid gap-2 p-3.5">
                    {objectiveResults.map((objective) => (
                      <div
                        key={objective.id}
                        className="grid grid-cols-[1fr_auto] items-center gap-3 rounded border border-[var(--glass-border-soft)] bg-white/[0.03] p-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-semibold text-zinc-100">{objective.label}</p>
                          <p className="mono mt-0.5 text-[10px] text-[var(--c-muted)]">
                            {formatObjectiveRule(objective)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className="hud-num block text-sm"
                            style={{ color: objective.passed ? "#34f5b0" : objective.required ? "#ff2f5f" : "#ffd447" }}
                          >
                            {formatObjectiveValue(objective, objective.value)}
                          </span>
                          <span className="hud-eyebrow text-[8px] text-[var(--c-muted)]">
                            {objective.passed ? "OK" : objective.required ? "Raté" : "Optionnel"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </HudPanel>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <HudPanel eyebrow="ATHENA" title="Recommandation">
              <div className="space-y-3 p-4 text-[13px] leading-6 text-zinc-300">
                <p>
                  Doctrine détectée : <span className="font-semibold text-cyan-100">{debrief.doctrineLabel}</span>.
                </p>
                <p className="text-[12px] leading-5 text-[var(--c-muted)]">{debrief.doctrineDescription}</p>
                <p>{debrief.recommendation}</p>
                <div className="grid gap-2 md:grid-cols-2">
                  <DebriefList title="Points forts" items={debrief.strengths} tone="positive" />
                  <DebriefList title="À surveiller" items={debrief.watchItems} tone="watch" />
                </div>
              </div>
            </HudPanel>

            {replayMoment && (
              <HudPanel eyebrow="Replay" title="Moment critique">
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="hud-eyebrow text-[var(--c-cyan-bright)]">{replayMoment.label} · {replayMoment.kind}</p>
                      <p className="mt-1 text-[14px] font-semibold text-zinc-100">{replayMoment.title}</p>
                    </div>
                    <span
                      className="rounded border px-2 py-1 hud-eyebrow text-[9px]"
                      style={{
                        borderColor: replayMoment.severity === "critical" ? "rgba(255,47,95,.35)" : "rgba(255,212,71,.35)",
                        color: replayMoment.severity === "critical" ? "var(--c-red)" : "var(--c-amber)",
                      }}
                    >
                      {replayMoment.severity}
                    </span>
                  </div>
                  <p className="text-[12px] leading-5 text-zinc-300">{replayMoment.description}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <ResultStat label="Stabilité" value={`${Math.round(replayMoment.stability)}%`} accent={replayMoment.stability < 45 ? "#ff2f5f" : "#34f5b0"} />
                    <ResultStat label="Charge max" value={`${Math.round(replayMoment.maxUtilization * 100)}%`} accent={replayMoment.maxUtilization > 1 ? "#ffd447" : "#34f5b0"} />
                    <ResultStat label="Réserve" value={formatMw(replayMoment.reserveMw)} accent={replayMoment.reserveMw < 0 ? "#ff2f5f" : "#34f5b0"} />
                  </div>
                  {replay && (
                    <div className="rounded border border-[var(--glass-border-soft)] bg-black/25 p-3">
                      <div className="mb-2 grid grid-cols-[1fr_auto_auto] items-center gap-2">
                        <p className="hud-eyebrow text-[9px] text-[var(--c-muted)]">Fenêtre de crise</p>
                        <ReplayDelta label="Stabilité" value={replay.stabilityRecovery} suffix=" pts" />
                        <ReplayDelta label="Réserve" value={replay.reserveRecoveryMw} suffix=" MW" />
                      </div>
                      <div className="grid gap-1.5">
                        {replay.frames.map((frame) => (
                          <ReplayFrameRow key={frame.minute} frame={frame} peakDemandMw={replay.peakDemandMw} />
                        ))}
                      </div>
                      <div className="mt-3 border-t border-white/10 pt-3">
                        <p className="hud-eyebrow mb-2 text-[9px] text-[var(--c-muted)]">Réponse opérateur</p>
                        {replay.actions.length === 0 ? (
                          <p className="rounded border border-[var(--glass-border-soft)] bg-white/[0.02] p-2 text-[11px] text-[var(--c-muted)]">
                            Aucune commande dans les minutes suivant le pic.
                          </p>
                        ) : (
                          <div className="grid gap-1.5">
                            {replay.actions.map((action) => (
                              <div
                                key={`${action.minute}-${action.actionLabel}-${action.targetLabel ?? "grid"}`}
                                className="grid grid-cols-[44px_1fr_auto] items-center gap-2 rounded border border-[var(--glass-border-soft)] bg-white/[0.03] px-2 py-1.5"
                              >
                                <span className="mono text-[10px] text-[var(--c-muted)]">{action.label}</span>
                                <span className="min-w-0 truncate text-[11px] font-semibold text-zinc-100">
                                  {action.actionLabel}
                                  {action.targetLabel ? <span className="text-[var(--c-muted)]"> · {action.targetLabel}</span> : null}
                                </span>
                                <span
                                  className="hud-eyebrow text-[9px]"
                                  style={{ color: action.impact === "positive" ? "var(--c-green)" : action.impact === "mixed" ? "var(--c-amber)" : "var(--c-red)" }}
                                >
                                  {action.tacticalScore ? `+${action.tacticalScore}` : action.cost ? `${action.cost} CP` : action.impact}
                                </span>
                                {action.comboLabel && (
                                  <span className="col-span-2 col-start-2 mono -mt-1 text-[9px] text-[var(--c-green)]">
                                    {action.comboLabel}
                                    {action.comboLevel ? ` x${action.comboLevel}` : ""}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </HudPanel>
            )}

            {canContinueCrisisRun && (
              <HudPanel eyebrow="Crisis Run" title="Doctrine suivante">
                <div className="grid gap-2 p-3">
                  {crisisRunDoctrines.map((doctrine) => {
                    const nextWave = nextCrisisRunWave(game.scenario.id, doctrine);
                    if (!nextWave) return null;
                    return (
                      <button
                        key={doctrine.id}
                        type="button"
                        onClick={() => startScenario(nextWave)}
                        className="rounded border border-[var(--c-cyan)]/25 bg-[var(--c-cyan)]/[0.06] p-2.5 text-left transition hover:border-[var(--c-cyan)]/50 hover:bg-[var(--c-cyan)]/[0.1]"
                      >
                        <span className="block text-[13px] font-semibold text-cyan-50">{doctrine.label}</span>
                        <span className="mt-0.5 block text-[11px] leading-4 text-[var(--c-muted)]">{doctrine.description}</span>
                      </button>
                    );
                  })}
                </div>
              </HudPanel>
            )}

            <HudPanel
              eyebrow="Stand démo"
              title={comparableLeaderboard.length > 0 ? "Leaderboard scénario" : "Leaderboard local"}
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
                {leaderboardRows.length === 0 && (
                  <p className="rounded border border-[var(--glass-border-soft)] bg-white/[0.02] p-3 text-[12px] text-[var(--c-muted)]">
                    Terminez une mission pour enregistrer un score local.
                  </p>
                )}
                {leaderboardRows.map((entry, index) => (
                  <div key={entry.id} className="grid grid-cols-[26px_1fr_auto] items-center gap-3 rounded border border-[var(--glass-border-soft)] bg-white/[0.03] p-2.5">
                    <span className="mono text-sm text-[var(--c-muted)]">#{index + 1}</span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-zinc-100">{entry.badge}</p>
                      <p className="text-[10px] text-[var(--c-muted)]">
                        {entry.scenarioName} · IA {Math.round(entry.aiProductivity)}% · CO₂ {Math.round(entry.carbon)}%
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

function ReplayDelta({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  const positive = value >= 0;
  return (
    <span className="mono text-[10px]" style={{ color: positive ? "var(--c-green)" : "var(--c-red)" }}>
      {label} {positive ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

function ReplayFrameRow({ frame, peakDemandMw }: { frame: MissionReplayFrame; peakDemandMw: number }) {
  const demandRatio = peakDemandMw > 0 ? Math.max(8, Math.min(100, (frame.demandMw / peakDemandMw) * 100)) : 0;
  const incident = frame.role === "incident";
  return (
    <div
      className={`grid grid-cols-[42px_1fr_42px_48px] items-center gap-2 rounded border px-2 py-1.5 ${
        incident ? "border-[var(--c-red)]/35 bg-[var(--c-red)]/[0.08]" : "border-[var(--glass-border-soft)] bg-white/[0.025]"
      }`}
    >
      <span className="mono text-[10px] text-[var(--c-muted)]">{frame.label}</span>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${demandRatio}%`,
            background: incident ? "var(--c-red)" : "linear-gradient(90deg,var(--c-cyan),var(--c-green))",
            boxShadow: incident ? "0 0 10px rgba(255,47,95,0.55)" : "0 0 10px rgba(34,211,238,0.25)",
          }}
        />
      </div>
      <span className="hud-num text-right text-[12px]" style={{ color: frame.stability < 45 ? "var(--c-red)" : "var(--c-green)" }}>
        {Math.round(frame.stability)}%
      </span>
      <span className="mono text-right text-[10px]" style={{ color: frame.reserveMw < 0 ? "var(--c-red)" : "var(--c-muted)" }}>
        {Math.round(frame.reserveMw)} MW
      </span>
    </div>
  );
}

function DebriefList({ title, items, tone }: { title: string; items: string[]; tone: "positive" | "watch" }) {
  const accent = tone === "positive" ? "var(--c-green)" : "var(--c-amber)";
  return (
    <div className="rounded border border-[var(--glass-border-soft)] bg-white/[0.025] p-2.5">
      <p className="hud-eyebrow text-[9px]" style={{ color: accent }}>
        {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="rounded border px-2 py-1 text-[10px] font-semibold leading-none"
            style={{
              background: tone === "positive" ? "rgba(52,245,176,0.08)" : "rgba(255,212,71,0.08)",
              borderColor: tone === "positive" ? "rgba(52,245,176,0.22)" : "rgba(255,212,71,0.22)",
              color: tone === "positive" ? "#b9ffe7" : "#ffe7a3",
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

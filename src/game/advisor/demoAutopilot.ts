import { getAdvisorOptions, type AdvisorOption } from "@/game/advisor/options";
import type { CommandTarget, GameState, PlayerCommand } from "@/game/types";

export interface AthenaDemoDecision {
  action: AdvisorOption["action"];
  command: PlayerCommand;
  target?: CommandTarget;
  targetLabel?: string;
  urgency: "critical" | "active" | "setup";
}

function hasUnresolvedIncident(state: GameState) {
  return state.incidents.some((incident) => !incident.resolvedAt);
}

function hasCriticalPressure(state: GameState) {
  return (
    state.metrics.stability < 42 ||
    state.metrics.reserveMw < -4 ||
    state.grid.maxUtilization > 0.98 ||
    state.incidents.some((incident) => !incident.resolvedAt && incident.severity === "critical") ||
    state.flags.agentLoop
  );
}

function hasActivePressure(state: GameState) {
  return (
    hasCriticalPressure(state) ||
    state.metrics.stability < 56 ||
    state.metrics.reserveMw < 8 ||
    state.grid.maxUtilization > 0.9 ||
    hasUnresolvedIncident(state) ||
    state.flags.evSurge ||
    state.flags.solarDrop ||
    state.flags.cyberPriority
  );
}

function demoCadenceMinutes(state: GameState) {
  return hasCriticalPressure(state) ? 5 : hasActivePressure(state) ? 12 : 20;
}

function canRunAtMinute(state: GameState, lastCommandMinute?: number) {
  if (lastCommandMinute === undefined) return true;
  return state.minute - lastCommandMinute >= demoCadenceMinutes(state);
}

function shouldRunSetupAction(state: GameState) {
  return state.actionHistory.length === 0 && state.minute >= state.scenario.startMinute + state.scenario.tickMinutes;
}

function actionLimit(state: GameState, critical: boolean, active: boolean, setup: boolean) {
  if (critical) return state.grid.maxUtilization > 1.08 || state.metrics.stability < 34 ? 4 : 3;
  if (active) return 2;
  if (setup) return 1;
  return 0;
}

function viableOption(option: AdvisorOption) {
  return !option.cooldownBlocked && !option.capacityBlocked;
}

function hasActiveEffect(state: GameState, action: AdvisorOption["action"]) {
  return state.activeEffects.some((effect) => effect.action === action && effect.expiresAt > state.minute);
}

function completedAiJobs(state: GameState) {
  return state.aiJobs.filter((job) => job.status === "completed").length;
}

function remainingAiCompletionTarget(state: GameState) {
  return Math.max(
    0,
    ...state.scenario.objectiveChecks
      .filter((objective) => objective.metric === "completedAiJobs")
      .map((objective) => objective.target - completedAiJobs(state)),
  );
}

function scoreDemoOption(state: GameState, option: AdvisorOption) {
  const activePressure = hasActivePressure(state);
  const criticalPressure = hasCriticalPressure(state);
  const reserveShortfall = Math.max(0, 10 - state.metrics.reserveMw);
  const stabilityShortfall = Math.max(0, 56 - state.metrics.stability);
  const linePressure = Math.max(0, state.grid.maxUtilization - 0.88) * 100;
  const aiJobsStillNeeded = remainingAiCompletionTarget(state);
  const costPenalty = option.cost * 0.85;
  const reserveGain = Math.max(0, option.reserveDeltaMw) * (activePressure ? 2.2 : 0.25);
  let score = reserveGain + linePressure - costPenalty;

  if (option.reason === "recommended") score += 18;

  switch (option.action) {
    case "agent_timeout":
      score += state.flags.agentLoop ? 180 : 18;
      break;
    case "import_energy":
      score += activePressure ? 96 + reserveShortfall * 2.4 + stabilityShortfall * 1.6 : -30;
      if (state.flags.solarDrop || state.flags.residentialPeak) score += 22;
      break;
    case "thermal_backup":
      score += criticalPressure || state.metrics.reserveMw < -14 ? 58 + reserveShortfall * 2.1 + stabilityShortfall * 2.4 : -120;
      break;
    case "discharge_battery":
      score += activePressure ? 78 + reserveShortfall * 1.8 + stabilityShortfall * 1.2 : -25;
      if (state.metrics.batteryLevel < 30) score -= 35;
      break;
    case "smart_ev":
      score += state.flags.evSurge ? 110 : -20;
      if (hasActiveEffect(state, "smart_ev")) score -= 180;
      break;
    case "activate_cache":
      score += 72;
      break;
    case "migrate_ai":
      score += 58;
      break;
    case "reduce_model":
      score += aiJobsStillNeeded > 0 ? 44 : 55;
      break;
    case "defer_ai":
      score += aiJobsStillNeeded > 0 ? -45 : 48;
      if (state.metrics.reserveMw < -28 || state.metrics.stability < 30) score += 38;
      break;
    case "externalize_ai":
      score += 40;
      break;
    default:
      break;
  }

  return score;
}

function selectDemoOptions(state: GameState, limit: number) {
  const sorted = getAdvisorOptions(state, 10)
    .filter(viableOption)
    .sort((a, b) => scoreDemoOption(state, b) - scoreDemoOption(state, a));
  const selected: AdvisorOption[] = [];
  let remainingCapacity = state.commandCapacity;

  for (const option of sorted) {
    if (option.cost > remainingCapacity) continue;
    selected.push(option);
    remainingCapacity -= option.cost;
    if (selected.length >= limit) break;
  }

  return selected;
}

export function getAthenaDemoDecisions(
  state: GameState,
  lastCommandMinute?: number,
): AthenaDemoDecision[] {
  if (state.phase !== "running" || state.outcome) return [];
  if (!canRunAtMinute(state, lastCommandMinute)) return [];

  const critical = hasCriticalPressure(state);
  const active = hasActivePressure(state);
  const setup = shouldRunSetupAction(state);
  const limit = actionLimit(state, critical, active, setup);
  if (limit === 0) return [];

  const selected = selectDemoOptions(state, limit);

  return selected.map((option) => ({
    action: option.action,
    command: { ...option.command, source: "demo" },
    target: option.command.target,
    targetLabel: option.targetLabel,
    urgency: critical ? "critical" : active ? "active" : "setup",
  }));
}

export function getAthenaDemoDecision(
  state: GameState,
  lastCommandMinute?: number,
): AthenaDemoDecision | undefined {
  return getAthenaDemoDecisions(state, lastCommandMinute)[0];
}

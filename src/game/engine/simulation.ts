import { getActionDefinition } from "@/game/actions";
import { getAdvisorRecommendation } from "@/game/advisor/rules";
import { captureActionFeedbackState, createActionFeedback } from "@/game/commands/actionFeedback";
import { isActionAvailable } from "@/game/commands/commandAvailability";
import { getCommandCost } from "@/game/commands/commandCosts";
import { getContractCurtailmentImpact, getOrganizationFlexOffer } from "@/game/domain/contractImpact";
import { createInitialGrid } from "@/game/network/franceGridData";
import {
  criticalConsumerDemandMw,
  criticalConsumerUnservedMw,
  defaultNodeTargetForAction,
  effectNodeTargetForAction,
  hasTrippedCriticalConsumerFeeder,
} from "@/game/network/gridSelectors";
import { solveGridTick } from "@/game/simulation/grid";
import type {
  ActionRecord,
  ActiveEffect,
  ActiveIncident,
  AIJob,
  AssistantMessage,
  CommandTarget,
  CriticalMoment,
  CumulativeMetrics,
  EnergyAsset,
  GameMetrics,
  GameState,
  IncidentSource,
  PlayerCommand,
  PlayerActionType,
  ObjectiveMetric,
  ObjectiveResult,
  Scenario,
  TimelineSnapshot,
} from "@/game/types";
import { formatClock } from "@/lib/format";
import { clamp, round } from "@/lib/math";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function makeId(prefix: string, state: GameState) {
  return `${prefix}-${state.minute}-${state.tick}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function timelinePoint(state: GameState, metrics = state.metrics): TimelineSnapshot {
  return {
    minute: state.minute,
    label: formatClock(state.minute),
    productionMw: round(metrics.productionMw),
    demandMw: round(metrics.demandMw),
    stability: round(metrics.stability),
    batteryLevel: round(metrics.batteryLevel),
    aiLoadMw: round(metrics.aiLoadMw),
    carbon: round(metrics.carbon),
    score: round(metrics.score),
  };
}

function makeCriticalMoment(
  state: GameState,
  moment: Omit<CriticalMoment, "id" | "minute" | "label" | "stability" | "maxUtilization" | "reserveMw">,
): CriticalMoment {
  return {
    id: `moment-${state.minute}-${moment.kind}-${moment.entityId ?? "grid"}`,
    minute: state.minute,
    label: formatClock(state.minute),
    stability: state.metrics.stability,
    maxUtilization: state.grid.maxUtilization,
    reserveMw: state.metrics.reserveMw,
    ...moment,
  };
}

function rememberCriticalMoment(state: GameState, moment: CriticalMoment) {
  const previous = state.criticalMoments.find((item) => item.id === moment.id);
  if (previous) return;

  state.criticalMoments = [...state.criticalMoments, moment]
    .sort((a, b) => {
      const severityDelta =
        (b.severity === "critical" ? 2 : b.severity === "warning" ? 1 : 0) -
        (a.severity === "critical" ? 2 : a.severity === "warning" ? 1 : 0);
      if (severityDelta !== 0) return severityDelta;
      return b.maxUtilization - a.maxUtilization || a.minute - b.minute;
    })
    .slice(0, 8);
}

type DifficultyRules = {
  victoryMinStability: number;
  victoryMinCriticalContinuity: number;
  failureMinStability: number;
  failureMinCriticalContinuity: number;
  cumulativePenaltyMultiplier: number;
};

const DIFFICULTY_RULES: Record<Scenario["difficulty"], DifficultyRules> = {
  tutorial: {
    victoryMinStability: 38,
    victoryMinCriticalContinuity: 70,
    failureMinStability: 0,
    failureMinCriticalContinuity: 18,
    cumulativePenaltyMultiplier: 0.82,
  },
  standard: {
    victoryMinStability: 45,
    victoryMinCriticalContinuity: 75,
    failureMinStability: 0,
    failureMinCriticalContinuity: 20,
    cumulativePenaltyMultiplier: 1,
  },
  hard: {
    victoryMinStability: 48,
    victoryMinCriticalContinuity: 82,
    failureMinStability: 4,
    failureMinCriticalContinuity: 24,
    cumulativePenaltyMultiplier: 1.16,
  },
  expert: {
    victoryMinStability: 50,
    victoryMinCriticalContinuity: 86,
    failureMinStability: 8,
    failureMinCriticalContinuity: 28,
    cumulativePenaltyMultiplier: 1.32,
  },
};

export function difficultyRulesForScenario(scenario: Pick<Scenario, "difficulty">): DifficultyRules {
  return DIFFICULTY_RULES[scenario.difficulty];
}

function addAssistantMessage(
  state: GameState,
  message: Omit<AssistantMessage, "id" | "minute">,
) {
  state.assistantMessages.unshift({
    id: makeId("athena", state),
    minute: state.minute,
    ...message,
  });
  state.assistantMessages = state.assistantMessages.slice(0, 16);
}

function addActionRecord(
  state: GameState,
  record: Omit<ActionRecord, "id" | "minute">,
) {
  state.actionHistory.unshift({
    id: makeId("action", state),
    minute: state.minute,
    ...record,
  });
  state.actionHistory = state.actionHistory.slice(0, 18);
}

function openIncident(
  state: GameState,
  incident: Omit<ActiveIncident, "openedAt">,
) {
  const existing = state.incidents.find((item) => item.id === incident.id);
  if (existing) {
    existing.resolvedAt = undefined;
    return;
  }

  state.incidents.unshift({
    ...incident,
    openedAt: state.minute,
  });
}

function resolveIncident(state: GameState, id: string) {
  const incident = state.incidents.find((item) => item.id === id && !item.resolvedAt);
  if (incident) {
    incident.resolvedAt = state.minute;
  }
}

function upsertEffect(state: GameState, effect: Omit<ActiveEffect, "id" | "startedAt">) {
  state.activeEffects = state.activeEffects.filter(
    (item) => item.action !== effect.action || item.target?.id !== effect.target?.id,
  );
  state.activeEffects.push({
    id: makeId("effect", state),
    startedAt: state.minute,
    ...effect,
  });
}

function getEffectMagnitude(state: GameState, action: PlayerActionType, targetId?: string) {
  return state.activeEffects
    .filter(
      (effect) =>
        effect.action === action &&
        effect.expiresAt >= state.minute &&
        (!targetId || effect.target?.id === targetId),
    )
    .reduce((total, effect) => total + effect.magnitude, 0);
}

function createInitialCumulativeMetrics(): CumulativeMetrics {
  return {
    overloadMinutes: 0,
    criticalLineMinutes: 0,
    unservedEnergyMwh: 0,
    criticalUnservedEnergyMwh: 0,
    co2Tons: 0,
    operatingCost: 0,
    aiValueDelivered: 0,
    wastedAiEnergyMwh: 0,
    commandCapacitySpent: 0,
    athenaAutopilotUses: 0,
    emergencyActions: 0,
    lineTrips: 0,
  };
}

function activeCommandId(command: PlayerCommand, state: GameState) {
  return `cmd-${command.action}-${command.target?.id ?? "grid"}-${state.minute}`;
}

function addActiveCommand(
  state: GameState,
  command: PlayerCommand,
  label: string,
  cost: number,
  durationMinutes: number,
) {
  state.activeCommands.push({
    id: activeCommandId(command, state),
    label,
    command,
    startedAt: state.minute,
    expiresAt: state.minute + durationMinutes,
    cost,
  });
  state.activeCommands = state.activeCommands.slice(-24);
}

function targetLabel(state: GameState, target?: CommandTarget) {
  if (!target) return "Réseau national";
  if (target.kind === "line") return state.grid.lines.find((line) => line.id === target.id)?.label ?? target.id;
  if (target.kind === "node") return state.grid.nodes.find((node) => node.id === target.id)?.label ?? target.id;
  if (target.kind === "workload") return state.aiJobs.find((job) => job.id === target.id)?.name ?? target.id;
  return target.id;
}

function normalizeCommand(actionOrCommand: PlayerActionType | PlayerCommand): PlayerCommand {
  if (typeof actionOrCommand === "string") return { action: actionOrCommand, source: "player" };
  return { source: "player", ...actionOrCommand };
}

function commandDuration(command: PlayerCommand) {
  const definition = getActionDefinition(command.action);
  return command.durationMinutes ?? definition?.defaultDurationMinutes ?? 20;
}

function commandMagnitude(command: PlayerCommand) {
  const definition = getActionDefinition(command.action);
  return command.intensityMw ?? definition?.defaultIntensityMw ?? 0;
}

function commandCost(state: GameState, command: PlayerCommand) {
  return getCommandCost(command, state.scenario);
}

function activeOrThrottled(job: AIJob) {
  return job.status === "active" || job.status === "throttled";
}

function computeAiJobPower(state: GameState, job: AIJob) {
  if (!activeOrThrottled(job) || job.externalized) return 0;

  const cacheFactor = job.cached ? 0.82 : 1;
  const throttleFactor = job.status === "throttled" ? 0.82 : 1;
  const loopFactor =
    job.id === "looping-agent" && state.flags.agentLoop && !job.timeoutApplied ? 2.45 : 1;
  const timeoutFactor = job.timeoutApplied ? 0.42 : 1;

  return round(job.basePowerMw * job.modelScale * cacheFactor * throttleFactor * loopFactor * timeoutFactor, 1);
}

function maybeActivateJob(state: GameState, job: AIJob) {
  if (job.status !== "queued" && job.status !== "deferred") return;
  if (state.minute < job.startMinute) return;
  if (job.deferredUntil && state.minute < job.deferredUntil) return;

  job.status = "active";
  job.currentPowerMw = computeAiJobPower(state, job);
}

function updateAiJobs(state: GameState) {
  for (const job of state.aiJobs) {
    maybeActivateJob(state, job);

    if (activeOrThrottled(job)) {
      job.currentPowerMw = computeAiJobPower(state, job);

      const baseGain = job.kind === "video" ? 7 : job.kind === "cyber" ? 10 : 8;
      const cacheGain = job.cached ? 1.08 : 1;
      const throttleGain = job.status === "throttled" ? 0.82 : 1;
      const loopPenalty =
        job.id === "looping-agent" && state.flags.agentLoop && !job.timeoutApplied ? 0.12 : 1;
      const externalizedGain = job.externalized ? 0.72 : 1;
      const gain = baseGain * cacheGain * throttleGain * loopPenalty * externalizedGain;

      job.progress = clamp(job.progress + gain, 0, 100);

      if (job.progress >= 100) {
        job.status = "completed";
        job.currentPowerMw = 0;
      }

      if (state.minute > job.deadlineMinute && job.progress < 100) {
        if (job.criticality === "critical") {
          job.status = "failed";
          job.currentPowerMw = 0;
          openIncident(state, {
            id: "critical-job-failed",
            title: "Job critique échoué",
            description: "La détection cyber n'a pas été traitée avant sa deadline.",
            severity: "critical",
            source: "ai",
          });
        } else if (job.status !== "deferred") {
          job.status = "failed";
          job.currentPowerMw = 0;
        }
      }
    } else {
      job.currentPowerMw = 0;
    }
  }
}

function updateAiJobPowers(state: GameState) {
  for (const job of state.aiJobs) {
    job.currentPowerMw = activeOrThrottled(job) ? computeAiJobPower(state, job) : 0;
  }
}

function applyScenarioEventEffects(state: GameState, event: Scenario["events"][number]) {
  for (const effect of event.effects ?? []) {
    if (effect.type === "set_flag" && effect.flag) {
      state.flags[effect.flag] = effect.value ?? true;
    }

    if (effect.type === "activate_ai_job" && effect.jobId) {
      const job = state.aiJobs.find((item) => item.id === effect.jobId);
      if (job && job.status !== "deferred" && job.status !== "completed" && job.status !== "failed") {
        job.status = "active";
        job.currentPowerMw = computeAiJobPower(state, job);
      }
    }

    if (effect.type === "trip_line" && effect.lineId) {
      const line = state.grid.lines.find((item) => item.id === effect.lineId);
      if (line && !line.tripped) {
        line.tripped = true;
        line.protectionState = "tripped";
        line.repairUntil = undefined;
        line.temperatureC = Math.max(line.temperatureC, 94);
        line.tripCount += 1;
        line.causes = [...new Set([...line.causes, event.title])];
      }
    }
  }
}

function eventSource(event: Scenario["events"][number]): IncidentSource {
  if (event.source) return event.source;
  if (event.effects?.some((effect) => effect.type === "activate_ai_job")) return "ai";
  if (event.effects?.some((effect) => effect.type === "set_flag")) return "weather";
  return "grid";
}

function isScenarioEventResolved(state: GameState, event: Scenario["events"][number]): boolean {
  const rules = event.resolvesWhen ?? [];
  if (rules.length === 0 && event.effects?.some((effect) => effect.type === "trip_line")) {
    return event.effects
      .filter((effect) => effect.type === "trip_line" && effect.lineId)
      .every((effect) => !state.grid.lines.find((line) => line.id === effect.lineId)?.tripped);
  }

  return rules.some((rule) => {
    if (rule.type === "effect_active") return getEffectMagnitude(state, rule.action) > 0;
    if (rule.type === "job_status") {
      const job = state.aiJobs.find((item) => item.id === rule.jobId);
      return job ? rule.statuses.includes(job.status) : false;
    }
    if (rule.type === "flag_false") return state.flags[rule.flag] === false;
    if (rule.type === "stability_above") {
      const flagSatisfied = rule.flag ? state.flags[rule.flag] === true : true;
      return flagSatisfied && state.metrics.stability > rule.threshold;
    }
    return false;
  });
}

function processScenarioEvents(state: GameState) {
  for (const event of state.scenario.events) {
    if (state.triggeredEventIds.includes(event.id) || event.minute > state.minute) continue;

    state.triggeredEventIds.push(event.id);
    applyScenarioEventEffects(state, event);
    openIncident(state, {
      id: event.id,
      title: event.title,
      description: event.description,
      severity: event.severity,
      source: eventSource(event),
    });

    addAssistantMessage(state, {
      title: event.title,
      body: event.description,
      tone: event.severity,
    });

    if (event.severity === "critical") {
      addAssistantMessage(state, {
        title: "Incident critique",
        body: "ATHENA signale un incident critique. Gardez la simulation active et priorisez une commande ciblée.",
        tone: "warning",
      });
    }
  }
}

// Production/demand are aggregates *of the grid* the engine solved this tick,
// so the HUD's national totals always equal the sum of what the map shows.
function productionForKind(state: GameState, kind: string) {
  return state.grid.nodes
    .filter((node) => node.kind === kind)
    .reduce((sum, node) => sum + node.productionMw, 0);
}

function productionForAction(state: GameState, action: PlayerActionType) {
  return state.grid.nodes
    .filter((node) => node.runtime?.production?.effectAction === action)
    .reduce((sum, node) => sum + node.productionMw, 0);
}

function demandForKind(state: GameState, kind: string) {
  return state.grid.nodes
    .filter((node) => node.kind === kind)
    .reduce((sum, node) => sum + node.demandMw, 0);
}

function computeProduction(state: GameState) {
  const thermal = getEffectMagnitude(state, "thermal_backup");
  const thermalBackedProduction = productionForAction(state, "thermal_backup");
  const solar = productionForKind(state, "solar");
  const wind = productionForKind(state, "wind");
  const battery = productionForKind(state, "battery");
  const imported = state.grid.nodes
    .filter((node) => node.kind === "interconnect" || node.runtime?.production?.effectAction === "import_energy")
    .reduce((sum, node) => sum + node.productionMw, 0);
  const nuclear = state.grid.nodes
    .filter((node) => node.kind === "nuclear" && node.runtime?.production?.effectAction !== "thermal_backup")
    .reduce((sum, node) => sum + node.productionMw, 0);
  // Dispatchable low-carbon production is tracked separately from its carbon-heavy boost.
  const hydro = Math.max(0, thermalBackedProduction - thermal);
  const total = state.grid.nodes.reduce((sum, node) => sum + node.productionMw, 0);

  return {
    nuclear: round(nuclear, 1),
    solar: round(solar, 1),
    wind: round(wind, 1),
    hydro: round(hydro, 1),
    battery: round(battery, 1),
    imported: round(imported, 1),
    thermal: round(thermal, 1),
    total: round(total, 1),
  };
}

function computeDemand(state: GameState) {
  const ai = state.aiJobs.reduce((total, job) => total + job.currentPowerMw, 0);
  const total = state.grid.nodes.reduce((sum, node) => sum + node.demandMw, 0);

  return {
    residential: round(demandForKind(state, "city"), 1),
    industry: round(demandForKind(state, "industry"), 1),
    hospital: round(demandForKind(state, "hospital"), 1),
    event: 0,
    ev: round(demandForKind(state, "ev"), 1),
    ai: round(ai, 1),
    total: round(total, 1),
  };
}

function activeContractCurtailmentImpact(state: GameState) {
  return state.activeEffects.reduce(
    (total, effect) => {
      if (effect.action !== "curtail_industry" || effect.target?.kind !== "node") return total;
      const node = state.grid.nodes.find((item) => item.id === effect.target?.id);
      const impact = getContractCurtailmentImpact(node, effect.magnitude, effect.expiresAt - effect.startedAt);
      return {
        costPenalty: total.costPenalty + impact.costPenalty,
        reputationPenalty: total.reputationPenalty + impact.reputationPenalty,
      };
    },
    { costPenalty: 0, reputationPenalty: 0 },
  );
}

function updateAssetPowers(
  assets: EnergyAsset[],
  production: ReturnType<typeof computeProduction>,
  demand: ReturnType<typeof computeDemand>,
  metrics: GameMetrics,
) {
  const powerById: Record<string, number> = {
    nuclear: production.nuclear,
    solar: production.solar,
    wind: production.wind,
    hydro: production.hydro,
    battery: production.battery,
    datacenter: demand.ai,
    hospital: demand.hospital,
    residential: demand.residential,
    industry: demand.industry,
    ev: demand.ev,
    vivatech: demand.event,
  };

  return assets.map((asset) => {
    const powerMw = round(powerById[asset.id] ?? asset.powerMw, 1);
    let status = asset.status;

    if (asset.id === "battery") {
      status = metrics.batteryLevel < 20 ? "critical" : metrics.batteryLevel < 38 ? "watch" : "stable";
    } else if (asset.kind === "load" || asset.kind === "datacenter") {
      const loadRatio = asset.maxPowerMw > 0 ? powerMw / asset.maxPowerMw : 0;
      status = loadRatio > 0.9 || metrics.stability < 35 ? "critical" : loadRatio > 0.72 ? "watch" : "stable";
    } else if (asset.id === "solar" && production.solar < 8) {
      status = "critical";
    } else {
      status = metrics.reserveMw < -18 ? "watch" : "stable";
    }

    return {
      ...asset,
      powerMw,
      status,
    };
  });
}

function computeAiProductivity(state: GameState) {
  const weightedValue = state.aiJobs.reduce((total, job) => {
    const criticalBoost = job.criticality === "critical" ? 1.5 : job.criticality === "high" ? 1.2 : 1;
    const failedPenalty = job.status === "failed" ? -job.value * 1.1 : 0;
    return total + (job.progress / 100) * job.value * criticalBoost + failedPenalty;
  }, 0);

  return clamp(48 + weightedValue, 0, 100);
}

function computeMetrics(state: GameState, mode: "tick" | "instant" = "tick"): GameMetrics {
  const production = computeProduction(state);
  const demand = computeDemand(state);
  const previous = state.metrics;
  const reserveMw = round(production.total - demand.total, 1);
  const unresolvedCritical = state.incidents.filter(
    (incident) => !incident.resolvedAt && incident.severity === "critical",
  ).length;
  const unresolvedWarnings = state.incidents.filter(
    (incident) => !incident.resolvedAt && incident.severity === "warning",
  ).length;
  const externalizedAiMw = state.aiJobs.reduce(
    (total, job) =>
      total + (job.externalized && activeOrThrottled(job) ? job.basePowerMw * job.modelScale : 0),
    0,
  );
  const contractImpact = activeContractCurtailmentImpact(state);

  const reserveDelta =
    reserveMw >= 0 ? Math.min(1.9, reserveMw / 17) : Math.max(-3.45, reserveMw / 14);
  const incidentPenalty = unresolvedCritical * 0.32 + unresolvedWarnings * 0.1;
  // Grid-specific stress the national balance alone can't see: line congestion
  // and tripped critical corridors. (Deficit itself is already in reserveDelta.)
  const trippedCritical = state.grid.lines.filter((line) => line.tripped && line.isCritical).length;
  const gridStress = state.grid.overloadMw * 0.05 + trippedCritical * 5;
  const stability =
    mode === "tick"
      ? clamp(previous.stability + reserveDelta - incidentPenalty - gridStress)
      : previous.stability;

  const batteryDispatch = production.battery;
  const batteryRecharge =
    reserveMw > 22 && batteryDispatch === 0 && state.minute < 18 * 60 + 40 ? 1.2 : 0;
  const batteryLevel =
    mode === "tick"
      ? clamp(previous.batteryLevel - batteryDispatch * 0.12 + batteryRecharge)
      : previous.batteryLevel;

  const carbon =
    mode === "tick"
      ? clamp(
          previous.carbon +
            (production.thermal > 0 ? -3.4 : 0.14) +
            (production.imported > 0 ? -1.1 : 0.08) +
            (production.solar + production.wind > 32 ? 0.16 : -0.08) -
            externalizedAiMw * 0.015,
        )
      : previous.carbon;

  const cost =
    mode === "tick"
      ? clamp(
          previous.cost -
            (production.imported > 0 ? 1.25 : 0) -
            (production.thermal > 0 ? 2.2 : 0) -
            (reserveMw < -15 ? 0.35 : 0) +
            (reserveMw > 8 ? 0.08 : 0) -
            externalizedAiMw * 0.025 -
            contractImpact.costPenalty,
        )
      : previous.cost;

  const sovereignty =
    mode === "tick"
      ? clamp(previous.sovereignty - (production.imported > 0 ? 1.4 : 0) + 0.04 - externalizedAiMw * 0.045)
      : previous.sovereignty;

  const publicSatisfaction =
    mode === "tick"
      ? clamp(
          previous.publicSatisfaction -
            (stability < 45 ? 0.8 : 0) -
            (stability < 25 ? 2.4 : 0) -
            (getEffectMagnitude(state, "smart_ev") > 0 ? 0.22 : 0) +
            (stability > 65 ? 0.08 : 0) -
            contractImpact.reputationPenalty,
        )
      : previous.publicSatisfaction;

  const cyberFailed = state.aiJobs.some((job) => job.criticality === "critical" && job.status === "failed");
  const criticalUnserved = criticalConsumerUnservedMw(state);
  const criticalDemand = Math.max(1, criticalConsumerDemandMw(state));
  const criticalUnservedRatio = criticalUnserved / criticalDemand;
  const criticalFeederTripped = hasTrippedCriticalConsumerFeeder(state);
  const criticalContinuity =
    mode === "tick"
      ? clamp(
          previous.criticalContinuity -
            (stability < 22 ? 6 : 0) -
            (cyberFailed ? 18 : 0) -
            (criticalUnserved > 1 ? Math.max(0.8, criticalUnservedRatio * 14) : 0) -
            (criticalFeederTripped ? 5 : 0) +
            (stability > 55 ? 0.08 : 0),
        )
      : previous.criticalContinuity;

  const aiProductivity = computeAiProductivity(state);
  const co2Intensity = round(
    38 +
      production.thermal * 6.8 +
      production.imported * 2.2 -
      (production.solar + production.wind) * 0.35,
    1,
  );

  const difficultyRules = difficultyRulesForScenario(state.scenario);
  const cumulativePenalty =
    (state.cumulative.overloadMinutes * 0.45 +
      state.cumulative.criticalLineMinutes * 0.9 +
      state.cumulative.unservedEnergyMwh * 2.2 +
      state.cumulative.criticalUnservedEnergyMwh * 22 +
      state.cumulative.lineTrips * 22 +
      state.cumulative.athenaAutopilotUses * 18 +
      Math.max(0, state.cumulative.commandCapacitySpent - 85) * 0.8) *
    difficultyRules.cumulativePenaltyMultiplier;

  const score = clamp(
    stability * 2.2 +
      carbon * 1.35 +
      cost * 1.05 +
      sovereignty * 1.15 +
      aiProductivity * 1.55 +
      publicSatisfaction +
      criticalContinuity * 1.75 -
      cumulativePenalty,
    0,
    1000,
  );

  return {
    stability: round(stability, 1),
    carbon: round(carbon, 1),
    cost: round(cost, 1),
    sovereignty: round(sovereignty, 1),
    aiProductivity: round(aiProductivity, 1),
    publicSatisfaction: round(publicSatisfaction, 1),
    criticalContinuity: round(criticalContinuity, 1),
    batteryLevel: round(batteryLevel, 1),
    productionMw: round(production.total, 1),
    demandMw: round(demand.total, 1),
    aiLoadMw: round(demand.ai, 1),
    reserveMw,
    co2Intensity,
    score: round(score),
  };
}

function recomputeState(state: GameState, mode: "tick" | "instant" = "tick") {
  const metrics = computeMetrics(state, mode);
  const production = computeProduction(state);
  const demand = computeDemand(state);
  state.metrics = metrics;
  for (const node of state.grid.nodes) {
    if (node.runtime?.storageLevel) node.storageLevelPct = metrics.batteryLevel;
  }
  state.assets = updateAssetPowers(state.assets, production, demand, metrics);
  const point = timelinePoint(state, metrics);
  const previousPoint = state.timeline.at(-1);
  if (mode === "instant" && previousPoint?.minute === state.minute) {
    state.timeline = [...state.timeline.slice(0, -1), point].slice(-56);
  } else {
    state.timeline = [...state.timeline, point].slice(-56);
  }
}

function updateCumulativeMetrics(state: GameState) {
  const dtHours = state.scenario.tickMinutes / 60;
  const contractImpact = activeContractCurtailmentImpact(state);
  const overloadedLines = state.grid.lines.filter(
    (line) => line.status === "overloaded" || line.status === "critical",
  );
  const criticalLines = state.grid.lines.filter((line) => line.status === "critical" || line.tripped);
  const criticalUnserved = state.grid.nodes
    .filter((node) => node.criticality === "critical")
    .reduce((total, node) => total + Math.max(0, node.demandMw - node.servedDemandMw), 0);
  const wastedAiMw = state.aiJobs.reduce((total, job) => {
    if (job.id === "looping-agent" && state.flags.agentLoop && !job.timeoutApplied) {
      return total + job.currentPowerMw * Math.max(0.2, job.loopRisk / 100);
    }
    return total;
  }, 0);

  state.cumulative.overloadMinutes = round(
    state.cumulative.overloadMinutes + overloadedLines.length * state.scenario.tickMinutes,
    2,
  );
  state.cumulative.criticalLineMinutes = round(
    state.cumulative.criticalLineMinutes + criticalLines.length * state.scenario.tickMinutes,
    2,
  );
  state.cumulative.unservedEnergyMwh = round(
    state.cumulative.unservedEnergyMwh + state.grid.unservedMw * dtHours,
    3,
  );
  state.cumulative.criticalUnservedEnergyMwh = round(
    state.cumulative.criticalUnservedEnergyMwh + criticalUnserved * dtHours,
    3,
  );
  state.cumulative.co2Tons = round(
    state.cumulative.co2Tons + (state.metrics.co2Intensity * state.metrics.productionMw * dtHours) / 1000,
    3,
  );
  state.cumulative.operatingCost = round(
    state.cumulative.operatingCost +
      Math.max(0, 100 - state.metrics.cost) * 0.08 +
      getEffectMagnitude(state, "import_energy") * 0.04 +
      getEffectMagnitude(state, "thermal_backup") * 0.07 +
      contractImpact.costPenalty * 0.12,
    2,
  );
  state.cumulative.aiValueDelivered = round(
    state.aiJobs.reduce((total, job) => total + (job.progress / 100) * job.value, 0),
    2,
  );
  state.cumulative.wastedAiEnergyMwh = round(
    state.cumulative.wastedAiEnergyMwh + wastedAiMw * dtHours,
    3,
  );
  state.cumulative.lineTrips = state.grid.lines.reduce((total, line) => total + line.tripCount, 0);
}

function updateCriticalMoments(state: GameState) {
  const trippedLine = [...state.grid.lines]
    .filter((line) => line.tripped)
    .sort((a, b) => (b.isCritical ? 1 : 0) - (a.isCritical ? 1 : 0) || b.tripCount - a.tripCount)[0];
  if (trippedLine) {
    rememberCriticalMoment(
      state,
      makeCriticalMoment(state, {
        severity: trippedLine.isCritical ? "critical" : "warning",
        kind: "line",
        title: "Protection ligne déclenchée",
        description: `${trippedLine.label} est sortie du réseau. Les flux voisins absorbent le report de charge.`,
        entityId: trippedLine.id,
        entityLabel: trippedLine.label,
      }),
    );
    return;
  }

  const hottestLine = [...state.grid.lines]
    .filter((line) => !line.tripped)
    .sort((a, b) => b.utilizationRatio - a.utilizationRatio)[0];
  if (hottestLine && hottestLine.utilizationRatio >= 1.04) {
    rememberCriticalMoment(
      state,
      makeCriticalMoment(state, {
        severity: hottestLine.utilizationRatio >= 1.14 ? "critical" : "warning",
        kind: "line",
        title: "Surcharge corridor",
        description: `${hottestLine.label} atteint ${Math.round(hottestLine.utilizationRatio * 100)}% de charge.`,
        entityId: hottestLine.id,
        entityLabel: hottestLine.label,
      }),
    );
  }

  const criticalNode = state.grid.nodes.find(
    (node) => node.criticality === "critical" && node.demandMw - node.servedDemandMw > 1,
  );
  if (criticalNode) {
    rememberCriticalMoment(
      state,
      makeCriticalMoment(state, {
        severity: "critical",
        kind: "node",
        title: "Service critique délesté",
        description: `${criticalNode.label} ne reçoit pas toute sa demande. La continuité critique baisse.`,
        entityId: criticalNode.id,
        entityLabel: criticalNode.label,
      }),
    );
  }

  const failedCriticalJob = state.aiJobs.find((job) => job.criticality === "critical" && job.status === "failed");
  if (failedCriticalJob) {
    rememberCriticalMoment(
      state,
      makeCriticalMoment(state, {
        severity: "critical",
        kind: "ai",
        title: "Job IA critique échoué",
        description: `${failedCriticalJob.name} a manqué sa deadline.`,
        entityId: failedCriticalJob.id,
        entityLabel: failedCriticalJob.name,
      }),
    );
  }

  if (state.metrics.stability < 50 || state.metrics.reserveMw < -18 || state.grid.maxUtilization >= 0.9) {
    rememberCriticalMoment(
      state,
      makeCriticalMoment(state, {
        severity: state.metrics.stability < 35 || state.metrics.reserveMw < -35 ? "critical" : "warning",
        kind: "grid",
        title: "Point de pression réseau",
        description: `Le réseau tombe à ${Math.round(state.metrics.stability)}% de stabilité avec ${Math.round(state.metrics.reserveMw)} MW de réserve.`,
      }),
    );
  }
}

function resolveIncidentsFromState(state: GameState) {
  for (const incident of state.incidents) {
    if (incident.resolvedAt !== undefined) continue;
    const event = state.scenario.events.find((item) => item.id === incident.id);
    if (!event) continue;
    if (isScenarioEventResolved(state, event)) resolveIncident(state, incident.id);
  }
}

function processActiveCommandExpirations(state: GameState) {
  const expired = state.activeCommands.filter((command) => command.expiresAt <= state.minute);
  for (const command of expired) {
    const target = command.command.target;
    if (command.command.action === "reroute_line" && target?.kind === "line") {
      const line = state.grid.lines.find((item) => item.id === target.id);
      if (line && line.protectionState === "open") {
        line.tripped = false;
        line.protectionState = "closed";
        line.temperatureC = Math.min(line.temperatureC, 55);
      }
    }
    if (command.command.action === "repair_line" && target?.kind === "line") {
      const line = state.grid.lines.find((item) => item.id === target.id);
      if (line && line.protectionState === "repairing" && (line.repairUntil ?? 0) <= state.minute) {
        line.tripped = false;
        line.protectionState = "closed";
        line.repairUntil = undefined;
        line.temperatureC = 55;
        line.overloadDuration = 0;
      }
    }
  }
  state.activeCommands = state.activeCommands.filter((command) => command.expiresAt > state.minute);
}

function applyOutcome(state: GameState) {
  const difficultyRules = difficultyRulesForScenario(state.scenario);
  if (state.minute < state.scenario.endMinute && state.metrics.stability > difficultyRules.failureMinStability) {
    if (state.metrics.criticalContinuity > difficultyRules.failureMinCriticalContinuity) return;
  }

  const failure =
    state.metrics.stability <= difficultyRules.failureMinStability ||
    state.metrics.criticalContinuity <= difficultyRules.failureMinCriticalContinuity ||
    state.aiJobs.some((job) => job.id === "cyber-critical" && job.status === "failed");

  if (state.minute >= state.scenario.endMinute || failure) {
    const objectiveResults = evaluateObjectiveChecks(state);
    const requiredObjectivesPassed = objectiveResults.every((objective) => !objective.required || objective.passed);
    const victory =
      !failure &&
      requiredObjectivesPassed &&
      state.metrics.stability >= difficultyRules.victoryMinStability &&
      state.metrics.criticalContinuity >= difficultyRules.victoryMinCriticalContinuity;
    const score = state.metrics.score;
    const badge =
      score >= 850
        ? "Orchestrateur IA-Énergie"
        : score >= 720
          ? "Défense réseau fiable"
          : score >= 560
            ? "Opérateur sous tension"
            : "Blackout évité de justesse";

    state.phase = "ended";
    const replayMoment = state.criticalMoments[0];
    state.outcome = {
      result: victory ? "victory" : "failure",
      score,
      badge: failure ? "Mission compromise" : badge,
      summary: victory
        ? "Vous avez conservé les services critiques tout en pilotant les charges IA flexibles."
        : "La mission montre le risque d'une orchestration trop tardive des pics et des jobs critiques.",
      replayMoment,
      objectiveResults,
    };

    addAssistantMessage(state, {
      title: victory ? "Mission terminée" : "Mission compromise",
      body: state.outcome.summary,
      tone: victory ? "info" : "critical",
    });
  }
}

export function objectiveMetricValue(state: GameState, metric: ObjectiveMetric): number {
  if (metric === "stability") return state.metrics.stability;
  if (metric === "criticalContinuity") return state.metrics.criticalContinuity;
  if (metric === "carbon") return state.metrics.carbon;
  if (metric === "cost") return state.metrics.cost;
  if (metric === "sovereignty") return state.metrics.sovereignty;
  if (metric === "aiProductivity") return state.metrics.aiProductivity;
  if (metric === "score") return state.metrics.score;
  if (metric === "commandCapacitySpent") return state.cumulative.commandCapacitySpent;
  if (metric === "lineTrips") return state.cumulative.lineTrips;
  if (metric === "unservedEnergyMwh") return state.cumulative.unservedEnergyMwh;
  if (metric === "athenaAutopilotUses") return state.cumulative.athenaAutopilotUses;
  if (metric === "completedAiJobs") {
    return state.aiJobs.filter((job) => job.status === "completed").length;
  }
  if (metric === "failedCriticalJobs") {
    return state.aiJobs.filter((job) => job.criticality === "critical" && job.status === "failed").length;
  }
  return 0;
}

export function objectivePassed(value: number, operator: ObjectiveResult["operator"], target: number) {
  if (operator === ">=") return value >= target;
  if (operator === "<=") return value <= target;
  return value === target;
}

export function evaluateObjectiveChecks(state: GameState): ObjectiveResult[] {
  return state.scenario.objectiveChecks.map((objective) => {
    const value = round(objectiveMetricValue(state, objective.metric), 2);
    return {
      ...objective,
      value,
      passed: objectivePassed(value, objective.operator, objective.target),
    };
  });
}

function maybeAddAdvisorMessage(state: GameState) {
  const last = state.assistantMessages[0];
  const recommendation = getAdvisorRecommendation(state);
  const urgent = recommendation.tone === "critical";
  const enoughTimePassed = !last || state.minute - last.minute >= 15;

  if ((urgent || enoughTimePassed) && last?.title !== recommendation.title) {
    addAssistantMessage(state, recommendation);
  }
}

function maybeAddOrganizationFlexOffer(state: GameState) {
  const announcedOrganizationNames = new Set(
    state.assistantMessages
      .filter((message) => message.title.startsWith("Offre flexibilité - "))
      .map((message) => message.title.replace("Offre flexibilité - ", "")),
  );
  const offer = getOrganizationFlexOffer({
    announcedOrganizationNames,
    maxUtilization: state.grid.maxUtilization,
    nodes: state.grid.nodes,
    reserveMw: state.metrics.reserveMw,
    unservedMw: state.grid.unservedMw,
  });

  if (!offer) return;

  addAssistantMessage(state, {
    title: `Offre flexibilité - ${offer.organizationName}`,
    body:
      `${offer.organizationName} accepte ${offer.actionMw} MW sur ${offer.nodeLabel}. ` +
      `Fenêtre ${offer.durationMinutes} min. Compensation estimée : coût ${offer.costPenalty}, satisfaction -${offer.reputationPenalty}.`,
    tone: offer.contract === "critical" ? "critical" : "warning",
    suggestedAction: "curtail_industry",
  });
}

function resolveCommandTarget(state: GameState, command: PlayerCommand): CommandTarget | undefined {
  const effectTarget = effectNodeTargetForAction(state, command.action, command.target);
  if (effectTarget) return effectTarget;
  if (command.target) return command.target;
  const nodeTarget = defaultNodeTargetForAction(state, command.action);
  if (nodeTarget) return nodeTarget;
  if (command.action === "agent_timeout") return { kind: "workload", id: "looping-agent" };
  if (command.action === "defer_ai" || command.action === "reduce_model" || command.action === "activate_cache") {
    const candidate = [...state.aiJobs]
      .filter((job) => job.criticality !== "critical" && job.status !== "completed" && job.status !== "failed")
      .sort((a, b) => b.currentPowerMw + b.basePowerMw - (a.currentPowerMw + a.basePowerMw))[0];
    return candidate ? { kind: "workload", id: candidate.id } : undefined;
  }
  if (command.action === "externalize_ai") {
    const candidate = [...state.aiJobs]
      .filter(
        (job) =>
          job.criticality !== "critical" &&
          !job.sovereign &&
          !job.externalized &&
          activeOrThrottled(job),
      )
      .sort((a, b) => b.currentPowerMw + b.basePowerMw - (a.currentPowerMw + a.basePowerMw))[0];
    return candidate ? { kind: "workload", id: candidate.id } : undefined;
  }
  if (command.action === "migrate_ai") {
    const candidate = [...state.aiJobs]
      .filter((job) => job.criticality !== "critical" && !job.externalized && job.preferredNodeIds.length > 1)
      .sort((a, b) => b.currentPowerMw + b.basePowerMw - (a.currentPowerMw + a.basePowerMw))[0];
    return candidate ? { kind: "workload", id: candidate.id } : undefined;
  }
  if (command.action === "reroute_line" || command.action === "repair_line" || command.action === "authorize_overload") {
    const candidate = [...state.grid.lines]
      .filter((line) => line.isControllable)
      .sort((a, b) => b.utilizationRatio - a.utilizationRatio)[0];
    return candidate ? { kind: "line", id: candidate.id } : undefined;
  }
  return undefined;
}

function validateCommand(state: GameState, command: PlayerCommand): string | undefined {
  const definition = getActionDefinition(command.action);
  if (!definition) return "Commande inconnue.";
  if (state.phase === "ended") return "La mission est terminée.";
  if (!isActionAvailable(state, command.action)) return `${definition.label} n'est pas encore disponible dans cette mission.`;
  if (command.source === "athena" && state.athenaTokens <= 0) {
    return "ATHENA n'a plus de jeton d'autopilot disponible.";
  }
  const cooldownUntil = state.actionCooldowns[command.action] ?? 0;
  if (cooldownUntil > state.minute) {
    return `${definition.label} disponible à ${formatClock(cooldownUntil)}.`;
  }
  const cost = commandCost(state, command);
  if (cost > state.commandCapacity) {
    return `Capacité opérationnelle insuffisante (${state.commandCapacity}/${cost}).`;
  }
  return undefined;
}

function consumeCommandBudget(state: GameState, command: PlayerCommand) {
  const definition = getActionDefinition(command.action);
  const cost = commandCost(state, command);
  state.commandCapacity = clamp(state.commandCapacity - cost, 0, state.commandCapacityMax);
  state.cumulative.commandCapacitySpent = round(state.cumulative.commandCapacitySpent + cost, 1);
  if (command.source === "athena") {
    state.athenaTokens = Math.max(0, state.athenaTokens - 1);
    state.cumulative.athenaAutopilotUses += 1;
  }
  if (definition) state.actionCooldowns[command.action] = state.minute + definition.cooldownMinutes;
  if (state.metrics.stability < 35 || state.grid.maxUtilization > 1.1) {
    state.cumulative.emergencyActions += 1;
  }
}

function rejectCommand(state: GameState, command: PlayerCommand, reason: string): GameState {
  const definition = getActionDefinition(command.action);
  const label = definition?.label ?? command.action;
  addActionRecord(state, {
    type: command.action,
    label,
    result: reason,
    impact: "negative",
    targetLabel: targetLabel(state, command.target),
  });
  addAssistantMessage(state, {
    title: "Commande refusée",
    body: reason,
    tone: "warning",
  });
  return state;
}

export function createInitialGameState(scenario: Scenario): GameState {
  const scenarioCopy = clone(scenario);
  const state: GameState = {
    scenario: scenarioCopy,
    phase: "ready",
    minute: scenarioCopy.startMinute,
    tick: 0,
    triggeredEventIds: [],
    flags: {
      evSurge: false,
      solarDrop: false,
      residentialPeak: false,
      cyberPriority: false,
      agentLoop: false,
    },
    metrics: clone(scenarioCopy.initialMetrics),
    assets: clone(scenarioCopy.assets),
    aiJobs: clone(scenarioCopy.aiJobs),
    grid: createInitialGrid(scenarioCopy.mapId),
    commandCapacity: scenarioCopy.commandCapacity,
    commandCapacityMax: scenarioCopy.commandCapacity,
    actionCooldowns: {},
    athenaTokens: 2,
    activeCommands: [],
    cumulative: createInitialCumulativeMetrics(),
    activeEffects: [],
    incidents: [],
    actionHistory: [],
    assistantMessages: [],
    timeline: [],
    criticalMoments: [],
  };

  // Populate flows/statuses so the "ready" map renders the real grid.
  solveGridTick(state, { tickMinutes: 0 });

  state.timeline = [timelinePoint(state)];
  addAssistantMessage(state, {
    title: "ATHENA Grid en ligne",
    body:
      "Mission : passer le pic du soir sans couper les usages critiques. L'IA utile doit rester disponible, les charges flexibles doivent être orchestrées.",
    tone: "info",
  });

  return state;
}

export function advanceSimulation(currentState: GameState): GameState {
  if (currentState.phase === "ended") return currentState;

  const state = clone(currentState);
  state.phase = "running";
  state.tick += 1;
  state.minute = Math.min(
    state.minute + state.scenario.tickMinutes,
    state.scenario.endMinute,
  );
  state.activeEffects = state.activeEffects.filter((effect) => effect.expiresAt >= state.minute);
  processActiveCommandExpirations(state);

  processScenarioEvents(state);
  updateAiJobs(state);
  // Per tick: integrate line heat and let sustained overloads trip + cascade.
  solveGridTick(state, { allowTrips: true });
  recomputeState(state);
  updateCumulativeMetrics(state);
  updateCriticalMoments(state);
  recomputeState(state, "instant");
  resolveIncidentsFromState(state);
  maybeAddOrganizationFlexOffer(state);
  maybeAddAdvisorMessage(state);
  applyOutcome(state);

  return state;
}

export function applyPlayerAction(
  currentState: GameState,
  actionOrCommand: PlayerActionType | PlayerCommand,
): GameState {
  if (currentState.phase === "ended") return currentState;

  const state = clone(currentState);
  const command = normalizeCommand(actionOrCommand);
  command.target = resolveCommandTarget(state, command);
  const rejection = validateCommand(state, command);
  if (rejection) return rejectCommand(state, command, rejection);

  const actionType = command.action;
  const definition = getActionDefinition(actionType);
  const label = definition?.label ?? actionType;
  const target = command.target;
  const durationMinutes = commandDuration(command);
  const magnitude = commandMagnitude(command);
  const feedbackBefore = captureActionFeedbackState(state);
  let commandApplied = false;
  let result = "";
  let impact: ActionRecord["impact"] = "positive";
  let assistant: Omit<AssistantMessage, "id" | "minute"> | undefined;

  if (actionType === "smart_ev") {
    upsertEffect(state, {
      label,
      action: actionType,
      target,
      expiresAt: state.minute + durationMinutes,
      magnitude,
    });
    result = `Recharge lissée à ${magnitude} MW pendant ${durationMinutes} minutes.`;
    commandApplied = true;
    assistant = {
      title: "Recharge EV lissée",
      body:
        "Le pic de recharge baisse. Certains véhicules finiront plus tard, mais le réseau respire.",
      tone: "info",
    };
  }

  if (actionType === "defer_ai") {
    const targetNodeId = target?.kind === "node" ? target.id : undefined;
    const targetJobId = target?.kind === "workload" ? target.id : undefined;
    const candidate = [...state.aiJobs]
      .filter(
        (job) =>
          (!targetJobId || job.id === targetJobId) &&
          (!targetNodeId || job.assignedNodeId === targetNodeId) &&
          job.criticality !== "critical" &&
          job.status !== "completed" &&
          job.status !== "failed" &&
          job.deadlineMinute - state.minute >= 25,
      )
      .sort((a, b) => b.basePowerMw - a.basePowerMw)[0];

    if (candidate) {
      const job = state.aiJobs.find((item) => item.id === candidate.id);
      if (job) {
        const minimumDelayUntil = state.minute + 45;
        const preferredUntil = state.minute + 75;
        const safeLatestStart = job.deadlineMinute - 20;
        const requestedEarliest = state.minute + 10;
        const requestedLatest = Math.max(requestedEarliest, safeLatestStart);
        job.status = "deferred";
        job.currentPowerMw = 0;
        job.deferredUntil =
          command.scheduledMinute !== undefined
            ? clamp(command.scheduledMinute, requestedEarliest, requestedLatest)
            : safeLatestStart > minimumDelayUntil
            ? Math.min(preferredUntil, safeLatestStart)
            : safeLatestStart;
        result = `${job.name} reporté hors pointe.`;
        commandApplied = true;
        assistant = {
          title: "Charge IA reportée",
          body:
            "Le job flexible est sorti du pic. La productivité est préservée si la deadline reste respectée.",
          tone: "info",
        };
      }
    } else {
      impact = "mixed";
      result = "Aucun job flexible reportable maintenant.";
      assistant = {
        title: "Pas de job reportable",
        body:
          "Les charges restantes sont soit critiques, soit trop proches de leur deadline. Cherchez plutôt batterie, cache ou import.",
        tone: "warning",
      };
    }
  }

  if (actionType === "migrate_ai") {
    const selectedNodeId = target?.kind === "node" ? target.id : undefined;
    const targetJobId = target?.kind === "workload" ? target.id : undefined;
    const explicitDestinationNodeId = command.destinationNodeId;
    const requestedDestinationNodeId = explicitDestinationNodeId ?? selectedNodeId;
    const datacenterIds = state.grid.nodes
      .filter((node) => node.kind === "datacenter")
      .map((node) => node.id);
    const candidate = [...state.aiJobs]
      .filter(
        (job) =>
          (!targetJobId || job.id === targetJobId) &&
          job.criticality !== "critical" &&
          !job.externalized &&
          job.status !== "completed" &&
          job.status !== "failed" &&
          datacenterIds.includes(job.assignedNodeId),
      )
      .sort((a, b) => b.currentPowerMw + b.basePowerMw - (a.currentPowerMw + a.basePowerMw))[0];

    if (candidate) {
      const job = state.aiJobs.find((item) => item.id === candidate.id);
      if (job) {
        const current = job.assignedNodeId;
        const preferredTarget =
          requestedDestinationNodeId &&
          requestedDestinationNodeId !== current &&
          datacenterIds.includes(requestedDestinationNodeId)
            ? requestedDestinationNodeId
            : explicitDestinationNodeId
              ? undefined
              : job.preferredNodeIds.find((id) => id !== current && datacenterIds.includes(id));
        if (preferredTarget) {
          job.assignedNodeId = preferredTarget;
          job.currentPowerMw = computeAiJobPower(state, job);
          result = `${job.name} migre vers ${targetLabel(state, { kind: "node", id: preferredTarget })}.`;
          commandApplied = true;
          impact = "mixed";
          assistant = {
            title: "Migration IA lancée",
            body:
              "La charge quitte son datacenter d'origine. Les flux vont se recalculer sur le réseau physique.",
            tone: "info",
          };
        }
      }
    }

    if (!result) {
      impact = "mixed";
      result = "Aucun workload IA non critique migrable.";
      assistant = {
        title: "Migration indisponible",
        body:
          "Les jobs restants sont critiques, terminés ou déjà au meilleur emplacement disponible.",
        tone: "warning",
      };
    }
  }

  if (actionType === "externalize_ai") {
    const targetNodeId = target?.kind === "node" ? target.id : undefined;
    const targetJobId = target?.kind === "workload" ? target.id : undefined;
    const candidate = [...state.aiJobs]
      .filter(
        (job) =>
          (!targetJobId || job.id === targetJobId) &&
          (!targetNodeId || job.assignedNodeId === targetNodeId) &&
          activeOrThrottled(job) &&
          job.criticality !== "critical" &&
          !job.sovereign &&
          !job.externalized &&
          job.status !== "completed" &&
          job.status !== "failed",
      )
      .sort((a, b) => b.currentPowerMw + b.basePowerMw - (a.currentPowerMw + a.basePowerMw))[0];

    if (candidate) {
      const job = state.aiJobs.find((item) => item.id === candidate.id);
      if (job) {
        const relievedMw = job.currentPowerMw || computeAiJobPower(state, job);
        job.externalized = true;
        job.currentPowerMw = 0;
        result = `${job.name} bascule sur cloud externe.`;
        commandApplied = true;
        impact = "mixed";
        assistant = {
          title: "Cloud externe activé",
          body: `La charge locale baisse d'environ ${Math.round(
            relievedMw,
          )} MW, mais la souveraineté et le coût vont se dégrader tant que le job tourne hors réseau.`,
          tone: "warning",
        };
      }
    }

    if (!result) {
      impact = "mixed";
      result = "Aucun job IA non souverain actif externalisable.";
      assistant = {
        title: "Externalisation indisponible",
        body:
          "Les jobs actifs restants sont critiques, souverains, terminés ou déjà externalisés.",
        tone: "warning",
      };
    }
  }

  if (actionType === "reduce_model") {
    const targetNodeId = target?.kind === "node" ? target.id : undefined;
    const targetJobId = target?.kind === "workload" ? target.id : undefined;
    const candidate = [...state.aiJobs]
      .filter(
        (job) =>
          (!targetJobId || job.id === targetJobId) &&
          (!targetNodeId || job.assignedNodeId === targetNodeId) &&
          activeOrThrottled(job) &&
          job.criticality !== "critical" &&
          job.modelScale > 0.55,
      )
      .sort((a, b) => b.currentPowerMw - a.currentPowerMw)[0];

    if (candidate) {
      const job = state.aiJobs.find((item) => item.id === candidate.id);
      if (job) {
        job.modelScale = job.modelScale === 1 ? 0.75 : 0.55;
        job.status = "throttled";
        job.currentPowerMw = computeAiJobPower(state, job);
        result = `${job.name} passe sur un modèle plus léger.`;
        commandApplied = true;
        assistant = {
          title: "Modèle optimisé",
          body:
            "La consommation IA baisse avec une perte de qualité acceptable pour une charge non critique.",
          tone: "info",
        };
      }
    } else {
      impact = "mixed";
      result = "Aucun job non critique actif à réduire.";
      assistant = {
        title: "Réduction indisponible",
        body:
          "Les jobs actifs ne sont pas de bons candidats. Évitez de dégrader le cyber critique.",
        tone: "warning",
      };
    }
  }

  if (actionType === "activate_cache") {
    let improved = 0;
    for (const job of state.aiJobs) {
      const matchesTarget =
        !target ||
        (target.kind === "workload" && job.id === target.id) ||
        (target.kind === "node" && job.assignedNodeId === target.id);
      if (matchesTarget && !job.cached && job.status !== "completed" && job.status !== "failed") {
        job.cached = true;
        job.redundantCalls = Math.max(0, Math.round(job.redundantCalls * 0.38));
        if (activeOrThrottled(job)) {
          job.currentPowerMw = computeAiJobPower(state, job);
        }
        improved += 1;
      }
    }

    result = improved > 0 ? `${improved} jobs protégés par cache.` : "Cache déjà actif.";
    commandApplied = improved > 0;
    impact = improved > 0 ? "positive" : "mixed";
    assistant = {
      title: "Cache IA activé",
      body:
        "Les appels répétés sont réduits. L'effet est progressif mais fiable sur les assistants et agents.",
      tone: "info",
    };
  }

  if (actionType === "agent_timeout") {
    const agent = state.aiJobs.find((job) => {
      if (target?.kind === "workload") return job.id === target.id;
      if (target?.kind === "node") {
        return (
          job.assignedNodeId === target.id &&
          job.kind === "agent" &&
          job.status !== "completed" &&
          job.status !== "failed" &&
          !job.timeoutApplied
        );
      }
      return job.id === "looping-agent";
    });
    if (agent && state.flags.agentLoop && !agent.timeoutApplied) {
      agent.timeoutApplied = true;
      agent.status = "throttled";
      agent.loopRisk = 14;
      agent.redundantCalls = 8;
      agent.currentPowerMw = computeAiJobPower(state, agent);
      state.flags.agentLoop = false;
      result = "Boucle agent stoppée par budget d'itérations.";
      commandApplied = true;
      assistant = {
        title: "Timeout appliqué",
        body:
          "L'agent ne peut plus consommer sans valeur. Le datacenter garde sa capacité pour les charges utiles.",
        tone: "info",
      };
    } else {
      impact = "mixed";
      result = "Aucune boucle agent active.";
      assistant = {
        title: "Aucun agent à stopper",
        body:
          "Gardez cette action pour une anomalie Energy SOC ou un agent qui multiplie les appels.",
        tone: "warning",
      };
    }
  }

  if (actionType === "discharge_battery") {
    if (state.metrics.batteryLevel > 12) {
      upsertEffect(state, {
        label,
        action: actionType,
        target,
        expiresAt: state.minute + durationMinutes,
        magnitude,
      });
      result = `Batterie déchargée à ${magnitude} MW pendant ${durationMinutes} minutes.`;
      commandApplied = true;
      assistant = {
        title: "Batterie engagée",
        body:
          "La stabilité va remonter rapidement. Surveillez la réserve pour ne pas arriver vide au pic final.",
        tone: "info",
      };
    } else {
      impact = "negative";
      result = "Réserve batterie trop basse.";
      assistant = {
        title: "Batterie insuffisante",
        body:
          "Le stockage ne peut plus absorber la crise. Il faut réduire la demande ou importer.",
        tone: "critical",
      };
    }
  }

  if (actionType === "import_energy") {
    upsertEffect(state, {
      label,
      action: actionType,
      target,
      expiresAt: state.minute + durationMinutes,
      magnitude,
    });
    result = `Import activé à ${magnitude} MW pendant ${durationMinutes} minutes.`;
    commandApplied = true;
    impact = "mixed";
    assistant = {
      title: "Import activé",
      body:
        "Le réseau gagne une marge immédiate. Le coût et la souveraineté seront pénalisés.",
      tone: "warning",
    };
  }

  if (actionType === "thermal_backup") {
    upsertEffect(state, {
      label,
      action: actionType,
      target,
      expiresAt: state.minute + durationMinutes,
      magnitude,
    });
    result = `Thermique de secours lancé à ${magnitude} MW pendant ${durationMinutes} minutes.`;
    commandApplied = true;
    impact = "mixed";
    assistant = {
      title: "Thermique de secours",
      body:
        "La stabilité remonte fortement, mais l'empreinte CO₂ et le coût augmentent. C'est un dernier recours.",
      tone: "critical",
    };
  }

  if (actionType === "curtail_industry") {
    upsertEffect(state, {
      label,
      action: actionType,
      target,
      expiresAt: state.minute + durationMinutes,
      magnitude,
    });
    result = `Effacement industriel de ${magnitude} MW pendant ${durationMinutes} minutes.`;
    commandApplied = true;
    impact = "mixed";
    assistant = {
      title: "Effacement industrie",
      body:
        "Le site industriel réduit temporairement sa demande. Le réseau est soulagé, mais le coût économique augmente.",
      tone: "warning",
    };
  }

  if (actionType === "reroute_line") {
    const line = target?.kind === "line" ? state.grid.lines.find((item) => item.id === target.id) : undefined;
    if (line && line.isControllable && !line.tripped) {
      line.tripped = true;
      line.protectionState = "open";
      line.repairUntil = undefined;
      line.temperatureC = Math.min(line.temperatureC, 70);
      addActiveCommand(state, command, label, commandCost(state, command), durationMinutes);
      result = `${line.label} ouverte pendant ${durationMinutes} minutes.`;
      commandApplied = true;
      impact = "mixed";
      assistant = {
        title: "Reroutage engagé",
        body:
          "La ligne sélectionnée est ouverte temporairement. Les flux voisins vont absorber le transit restant.",
        tone: line.isCritical ? "warning" : "info",
      };
    } else {
      impact = "negative";
      result = "Ligne non pilotable ou déjà ouverte.";
      assistant = {
        title: "Reroutage impossible",
        body:
          "Cette ligne ne peut pas être ouverte maintenant. Cherchez une ligne pilotable ou une action de demande.",
        tone: "warning",
      };
    }
  }

  if (actionType === "repair_line") {
    const line = target?.kind === "line" ? state.grid.lines.find((item) => item.id === target.id) : undefined;
    if (line && line.tripped && line.protectionState !== "open") {
      line.protectionState = "repairing";
      line.repairUntil = state.minute + durationMinutes;
      addActiveCommand(state, command, label, commandCost(state, command), durationMinutes);
      result = `Équipe envoyée sur ${line.label}. Retour prévu à ${formatClock(line.repairUntil)}.`;
      commandApplied = true;
      assistant = {
        title: "Équipe de réparation envoyée",
        body:
          "Le corridor reste indisponible pendant l'intervention. Les flux voisins doivent tenir jusqu'au retour.",
        tone: "info",
      };
    } else {
      impact = "mixed";
      result = "Aucune coupure à réparer sur cette ligne.";
      assistant = {
        title: "Réparation non requise",
        body:
          "La ligne cible est encore disponible. Autorisez une surcharge ou réduisez la demande si elle chauffe.",
        tone: "warning",
      };
    }
  }

  if (actionType === "authorize_overload") {
    const line = target?.kind === "line" ? state.grid.lines.find((item) => item.id === target.id) : undefined;
    if (line && !line.tripped) {
      line.emergencyCapacityUntil = state.minute + durationMinutes;
      line.temperatureC = Math.max(65, line.temperatureC);
      addActiveCommand(state, command, label, commandCost(state, command), durationMinutes);
      result = `${line.label} autorisée en surcharge ${durationMinutes} minutes.`;
      commandApplied = true;
      impact = "mixed";
      assistant = {
        title: "Surcharge temporaire autorisée",
        body:
          "La limite thermique est relevée pour acheter du temps. Une ligne trop chaude peut encore déclencher.",
        tone: "warning",
      };
    } else {
      impact = "negative";
      result = "Impossible d'autoriser une ligne coupée.";
      assistant = {
        title: "Autorisation refusée",
        body:
          "Une ligne déjà déclenchée doit être réparée ou contournée, pas surchargée.",
        tone: "critical",
      };
    }
  }

  if (commandApplied) consumeCommandBudget(state, command);

  if (assistant) addAssistantMessage(state, assistant);
  updateAiJobPowers(state);
  // Instant flow refresh (no thermal integration) so the map reacts immediately.
  solveGridTick(state, { tickMinutes: 0 });
  recomputeState(state, "instant");
  resolveIncidentsFromState(state);
  const feedback = createActionFeedback({
    after: state,
    applied: commandApplied,
    before: feedbackBefore,
    impact,
  });

  addActionRecord(state, {
    type: actionType,
    label,
    result,
    impact,
    targetLabel: targetLabel(state, target),
    cost: commandApplied ? commandCost(state, command) : 0,
    commandCapacityAfter: state.commandCapacity,
    feedback,
  });

  return state;
}

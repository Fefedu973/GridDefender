import { getActionDefinition } from "@/game/actions";
import { getAdvisorRecommendation } from "@/game/advisor/rules";
import { filterAvailableActions } from "@/game/commands/commandAvailability";
import { previewCommand } from "@/game/commands/previewCommand";
import { effectNodeTargetForAction } from "@/game/network/gridSelectors";
import type { AIJob, CommandTarget, GameState, PlayerActionType, PlayerCommand } from "@/game/types";

export interface AdvisorOption {
  action: PlayerActionType;
  command: PlayerCommand;
  label: string;
  targetLabel?: string;
  reason: "recommended" | "alternative";
  autopilotEligible: boolean;
  cost: number;
  cooldownBlocked: boolean;
  capacityBlocked: boolean;
  reserveDeltaMw: number;
  demandDeltaMw: number;
  productionDeltaMw: number;
}

function uniqueActions(actions: Array<PlayerActionType | undefined>): PlayerActionType[] {
  return actions.filter((action, index): action is PlayerActionType => {
    return Boolean(action) && actions.indexOf(action) === index;
  });
}

function hasNonCriticalAi(state: GameState) {
  return state.aiJobs.some(
    (job) =>
      job.criticality !== "critical" &&
      job.status !== "completed" &&
      job.status !== "failed",
  );
}

function hasActiveReducibleAi(state: GameState) {
  return state.aiJobs.some(
    (job) =>
      job.criticality !== "critical" &&
      (job.status === "active" || job.status === "throttled") &&
      job.modelScale > 0.55,
  );
}

function hasExternalizableAi(state: GameState) {
  return state.aiJobs.some(
    (job) =>
      job.criticality !== "critical" &&
      !job.sovereign &&
      !job.externalized &&
      (job.status === "active" || job.status === "throttled"),
  );
}

function hasCacheOpportunity(state: GameState) {
  return state.aiJobs.some(
    (job) =>
      !job.cached &&
      job.status !== "completed" &&
      job.status !== "failed" &&
      (job.redundantCalls > 18 || (activeOrThrottled(job) && job.criticality !== "critical" && job.currentPowerMw >= 18)),
  );
}

function activeOrThrottled(job: AIJob) {
  return job.status === "active" || job.status === "throttled";
}

function targetLabel(state: GameState, target?: CommandTarget) {
  if (!target) return undefined;
  if (target.kind === "line") return state.grid.lines.find((line) => line.id === target.id)?.label ?? target.id;
  if (target.kind === "node") return state.grid.nodes.find((node) => node.id === target.id)?.label ?? target.id;
  if (target.kind === "workload") return state.aiJobs.find((job) => job.id === target.id)?.name ?? target.id;
  return target.id;
}

function bestDeferrableJob(state: GameState) {
  return [...state.aiJobs]
    .filter(
      (job) =>
        job.criticality !== "critical" &&
        job.status !== "completed" &&
        job.status !== "failed" &&
        job.deadlineMinute - state.minute >= 25,
    )
    .sort((a, b) => b.basePowerMw - a.basePowerMw)[0];
}

function bestReducibleJob(state: GameState) {
  return [...state.aiJobs]
    .filter((job) => job.criticality !== "critical" && activeOrThrottled(job) && job.modelScale > 0.55)
    .sort((a, b) => b.currentPowerMw - a.currentPowerMw)[0];
}

function bestExternalizableJob(state: GameState) {
  return [...state.aiJobs]
    .filter((job) => job.criticality !== "critical" && !job.sovereign && !job.externalized && activeOrThrottled(job))
    .sort((a, b) => b.currentPowerMw + b.basePowerMw - (a.currentPowerMw + a.basePowerMw))[0];
}

function bestCacheableJob(state: GameState) {
  return [...state.aiJobs]
    .filter((job) => !job.cached && job.redundantCalls > 18 && job.status !== "completed" && job.status !== "failed")
    .sort((a, b) => {
      const bActive = activeOrThrottled(b) ? 1 : 0;
      const aActive = activeOrThrottled(a) ? 1 : 0;
      return bActive - aActive || b.redundantCalls + b.currentPowerMw - (a.redundantCalls + a.currentPowerMw);
    })[0];
}

function bestMigrableJob(state: GameState) {
  const datacenterIds = new Set(state.grid.nodes.filter((node) => node.kind === "datacenter").map((node) => node.id));
  return [...state.aiJobs]
    .filter(
      (job) =>
        job.criticality !== "critical" &&
        !job.externalized &&
        job.status !== "completed" &&
        job.status !== "failed" &&
        datacenterIds.has(job.assignedNodeId) &&
        job.preferredNodeIds.some((id) => id !== job.assignedNodeId && datacenterIds.has(id)),
    )
    .sort((a, b) => b.currentPowerMw + b.basePowerMw - (a.currentPowerMw + a.basePowerMw))[0];
}

function advisorCommandForAction(state: GameState, action: PlayerActionType): PlayerCommand {
  const effectTarget = effectNodeTargetForAction(state, action);
  if (effectTarget) return { action, target: effectTarget };

  if (action === "agent_timeout") {
    const agent = state.flags.agentLoop
      ? state.aiJobs.find((job) => job.kind === "agent" && !job.timeoutApplied && job.status !== "completed" && job.status !== "failed")
      : undefined;
    return agent ? { action, target: { kind: "workload", id: agent.id } } : { action };
  }

  if (action === "defer_ai") {
    const job = bestDeferrableJob(state);
    return job ? { action, target: { kind: "workload", id: job.id } } : { action };
  }

  if (action === "reduce_model") {
    const job = bestReducibleJob(state);
    return job ? { action, target: { kind: "workload", id: job.id } } : { action };
  }

  if (action === "externalize_ai") {
    const job = bestExternalizableJob(state);
    return job ? { action, target: { kind: "workload", id: job.id } } : { action };
  }

  if (action === "activate_cache") {
    const job = bestCacheableJob(state);
    return job ? { action, target: { kind: "workload", id: job.id } } : { action };
  }

  if (action === "migrate_ai") {
    const job = bestMigrableJob(state);
    return job ? { action, target: { kind: "workload", id: job.id } } : { action };
  }

  return { action };
}

function candidateActions(state: GameState): PlayerActionType[] {
  const needsEmergencySupply =
    state.metrics.reserveMw < -18 ||
    state.metrics.stability < 44 ||
    (state.flags.solarDrop && (state.metrics.reserveMw < 0 || state.metrics.stability < 58));

  return uniqueActions([
    state.metrics.batteryLevel > 18 ? "discharge_battery" : undefined,
    state.flags.evSurge ? "smart_ev" : undefined,
    bestMigrableJob(state) ? "migrate_ai" : undefined,
    hasNonCriticalAi(state) ? "defer_ai" : undefined,
    hasActiveReducibleAi(state) ? "reduce_model" : undefined,
    hasExternalizableAi(state) ? "externalize_ai" : undefined,
    hasCacheOpportunity(state) ? "activate_cache" : undefined,
    state.metrics.reserveMw < -6 ? "import_energy" : undefined,
    needsEmergencySupply ? "thermal_backup" : undefined,
  ]);
}

export function getAdvisorOptions(state: GameState, limit = 3): AdvisorOption[] {
  const recommendation = getAdvisorRecommendation(state);
  const actions = filterAvailableActions(
    state,
    uniqueActions([recommendation.suggestedAction, ...candidateActions(state)]),
  ).slice(0, limit);

  return actions.map((action, index) => {
    const definition = getActionDefinition(action);
    const command = advisorCommandForAction(state, action);
    const preview = previewCommand(state, command);
    const cooldownUntil = state.actionCooldowns[action] ?? 0;
    const cooldownBlocked = cooldownUntil > state.minute;
    const capacityBlocked = preview.cost > state.commandCapacity;
    const recommended = index === 0 && action === recommendation.suggestedAction;
    return {
      action,
      command,
      label: definition?.label ?? action,
      targetLabel: targetLabel(state, command.target),
      reason: recommended ? "recommended" : "alternative",
      autopilotEligible: recommended && recommendation.tone === "critical" && !cooldownBlocked && !capacityBlocked,
      cost: preview.cost,
      cooldownBlocked,
      capacityBlocked,
      reserveDeltaMw: preview.metricDeltas.reserveMw,
      demandDeltaMw: preview.metricDeltas.demandMw,
      productionDeltaMw: preview.metricDeltas.productionMw,
    };
  });
}

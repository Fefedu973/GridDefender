import type { GameState, PlayerActionType } from "@/game/types";
import type { GridNode, RuntimeDemandProfile, RuntimeFlag, RuntimeProductionProfile } from "@/game/network/networkTypes";
import { rangeRatio, round } from "@/lib/math";

function effectMagnitude(state: GameState, action: PlayerActionType, targetId?: string): number {
  return state.activeEffects
    .filter(
      (effect) =>
        effect.action === action &&
        effect.expiresAt >= state.minute &&
        (!targetId || effect.target?.id === targetId),
    )
    .reduce((total, effect) => total + effect.magnitude, 0);
}

function assignedAiPower(state: GameState, nodeId: string): number {
  return state.aiJobs
    .filter((job) => job.assignedNodeId === nodeId && !job.externalized)
    .reduce((total, job) => total + job.currentPowerMw, 0);
}

function flagValue(state: GameState, flag: RuntimeFlag) {
  return state.flags[flag];
}

function productionFromProfile(
  state: GameState,
  nodeId: string,
  profile: RuntimeProductionProfile | undefined,
  elapsed: number,
  solarRatio: number,
) {
  if (!profile) return undefined;

  let production = profile.baseMw ?? 0;
  if (profile.solarCapacityMw !== undefined) {
    const dropFactor = state.flags.solarDrop ? profile.solarDropFactor ?? 1 : 1;
    production += profile.solarCapacityMw * solarRatio * dropFactor;
  }
  if (profile.waveMw && profile.wavePeriodMinutes) {
    production += Math.sin(elapsed / profile.wavePeriodMinutes) * profile.waveMw;
  }
  for (const penalty of profile.flagPenalties ?? []) {
    if (flagValue(state, penalty.flag)) production -= penalty.mw;
  }
  if (profile.effectAction) {
    production += effectMagnitude(state, profile.effectAction, nodeId);
  }
  if (profile.stabilityBoost && state.metrics.stability < profile.stabilityBoost.below) {
    production += profile.stabilityBoost.mw;
  }

  return Math.max(profile.floorMw ?? 0, production);
}

function demandFromProfile(
  state: GameState,
  node: GridNode,
  profile: RuntimeDemandProfile | undefined,
  progression: number,
) {
  if (!profile) return undefined;

  let demand = profile.baseMw ?? 0;
  if (profile.assignedAi) demand += assignedAiPower(state, node.id);
  if (profile.progressionMw) demand += progression * profile.progressionMw;
  for (const addition of profile.flagAdditions ?? []) {
    if (flagValue(state, addition.flag)) demand += addition.mw;
  }
  for (const addition of profile.minuteAdditions ?? []) {
    if (state.minute >= addition.fromMinute) demand += addition.mw;
  }
  if (profile.effectReductionAction) {
    demand -= effectMagnitude(state, profile.effectReductionAction, profile.effectTargetId ?? node.id);
  }

  return Math.max(profile.floorMw ?? 0, demand);
}

/**
 * Set each node's raw production/demand for the current tick from live game
 * signals (time of day, weather flags, active effects, AI workloads). These are
 * the *intended* levels; balanceGrid then reconciles them to a feasible,
 * conservation-respecting set of served values.
 *
 * Mission pacing still comes from scenario flags and time windows, but every
 * driver is attached to the runtime nodes rendered on the map.
 */
export function computeNodeLoads(state: GameState, nodes: GridNode[]): void {
  const elapsed = state.minute - state.scenario.startMinute;
  const missionDuration = state.scenario.endMinute - state.scenario.startMinute;
  const solarRatio = missionDuration > 0 ? Math.max(0, Math.min(1, 1 - elapsed / missionDuration)) : 0;
  const progression = rangeRatio(state.minute, state.scenario.startMinute, state.scenario.endMinute);

  for (const node of nodes) {
    const production = productionFromProfile(state, node.id, node.runtime?.production, elapsed, solarRatio) ?? node.productionMw;
    const demand = demandFromProfile(state, node, node.runtime?.demand, progression) ?? node.demandMw;

    node.productionMw = round(production, 1);
    node.demandMw = round(demand, 1);
    node.storageLevelPct = node.runtime?.storageLevel ? state.metrics.batteryLevel : undefined;
    node.servedProductionMw = node.productionMw;
    node.servedDemandMw = node.demandMw;
  }
}

export interface BalanceResult {
  unservedMw: number;
  oversupplyMw: number;
}

/**
 * Reconcile total production and demand so nodal injections sum to ~0 (a
 * precondition for a meaningful DC flow). Surplus curtails production
 * proportionally; a deficit sheds *non-critical* load first and only dips into
 * critical load (hospital, sovereign datacenter) once non-critical demand is
 * exhausted. Mutates `servedProductionMw`/`servedDemandMw`.
 */
export function balanceGrid(nodes: GridNode[]): BalanceResult {
  let totalProduction = 0;
  let totalDemand = 0;
  for (const node of nodes) {
    totalProduction += node.productionMw;
    totalDemand += node.demandMw;
    node.servedProductionMw = node.productionMw;
    node.servedDemandMw = node.demandMw;
  }

  if (totalProduction >= totalDemand) {
    const factor = totalProduction > 0 ? totalDemand / totalProduction : 0;
    for (const node of nodes) node.servedProductionMw = round(node.productionMw * factor, 2);
    return { unservedMw: 0, oversupplyMw: round(totalProduction - totalDemand, 1) };
  }

  const deficit = totalDemand - totalProduction;
  const nonCritical = nodes.filter((node) => node.demandMw > 0 && node.criticality !== "critical");
  const nonCriticalDemand = nonCritical.reduce((total, node) => total + node.demandMw, 0);

  if (deficit <= nonCriticalDemand && nonCriticalDemand > 0) {
    const served = (nonCriticalDemand - deficit) / nonCriticalDemand;
    for (const node of nonCritical) node.servedDemandMw = round(node.demandMw * served, 2);
  } else {
    for (const node of nonCritical) node.servedDemandMw = 0;
    const remaining = deficit - nonCriticalDemand;
    const critical = nodes.filter((node) => node.demandMw > 0 && node.criticality === "critical");
    const criticalDemand = critical.reduce((total, node) => total + node.demandMw, 0);
    const served = criticalDemand > 0 ? Math.max(0, (criticalDemand - remaining) / criticalDemand) : 0;
    for (const node of critical) node.servedDemandMw = round(node.demandMw * served, 2);
  }

  return { unservedMw: round(deficit, 1), oversupplyMw: 0 };
}

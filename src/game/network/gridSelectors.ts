import type { GridNode } from "@/game/network/networkTypes";
import type { AIJob, CommandTarget, GameState, PlayerActionType } from "@/game/types";

const effectNodeActions = new Set<PlayerActionType>([
  "smart_ev",
  "curtail_industry",
  "discharge_battery",
  "import_energy",
  "thermal_backup",
]);

const datacenterLocalActions: PlayerActionType[] = [
  "defer_ai",
  "migrate_ai",
  "externalize_ai",
  "reduce_model",
  "activate_cache",
];

function nodeActionCapacity(node: GridNode): number {
  return Math.max(node.flexibilityMw, node.maxProductionMw, node.maxDemandMw, node.productionMw, node.demandMw);
}

function byLargestActionCapacity(a: GridNode, b: GridNode): number {
  return nodeActionCapacity(b) - nodeActionCapacity(a) || a.label.localeCompare(b.label);
}

export function productionActionNode(state: Pick<GameState, "grid">, action: PlayerActionType): GridNode | undefined {
  return [...state.grid.nodes]
    .filter((node) => node.runtime?.production?.effectAction === action)
    .sort(byLargestActionCapacity)[0];
}

export function demandReductionActionNode(
  state: Pick<GameState, "grid">,
  action: PlayerActionType,
): GridNode | undefined {
  return [...state.grid.nodes]
    .filter((node) => node.runtime?.demand?.effectReductionAction === action)
    .sort(byLargestActionCapacity)[0];
}

export function defaultNodeTargetForAction(
  state: Pick<GameState, "grid">,
  action: PlayerActionType,
): CommandTarget | undefined {
  const node =
    action === "smart_ev" || action === "curtail_industry"
      ? demandReductionActionNode(state, action)
      : action === "discharge_battery"
        ? productionActionNode(state, action) ?? state.grid.nodes.find((item) => item.kind === "battery")
        : action === "import_energy" || action === "thermal_backup"
          ? productionActionNode(state, action)
          : undefined;

  return node ? { kind: "node", id: node.id } : undefined;
}

export function nodeSupportsEffectAction(node: GridNode, action: PlayerActionType): boolean {
  return node.runtime?.production?.effectAction === action || node.runtime?.demand?.effectReductionAction === action;
}

export function localActionsForNode(node: GridNode, jobs: AIJob[] = []): PlayerActionType[] {
  const actions: PlayerActionType[] = [];
  if (node.kind === "datacenter") actions.push(...datacenterLocalActions);
  if (
    jobs.some(
      (job) =>
        job.assignedNodeId === node.id &&
        job.kind === "agent" &&
        job.status !== "completed" &&
        job.status !== "failed" &&
        !job.timeoutApplied,
    )
  ) {
    actions.push("agent_timeout");
  }
  if (node.runtime?.demand?.effectReductionAction) actions.push(node.runtime.demand.effectReductionAction);
  if (node.runtime?.production?.effectAction) actions.push(node.runtime.production.effectAction);
  return [...new Set(actions)];
}

export function effectNodeTargetForAction(
  state: Pick<GameState, "grid">,
  action: PlayerActionType,
  requestedTarget?: CommandTarget,
): CommandTarget | undefined {
  if (!effectNodeActions.has(action)) return undefined;

  if (requestedTarget?.kind === "node") {
    const requestedNode = state.grid.nodes.find((node) => node.id === requestedTarget.id);
    if (requestedNode && nodeSupportsEffectAction(requestedNode, action)) return requestedTarget;
  }

  return defaultNodeTargetForAction(state, action);
}

export function criticalConsumerNodes(state: Pick<GameState, "grid">): GridNode[] {
  return state.grid.nodes.filter((node) => node.criticality === "critical" && node.maxDemandMw > 0);
}

export function criticalConsumerUnservedMw(state: Pick<GameState, "grid">): number {
  return criticalConsumerNodes(state).reduce(
    (total, node) => total + Math.max(0, node.demandMw - node.servedDemandMw),
    0,
  );
}

export function criticalConsumerDemandMw(state: Pick<GameState, "grid">): number {
  return criticalConsumerNodes(state).reduce((total, node) => total + node.demandMw, 0);
}

export function hasTrippedCriticalConsumerFeeder(state: Pick<GameState, "grid">): boolean {
  const criticalNodeIds = new Set(criticalConsumerNodes(state).map((node) => node.id));
  return state.grid.lines.some(
    (line) =>
      line.tripped &&
      line.isCritical &&
      (criticalNodeIds.has(line.fromNodeId) || criticalNodeIds.has(line.toNodeId)),
  );
}

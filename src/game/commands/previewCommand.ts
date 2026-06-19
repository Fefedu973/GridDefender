import { getActionDefinition } from "@/game/actions";
import { getCommandCost } from "@/game/commands/commandCosts";
import { getContractCurtailmentImpact } from "@/game/domain/contractImpact";
import { defaultNodeTargetForAction, effectNodeTargetForAction } from "@/game/network/gridSelectors";
import type { AIJob, CommandTarget, GameState, PlayerCommand } from "@/game/types";

export interface CommandPreview {
  cost: number;
  cooldownMinutes: number;
  summary: string;
  affectedLineIds: string[];
  lineImpacts: LineImpactPreview[];
  metricDeltas: {
    demandMw: number;
    productionMw: number;
    reserveMw: number;
  };
  resourceDeltas: {
    batteryLevelPct?: number;
    contractDurationPenalty?: number;
    contractCostPenalty?: number;
    contractMaxDurationMinutes?: number;
    contractMinDurationMinutes?: number;
    contractReputationPenalty?: number;
    estimatedBatteryLevelPct?: number;
    organizationName?: string;
  };
}

export interface LineImpactPreview {
  lineId: string;
  estimatedFlowDeltaMw: number;
  estimatedUtilizationDelta: number;
}

export function previewCommand(state: GameState, command: PlayerCommand): CommandPreview {
  const definition = getActionDefinition(command.action);
  const effectiveTarget = commandEffectiveTarget(state, command);
  const targetId = effectiveTarget?.id;
  const lineImpacts = estimateLineImpacts(state, command);
  const affectedLineIds =
    lineImpacts.length > 0
      ? lineImpacts.map((impact) => impact.lineId)
      : effectiveTarget?.kind === "line"
        ? [effectiveTarget.id]
        : effectiveTarget?.kind === "node"
          ? state.grid.nodes.find((node) => node.id === targetId)?.connectedLineIds ?? []
          : [];

  const cost = getCommandCost(command, state.scenario);
  const cooldownMinutes = definition?.cooldownMinutes ?? 0;
  const targetLabel =
    effectiveTarget?.kind === "line"
      ? state.grid.lines.find((line) => line.id === targetId)?.label
      : effectiveTarget?.kind === "node"
        ? state.grid.nodes.find((node) => node.id === targetId)?.label
        : effectiveTarget?.kind === "workload"
          ? state.aiJobs.find((job) => job.id === targetId)?.name
          : undefined;
  const topImpact = lineImpacts[0];
  const impactSummary = topImpact
    ? ` · ${topImpact.estimatedUtilizationDelta < 0 ? "-" : "+"}${Math.abs(
        Math.round(topImpact.estimatedUtilizationDelta * 100),
      )} pts ligne`
    : "";

  return {
    cost,
    cooldownMinutes,
    affectedLineIds,
    lineImpacts,
    metricDeltas: estimateMetricDeltas(state, command),
    resourceDeltas: estimateResourceDeltas(state, command),
    summary: `${targetLabel ?? "Réseau"} · ${cost} CP · ${cooldownMinutes} min CD${impactSummary}`,
  };
}

function commandEffectiveTarget(state: GameState, command: PlayerCommand): CommandTarget | undefined {
  return effectNodeTargetForAction(state, command.action, command.target) ?? command.target;
}

function estimateMetricDeltas(state: GameState, command: PlayerCommand) {
  const magnitude = command.intensityMw ?? getActionDefinition(command.action)?.defaultIntensityMw ?? 0;
  if (command.action === "smart_ev" || command.action === "curtail_industry") {
    return { demandMw: -magnitude, productionMw: 0, reserveMw: magnitude };
  }
  if (command.action === "discharge_battery" || command.action === "import_energy" || command.action === "thermal_backup") {
    return { demandMw: 0, productionMw: magnitude, reserveMw: magnitude };
  }

  const aiDelta = estimateAiDemandDelta(state, command);
  return { demandMw: aiDelta, productionMw: 0, reserveMw: -aiDelta };
}

function estimateResourceDeltas(state: GameState, command: PlayerCommand) {
  const magnitude = command.intensityMw ?? getActionDefinition(command.action)?.defaultIntensityMw ?? 0;
  const deltas: CommandPreview["resourceDeltas"] = {};

  if (command.action === "discharge_battery") {
    const duration = command.durationMinutes ?? getActionDefinition(command.action)?.defaultDurationMinutes ?? state.scenario.tickMinutes;
    const tickCount = Math.max(1, Math.ceil(duration / Math.max(1, state.scenario.tickMinutes)));
    const batteryLevelPct = -round(magnitude * 0.12 * tickCount);
    deltas.batteryLevelPct = batteryLevelPct;
    deltas.estimatedBatteryLevelPct = clamp(state.metrics.batteryLevel + batteryLevelPct, 0, 100);
  }

  if (command.action === "curtail_industry") {
    const target = commandEffectiveTarget(state, command);
    const node = target?.kind === "node" ? state.grid.nodes.find((item) => item.id === target.id) : undefined;
    const duration = command.durationMinutes ?? getActionDefinition(command.action)?.defaultDurationMinutes ?? state.scenario.tickMinutes;
    const impact = getContractCurtailmentImpact(node, magnitude, duration);
    deltas.contractCostPenalty = impact.costPenalty;
    deltas.contractDurationPenalty = impact.durationPenalty;
    deltas.contractMaxDurationMinutes = impact.maxDurationMinutes;
    deltas.contractMinDurationMinutes = impact.minDurationMinutes;
    deltas.contractReputationPenalty = impact.reputationPenalty;
    deltas.organizationName = impact.organizationName;
  }

  return deltas;
}

function estimateLineImpacts(state: GameState, command: PlayerCommand): LineImpactPreview[] {
  const impacts = new Map<string, LineImpactPreview>();
  const addImpact = (lineId: string, flowDeltaMw: number) => {
    const line = state.grid.lines.find((item) => item.id === lineId);
    if (!line) return;
    const previous = impacts.get(lineId);
    const nextFlowDelta = (previous?.estimatedFlowDeltaMw ?? 0) + flowDeltaMw;
    impacts.set(lineId, {
      lineId,
      estimatedFlowDeltaMw: round(nextFlowDelta),
      estimatedUtilizationDelta: round(nextFlowDelta / Math.max(1, line.capacityMw), 4),
    });
  };
  const addNodeImpact = (nodeId: string | undefined, totalFlowDeltaMw: number) => {
    if (!nodeId || Math.abs(totalFlowDeltaMw) < 0.1) return;
    const node = state.grid.nodes.find((item) => item.id === nodeId);
    if (!node || node.connectedLineIds.length === 0) return;
    const flowPerLine = totalFlowDeltaMw / node.connectedLineIds.length;
    for (const lineId of node.connectedLineIds) addImpact(lineId, flowPerLine);
  };

  const target = commandEffectiveTarget(state, command);
  const magnitude = command.intensityMw ?? getActionDefinition(command.action)?.defaultIntensityMw ?? 0;
  const defaultNodeId = (action: PlayerCommand["action"]) =>
    effectNodeTargetForAction(state, action, target)?.id ??
    (target?.kind === "node" ? target.id : defaultNodeTargetForAction(state, action)?.id);

  if (target?.kind === "line") {
    const line = state.grid.lines.find((item) => item.id === target.id);
    if (line && command.action === "reroute_line") addImpact(line.id, -Math.abs(line.currentFlowMw));
    if (line && command.action === "repair_line") addImpact(line.id, Math.max(8, line.nominalCapacityMw * 0.22));
    if (line && command.action === "authorize_overload") {
      const emergencyCapacity = line.capacityMw * 1.18;
      const current = Math.abs(line.currentFlowMw) / Math.max(1, line.capacityMw);
      const authorized = Math.abs(line.currentFlowMw) / Math.max(1, emergencyCapacity);
      addImpact(line.id, (authorized - current) * line.capacityMw);
    }
  }

  if (command.action === "smart_ev") {
    addNodeImpact(defaultNodeId(command.action), -magnitude);
  }

  if (command.action === "discharge_battery") {
    addNodeImpact(defaultNodeId(command.action), -magnitude);
  }

  if (command.action === "import_energy") {
    addNodeImpact(defaultNodeId(command.action), magnitude);
  }

  if (command.action === "thermal_backup") {
    addNodeImpact(defaultNodeId(command.action), magnitude);
  }

  if (command.action === "curtail_industry") {
    addNodeImpact(defaultNodeId(command.action), -magnitude);
  }

  if (command.action === "defer_ai") {
    const job = selectDeferrableJob(state, command);
    addNodeImpact(job?.assignedNodeId, -jobPower(job));
  }

  if (command.action === "externalize_ai") {
    const job = selectExternalizableJob(state, command);
    addNodeImpact(job?.assignedNodeId, -jobPower(job));
  }

  if (command.action === "reduce_model") {
    const job = selectReducibleJob(state, command);
    addNodeImpact(job?.assignedNodeId, -estimateModelReduction(job));
  }

  if (command.action === "activate_cache") {
    for (const job of selectCacheableJobs(state, command)) {
      addNodeImpact(job.assignedNodeId, -jobPower(job) * 0.18);
    }
  }

  if (command.action === "agent_timeout") {
    const job = selectAgentJob(state, command);
    addNodeImpact(job?.assignedNodeId, -jobPower(job) * 0.65);
  }

  if (command.action === "migrate_ai") {
    const migration = selectMigration(state, command);
    if (migration) {
      addNodeImpact(migration.fromNodeId, -jobPower(migration.job));
      addNodeImpact(migration.toNodeId, jobPower(migration.job));
    }
  }

  return [...impacts.values()]
    .filter((impact) => Math.abs(impact.estimatedUtilizationDelta) >= 0.01)
    .sort((a, b) => Math.abs(b.estimatedUtilizationDelta) - Math.abs(a.estimatedUtilizationDelta))
    .slice(0, 5);
}

function estimateAiDemandDelta(state: GameState, command: PlayerCommand) {
  if (command.action === "defer_ai") return negativeDelta(jobPower(selectDeferrableJob(state, command)));
  if (command.action === "externalize_ai") return negativeDelta(jobPower(selectExternalizableJob(state, command)));
  if (command.action === "reduce_model") return negativeDelta(estimateModelReduction(selectReducibleJob(state, command)));
  if (command.action === "activate_cache") {
    return negativeDelta(round(selectCacheableJobs(state, command).reduce((total, job) => total + jobPower(job) * 0.18, 0)));
  }
  if (command.action === "agent_timeout") return negativeDelta(round(jobPower(selectAgentJob(state, command)) * 0.65));
  return 0;
}

function selectDeferrableJob(state: GameState, command: PlayerCommand) {
  const targetNodeId = command.target?.kind === "node" ? command.target.id : undefined;
  const targetJobId = command.target?.kind === "workload" ? command.target.id : undefined;
  return [...state.aiJobs]
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
}

function selectExternalizableJob(state: GameState, command: PlayerCommand) {
  const targetNodeId = command.target?.kind === "node" ? command.target.id : undefined;
  const targetJobId = command.target?.kind === "workload" ? command.target.id : undefined;
  return [...state.aiJobs]
    .filter(
      (job) =>
        (!targetJobId || job.id === targetJobId) &&
        (!targetNodeId || job.assignedNodeId === targetNodeId) &&
        job.criticality !== "critical" &&
        !job.sovereign &&
        !job.externalized &&
        (job.status === "active" || job.status === "throttled"),
    )
    .sort((a, b) => jobPower(b) + b.basePowerMw - (jobPower(a) + a.basePowerMw))[0];
}

function selectReducibleJob(state: GameState, command: PlayerCommand) {
  const targetNodeId = command.target?.kind === "node" ? command.target.id : undefined;
  const targetJobId = command.target?.kind === "workload" ? command.target.id : undefined;
  return [...state.aiJobs]
    .filter(
      (job) =>
        (!targetJobId || job.id === targetJobId) &&
        (!targetNodeId || job.assignedNodeId === targetNodeId) &&
        job.status !== "queued" &&
        job.status !== "deferred" &&
        job.status !== "completed" &&
        job.status !== "failed" &&
        job.criticality !== "critical" &&
        job.modelScale > 0.55,
    )
    .sort((a, b) => jobPower(b) - jobPower(a))[0];
}

function selectCacheableJobs(state: GameState, command: PlayerCommand) {
  return state.aiJobs.filter(
    (job) =>
      !job.cached &&
      job.status !== "completed" &&
      job.status !== "failed" &&
      (!command.target ||
        (command.target.kind === "workload" && job.id === command.target.id) ||
        (command.target.kind === "node" && job.assignedNodeId === command.target.id)),
  );
}

function selectAgentJob(state: GameState, command: PlayerCommand) {
  if (command.target?.kind === "workload") return state.aiJobs.find((job) => job.id === command.target?.id);
  if (command.target?.kind === "node") {
    return state.aiJobs.find(
      (job) =>
        job.assignedNodeId === command.target?.id &&
        job.kind === "agent" &&
        job.status !== "completed" &&
        job.status !== "failed" &&
        !job.timeoutApplied,
    );
  }
  return state.aiJobs.find((job) => job.id === "looping-agent");
}

function selectMigration(state: GameState, command: PlayerCommand) {
  const selectedNodeId = command.target?.kind === "node" ? command.target.id : undefined;
  const targetJobId = command.target?.kind === "workload" ? command.target.id : undefined;
  const explicitDestinationNodeId = command.destinationNodeId;
  const requestedDestinationNodeId = explicitDestinationNodeId ?? selectedNodeId;
  const datacenterIds = state.grid.nodes.filter((node) => node.kind === "datacenter").map((node) => node.id);
  const job = [...state.aiJobs]
    .filter(
      (item) =>
        (!targetJobId || item.id === targetJobId) &&
        item.criticality !== "critical" &&
        !item.externalized &&
        item.status !== "completed" &&
        item.status !== "failed" &&
        datacenterIds.includes(item.assignedNodeId),
    )
    .sort((a, b) => jobPower(b) + b.basePowerMw - (jobPower(a) + a.basePowerMw))[0];
  if (!job) return undefined;
  const fromNodeId = job.assignedNodeId;
  const toNodeId =
    requestedDestinationNodeId &&
    requestedDestinationNodeId !== fromNodeId &&
    datacenterIds.includes(requestedDestinationNodeId)
      ? requestedDestinationNodeId
      : explicitDestinationNodeId
        ? undefined
        : job.preferredNodeIds.find((id) => id !== fromNodeId && datacenterIds.includes(id));
  return toNodeId ? { job, fromNodeId, toNodeId } : undefined;
}

function estimateModelReduction(job?: AIJob) {
  if (!job || job.modelScale <= 0.55) return 0;
  const nextScale = job.modelScale === 1 ? 0.75 : 0.55;
  return round(jobPower(job) * (1 - nextScale / job.modelScale));
}

function jobPower(job?: AIJob) {
  if (!job || job.externalized || job.status === "completed" || job.status === "failed") return 0;
  return Math.max(0, job.currentPowerMw || job.basePowerMw * job.modelScale);
}

function negativeDelta(value: number) {
  return value > 0 ? -value : 0;
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

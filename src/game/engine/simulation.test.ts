import assert from "node:assert/strict";
import test from "node:test";
import { applyPlayerAction, advanceSimulation, createInitialGameState, difficultyRulesForScenario } from "@/game/engine/simulation";
import { getMissionDefinition } from "@/content/missions/missionRegistry";
import { eveningPeakScenario } from "@/game/scenarios/eveningPeak";
import type { GameState, Scenario } from "@/game/types";

function runUntil(minute: number) {
  let state = createInitialGameState(eveningPeakScenario);
  state.phase = "running";
  while (state.minute < minute && state.phase !== "ended") {
    state = advanceSimulation(state);
  }
  return state;
}

function activeComponentResiduals(state: GameState) {
  const nodesById = new Map(state.grid.nodes.map((node) => [node.id, node]));
  const adjacency = new Map<string, string[]>(state.grid.nodes.map((node) => [node.id, []]));
  for (const line of state.grid.lines) {
    if (line.tripped) continue;
    adjacency.get(line.fromNodeId)?.push(line.toNodeId);
    adjacency.get(line.toNodeId)?.push(line.fromNodeId);
  }

  const seen = new Set<string>();
  const residuals: number[] = [];
  for (const node of state.grid.nodes) {
    if (seen.has(node.id)) continue;
    const stack = [node.id];
    seen.add(node.id);
    let residual = 0;
    while (stack.length > 0) {
      const id = stack.pop()!;
      const item = nodesById.get(id);
      if (item) residual += item.servedProductionMw - item.servedDemandMw;
      for (const next of adjacency.get(id) ?? []) {
        if (seen.has(next)) continue;
        seen.add(next);
        stack.push(next);
      }
    }
    residuals.push(residual);
  }
  return residuals;
}

test("grid runtime stays finite and owns national totals", () => {
  const state = runUntil(18 * 60 + 35);
  assert.equal(state.grid.nodes.length > 0, true);
  assert.equal(state.grid.lines.length > 0, true);
  assert.equal(Number.isFinite(state.metrics.productionMw), true);
  assert.equal(Number.isFinite(state.metrics.demandMw), true);
  assert.equal(Number.isFinite(state.grid.maxUtilization), true);

  const production = state.grid.nodes.reduce((total, node) => total + node.productionMw, 0);
  const demand = state.grid.nodes.reduce((total, node) => total + node.demandMw, 0);
  assert.ok(Math.abs(production - state.metrics.productionMw) < 0.2);
  assert.ok(Math.abs(demand - state.metrics.demandMw) < 0.2);
});

test("regional grids without the preferred national slack stay balanced", () => {
  let state = createInitialGameState(getMissionDefinition("corsica-islanding").scenario);
  assert.equal(state.grid.nodes.some((node) => node.id === "normandy-production"), false);

  state.phase = "running";
  state = advanceSimulation(state);

  assert.equal(Number.isFinite(state.grid.maxUtilization), true);
  assert.ok(activeComponentResiduals(state).every((residual) => Math.abs(residual) < 0.5));
});

test("scenario events apply declarative effects without relying on known event ids", () => {
  const scenario = structuredClone(eveningPeakScenario) as Scenario;
  scenario.id = "declarative-event-test";
  scenario.events = [
    {
      id: "arbitrary-ai-demand-event",
      minute: scenario.startMinute + scenario.tickMinutes,
      title: "Arbitrary AI demand",
      description: "A custom event with no hard-coded runtime branch.",
      severity: "critical",
      source: "ai",
      effects: [
        { type: "set_flag", flag: "evSurge", value: true },
        { type: "set_flag", flag: "cyberPriority", value: true },
        { type: "activate_ai_job", jobId: "cyber-critical" },
      ],
      resolvesWhen: [{ type: "effect_active", action: "smart_ev" }],
    },
  ];

  let state = createInitialGameState(scenario);
  state.phase = "running";
  state = advanceSimulation(state);

  assert.equal(state.triggeredEventIds.includes("arbitrary-ai-demand-event"), true);
  assert.equal(state.flags.evSurge, true);
  assert.equal(state.flags.cyberPriority, true);
  assert.equal(state.aiJobs.find((job) => job.id === "cyber-critical")?.status, "active");
  assert.equal(state.incidents.find((incident) => incident.id === "arbitrary-ai-demand-event")?.source, "ai");

  state = applyPlayerAction(state, { action: "smart_ev", intensityMw: 20 });
  assert.notEqual(state.incidents.find((incident) => incident.id === "arbitrary-ai-demand-event")?.resolvedAt, undefined);
});

test("command capacity and cooldown are consumed only by applied commands", () => {
  const initial = createInitialGameState(eveningPeakScenario);
  const afterBattery = applyPlayerAction(initial, {
    action: "discharge_battery",
    target: { kind: "node", id: "centre-battery" },
    intensityMw: 20,
    durationMinutes: 15,
  });

  assert.equal(afterBattery.commandCapacity, initial.commandCapacity - 20);
  assert.equal(afterBattery.activeEffects.some((effect) => effect.action === "discharge_battery"), true);

  const afterRejectedCooldown = applyPlayerAction(afterBattery, {
    action: "discharge_battery",
    target: { kind: "node", id: "centre-battery" },
  });

  assert.equal(afterRejectedCooldown.commandCapacity, afterBattery.commandCapacity);
  assert.match(afterRejectedCooldown.actionHistory[0].result, /disponible/);
});

test("commands unavailable in the current mission are rejected without spending capacity", () => {
  const initial = createInitialGameState({
    ...eveningPeakScenario,
    availableActions: ["discharge_battery"],
  });

  const rejected = applyPlayerAction(initial, {
    action: "externalize_ai",
    target: { kind: "workload", id: "video-demo" },
  });

  assert.equal(rejected.commandCapacity, initial.commandCapacity);
  assert.equal(rejected.actionHistory[0].type, "externalize_ai");
  assert.equal(rejected.actionHistory[0].impact, "negative");
  assert.match(rejected.actionHistory[0].result, /pas encore disponible|n'est pas encore disponible/);
});

test("scenario command cost adjustments affect capacity spend and action history", () => {
  const initial = createInitialGameState({
    ...eveningPeakScenario,
    commandCostAdjustments: {
      discharge_battery: -8,
    },
  });

  const afterBattery = applyPlayerAction(initial, {
    action: "discharge_battery",
    target: { kind: "node", id: "centre-battery" },
    intensityMw: 20,
    durationMinutes: 15,
  });

  assert.equal(afterBattery.commandCapacity, initial.commandCapacity - 12);
  assert.equal(afterBattery.cumulative.commandCapacitySpent, 12);
  assert.equal(afterBattery.actionHistory[0].cost, 12);
});

test("production commands retarget unsupported clicked nodes before applying effects", () => {
  const initial = createInitialGameState(eveningPeakScenario);
  const afterBattery = applyPlayerAction(initial, {
    action: "discharge_battery",
    target: { kind: "node", id: "lyon-industry" },
    intensityMw: 20,
    durationMinutes: 15,
  });

  const effect = afterBattery.activeEffects.find((item) => item.action === "discharge_battery");
  assert.equal(effect?.target?.id, "centre-battery");
  assert.equal(afterBattery.actionHistory[0].targetLabel, "Batterie Est");
});

test("AI migration changes the workload datacenter and grid demand", () => {
  const initial = createInitialGameState(eveningPeakScenario);
  const migrated = applyPlayerAction(initial, {
    action: "migrate_ai",
    target: { kind: "workload", id: "video-demo" },
  });

  const job = migrated.aiJobs.find((item) => item.id === "video-demo");
  assert.equal(job?.assignedNodeId, "grenoble-ai-edge");
  assert.equal(migrated.commandCapacity, initial.commandCapacity - 18);
});

test("explicit AI migration destinations are honored without fallback", () => {
  const sameSiteInitial = createInitialGameState(eveningPeakScenario);
  const sameSite = applyPlayerAction(sameSiteInitial, {
    action: "migrate_ai",
    target: { kind: "workload", id: "video-demo" },
    destinationNodeId: "paris-saclay-ai",
  });

  assert.equal(sameSite.aiJobs.find((item) => item.id === "video-demo")?.assignedNodeId, "paris-saclay-ai");
  assert.equal(sameSite.commandCapacity, sameSiteInitial.commandCapacity);
  assert.match(sameSite.actionHistory[0].result, /indisponible|migrable/);

  const targetInitial = createInitialGameState(eveningPeakScenario);
  const targeted = applyPlayerAction(targetInitial, {
    action: "migrate_ai",
    target: { kind: "workload", id: "video-demo" },
    destinationNodeId: "grenoble-ai-edge",
  });

  assert.equal(targeted.aiJobs.find((item) => item.id === "video-demo")?.assignedNodeId, "grenoble-ai-edge");
  assert.equal(targeted.commandCapacity, targetInitial.commandCapacity - 18);
});

test("external cloud removes non-sovereign AI load but creates a sovereignty tradeoff", () => {
  let state = runUntil(18 * 60 + 35);
  const beforeCapacity = state.commandCapacity;
  const beforeDemand = state.metrics.demandMw;

  state = applyPlayerAction(state, {
    action: "externalize_ai",
    target: { kind: "workload", id: "video-demo" },
  });

  const job = state.aiJobs.find((item) => item.id === "video-demo");
  assert.equal(job?.externalized, true);
  assert.equal(job?.currentPowerMw, 0);
  assert.equal(state.commandCapacity, beforeCapacity - 8);
  assert.ok(state.metrics.demandMw < beforeDemand - 20);

  const sovereigntyAfterAction = state.metrics.sovereignty;
  state.phase = "running";
  state = advanceSimulation(state);

  assert.ok(state.metrics.sovereignty < sovereigntyAfterAction);
});

test("external cloud rejects critical AI work without spending command capacity", () => {
  const state = runUntil(19 * 60 + 15);
  const beforeCapacity = state.commandCapacity;

  const rejected = applyPlayerAction(state, {
    action: "externalize_ai",
    target: { kind: "workload", id: "cyber-critical" },
  });

  assert.equal(rejected.aiJobs.find((item) => item.id === "cyber-critical")?.externalized, false);
  assert.equal(rejected.commandCapacity, beforeCapacity);
  assert.match(rejected.actionHistory[0].result, /externalisable/);
});

test("curtailing a contracted industry trades grid relief for cost and satisfaction", () => {
  const initial = createInitialGameState(eveningPeakScenario);
  const initialLyonDemand = initial.grid.nodes.find((node) => node.id === "lyon-industry")?.demandMw ?? 0;
  const curtailed = applyPlayerAction(initial, {
    action: "curtail_industry",
    target: { kind: "node", id: "lyon-industry" },
    intensityMw: 20,
    durationMinutes: 30,
  });
  const lyonDemandAfterAction = curtailed.grid.nodes.find((node) => node.id === "lyon-industry")?.demandMw ?? 0;
  const costAfterAction = curtailed.metrics.cost;
  const satisfactionAfterAction = curtailed.metrics.publicSatisfaction;

  curtailed.phase = "running";
  const afterTick = advanceSimulation(curtailed);

  assert.ok(lyonDemandAfterAction < initialLyonDemand);
  assert.ok(afterTick.metrics.cost < costAfterAction);
  assert.ok(afterTick.metrics.publicSatisfaction < satisfactionAfterAction);
  assert.ok(afterTick.cumulative.operatingCost > curtailed.cumulative.operatingCost);
});

test("battery node exposes runtime storage level for 3D model animation", () => {
  let state = createInitialGameState(eveningPeakScenario);
  const initialLevel = state.grid.nodes.find((node) => node.id === "centre-battery")?.storageLevelPct;

  state = applyPlayerAction(state, {
    action: "discharge_battery",
    target: { kind: "node", id: "centre-battery" },
    intensityMw: 30,
    durationMinutes: 20,
  });
  state.phase = "running";
  state = advanceSimulation(state);

  const nextLevel = state.grid.nodes.find((node) => node.id === "centre-battery")?.storageLevelPct;
  assert.equal(typeof initialLevel, "number");
  assert.equal(typeof nextLevel, "number");
  assert.ok((nextLevel ?? 0) < (initialLevel ?? 0));
});

test("applied commands record tactical feedback for immediate player response", () => {
  const initial = createInitialGameState(eveningPeakScenario);
  const afterBattery = applyPlayerAction(initial, {
    action: "discharge_battery",
    target: { kind: "node", id: "centre-battery" },
    intensityMw: 35,
    durationMinutes: 20,
  });
  const feedback = afterBattery.actionHistory[0]?.feedback;

  assert.ok(feedback);
  assert.ok(feedback.tacticalScore > 0);
  assert.ok(feedback.comboLevel >= 1);
  assert.equal(Number.isFinite(feedback.reserveDeltaMw), true);
});

test("targeted AI defer can schedule a workload from the timeline", () => {
  const initial = createInitialGameState(eveningPeakScenario);
  const scheduledMinute = 19 * 60 + 5;
  const deferred = applyPlayerAction(initial, {
    action: "defer_ai",
    target: { kind: "workload", id: "video-demo" },
    scheduledMinute,
  });

  const job = deferred.aiJobs.find((item) => item.id === "video-demo");
  assert.equal(job?.status, "deferred");
  assert.equal(job?.deferredUntil, scheduledMinute);
});

test("ATHENA autopilot spends a token and carries an extra command penalty", () => {
  const initial = createInitialGameState(eveningPeakScenario);
  const afterAutopilot = applyPlayerAction(initial, {
    action: "smart_ev",
    source: "athena",
    intensityMw: 20,
  });

  assert.equal(afterAutopilot.athenaTokens, initial.athenaTokens - 1);
  assert.equal(afterAutopilot.commandCapacity, initial.commandCapacity - 15);
  assert.equal(afterAutopilot.cumulative.athenaAutopilotUses, 1);
  assert.equal(afterAutopilot.cumulative.commandCapacitySpent, 15);

  const exhausted = {
    ...afterAutopilot,
    athenaTokens: 0,
    actionCooldowns: {},
  };
  const rejected = applyPlayerAction(exhausted, {
    action: "import_energy",
    source: "athena",
    intensityMw: 20,
  });

  assert.equal(rejected.athenaTokens, 0);
  assert.equal(rejected.commandCapacity, exhausted.commandCapacity);
  assert.match(rejected.actionHistory[0].result, /plus de jeton/);
});

test("agent timeout only affects an agent on the targeted datacenter", () => {
  const initial = createInitialGameState(eveningPeakScenario);
  const agent = initial.aiJobs.find((item) => item.id === "looping-agent");
  assert.ok(agent);
  agent.status = "active";
  agent.currentPowerMw = 30;
  initial.flags.agentLoop = true;

  const wrongDatacenter = applyPlayerAction(initial, {
    action: "agent_timeout",
    target: { kind: "node", id: "paris-saclay-ai" },
  });
  assert.equal(wrongDatacenter.commandCapacity, initial.commandCapacity);
  assert.equal(wrongDatacenter.aiJobs.find((item) => item.id === "looping-agent")?.timeoutApplied, false);

  const rightDatacenter = applyPlayerAction(initial, {
    action: "agent_timeout",
    target: { kind: "node", id: agent.assignedNodeId },
  });
  assert.equal(rightDatacenter.commandCapacity, initial.commandCapacity - 8);
  assert.equal(rightDatacenter.aiJobs.find((item) => item.id === "looping-agent")?.timeoutApplied, true);
});

test("critical scenario events keep the simulation running", () => {
  const state = runUntil(18 * 60 + 50);
  assert.equal(state.phase, "running");
  assert.equal(state.assistantMessages[0].title, "Incident critique");
});

test("difficulty profiles tighten victory thresholds and cumulative penalties", () => {
  const tutorial = difficultyRulesForScenario({ difficulty: "tutorial" });
  const standard = difficultyRulesForScenario({ difficulty: "standard" });
  const hard = difficultyRulesForScenario({ difficulty: "hard" });
  const expert = difficultyRulesForScenario({ difficulty: "expert" });

  assert.ok(tutorial.victoryMinStability < standard.victoryMinStability);
  assert.ok(hard.victoryMinCriticalContinuity > standard.victoryMinCriticalContinuity);
  assert.ok(expert.victoryMinStability > hard.victoryMinStability);
  assert.ok(expert.cumulativePenaltyMultiplier > hard.cumulativePenaltyMultiplier);
});

test("reroute command opens and later recloses a controllable line", () => {
  let state = createInitialGameState(eveningPeakScenario);
  state = applyPlayerAction(state, {
    action: "reroute_line",
    target: { kind: "line", id: "atlantic-bordeaux" },
    durationMinutes: 5,
  });
  assert.equal(state.grid.lines.find((line) => line.id === "atlantic-bordeaux")?.tripped, true);
  assert.ok(activeComponentResiduals(state).every((residual) => Math.abs(residual) < 0.5));

  state.phase = "running";
  state = advanceSimulation(state);
  assert.equal(state.grid.lines.find((line) => line.id === "atlantic-bordeaux")?.tripped, false);
});

test("line runtime keeps utilization history and delayed repair state", () => {
  let state = createInitialGameState(eveningPeakScenario);
  state.phase = "running";
  state = advanceSimulation(state);
  state = advanceSimulation(state);

  const liveLine = state.grid.lines.find((line) => line.id === "paris-lyon");
  assert.ok(liveLine);
  assert.equal(liveLine.utilizationHistory.length, 2);
  assert.ok(liveLine.utilizationHistory.every((ratio) => Number.isFinite(ratio) && ratio >= 0));

  const trippedLine = state.grid.lines.find((line) => line.id === "atlantic-bordeaux");
  assert.ok(trippedLine);
  trippedLine.tripped = true;
  trippedLine.protectionState = "tripped";
  trippedLine.temperatureC = 125;
  trippedLine.tripCount += 1;

  state = applyPlayerAction(state, {
    action: "repair_line",
    target: { kind: "line", id: "atlantic-bordeaux" },
    durationMinutes: state.scenario.tickMinutes * 2,
  });

  let repairLine = state.grid.lines.find((line) => line.id === "atlantic-bordeaux");
  assert.equal(repairLine?.tripped, true);
  assert.equal(repairLine?.protectionState, "repairing");
  assert.equal(repairLine?.repairUntil, state.minute + state.scenario.tickMinutes * 2);

  state.phase = "running";
  state = advanceSimulation(state);
  repairLine = state.grid.lines.find((line) => line.id === "atlantic-bordeaux");
  assert.equal(repairLine?.tripped, true);
  assert.equal(repairLine?.protectionState, "repairing");

  state.phase = "running";
  state = advanceSimulation(state);
  repairLine = state.grid.lines.find((line) => line.id === "atlantic-bordeaux");
  assert.equal(repairLine?.tripped, false);
  assert.equal(repairLine?.protectionState, "closed");
  assert.equal(repairLine?.repairUntil, undefined);
});

test("an optimized Paris peak run is winnable but spends scarce capacity", () => {
  let state = createInitialGameState(eveningPeakScenario);
  state.phase = "running";
  const commands: Record<number, Array<{ action: Parameters<typeof applyPlayerAction>[1] }>> = {
    [18 * 60]: [
      { action: { action: "smart_ev", intensityMw: 30 } },
      { action: { action: "import_energy", intensityMw: 45 } },
    ],
    [18 * 60 + 30]: [
      { action: { action: "migrate_ai" } },
      { action: { action: "activate_cache" } },
    ],
    [18 * 60 + 50]: [
      { action: { action: "discharge_battery", intensityMw: 45 } },
      { action: { action: "thermal_backup", intensityMw: 45 } },
    ],
    [19 * 60 + 10]: [
      { action: { action: "reduce_model" } },
      { action: { action: "curtail_industry", intensityMw: 20 } },
    ],
    [19 * 60 + 30]: [{ action: { action: "agent_timeout" } }],
  };

  while (state.phase !== "ended") {
    for (const command of commands[state.minute] ?? []) {
      state = applyPlayerAction(state, command.action);
    }
    state = advanceSimulation(state);
  }

  assert.equal(state.outcome?.result, "victory");
  assert.ok(state.commandCapacity < 12);
  assert.ok(state.metrics.score < 720);
  assert.ok(state.criticalMoments.length > 0);
  assert.ok(state.outcome?.replayMoment);
  assert.equal(Number.isFinite(state.outcome.replayMoment.maxUtilization), true);
});

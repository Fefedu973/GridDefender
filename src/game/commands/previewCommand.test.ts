import assert from "node:assert/strict";
import test from "node:test";
import { previewCommand } from "@/game/commands/previewCommand";
import { createInitialGameState } from "@/game/engine/simulation";
import { eveningPeakScenario } from "@/game/scenarios/eveningPeak";

test("command preview estimates local line impact without mutating state", () => {
  const state = createInitialGameState(eveningPeakScenario);
  const beforeCapacity = state.commandCapacity;
  const beforeHistoryLength = state.actionHistory.length;

  const preview = previewCommand(state, {
    action: "discharge_battery",
    target: { kind: "node", id: "centre-battery" },
    intensityMw: 32,
    durationMinutes: 20,
  });

  assert.equal(preview.cost, 20);
  assert.equal(preview.metricDeltas.productionMw, 32);
  assert.equal(preview.metricDeltas.reserveMw, 32);
  assert.ok((preview.resourceDeltas.batteryLevelPct ?? 0) < 0);
  assert.ok((preview.resourceDeltas.estimatedBatteryLevelPct ?? 100) < state.metrics.batteryLevel);
  assert.ok(preview.lineImpacts.length > 0);
  assert.ok(preview.lineImpacts.every((impact) => impact.estimatedUtilizationDelta < 0));
  assert.equal(state.commandCapacity, beforeCapacity);
  assert.equal(state.actionHistory.length, beforeHistoryLength);
});

test("command preview uses scenario-specific command cost adjustments", () => {
  const state = createInitialGameState({
    ...eveningPeakScenario,
    commandCostAdjustments: {
      discharge_battery: -6,
    },
  });

  const preview = previewCommand(state, {
    action: "discharge_battery",
    target: { kind: "node", id: "centre-battery" },
  });

  assert.equal(preview.cost, 14);
  assert.match(preview.summary, /14 CP/);
});

test("command preview retargets production effects to the runtime node that owns the action", () => {
  const state = createInitialGameState(eveningPeakScenario);
  const battery = state.grid.nodes.find((node) => node.id === "centre-battery");
  assert.ok(battery);

  const preview = previewCommand(state, {
    action: "discharge_battery",
    target: { kind: "node", id: "lyon-industry" },
    intensityMw: 32,
    durationMinutes: 20,
  });

  assert.match(preview.summary, /Batterie/);
  assert.ok(preview.affectedLineIds.length > 0);
  assert.ok(preview.affectedLineIds.every((lineId) => battery.connectedLineIds.includes(lineId)));
});

test("AI migration preview shows source relief and destination stress", () => {
  const state = createInitialGameState(eveningPeakScenario);
  const preview = previewCommand(state, {
    action: "migrate_ai",
    target: { kind: "workload", id: "video-demo" },
  });

  assert.equal(preview.cost, 18);
  assert.ok(preview.lineImpacts.some((impact) => impact.estimatedUtilizationDelta < 0));
  assert.ok(preview.lineImpacts.some((impact) => impact.estimatedUtilizationDelta > 0));
  assert.ok(preview.affectedLineIds.includes("rhone-grenoble-edge"));
});

test("AI migration preview respects explicit destination", () => {
  const state = createInitialGameState(eveningPeakScenario);
  const noOpPreview = previewCommand(state, {
    action: "migrate_ai",
    target: { kind: "workload", id: "video-demo" },
    destinationNodeId: "paris-saclay-ai",
  });

  assert.equal(noOpPreview.lineImpacts.length, 0);
  assert.equal(noOpPreview.affectedLineIds.length, 0);

  const targetedPreview = previewCommand(state, {
    action: "migrate_ai",
    target: { kind: "workload", id: "looping-agent" },
    destinationNodeId: "paris-saclay-ai",
  });

  assert.ok(targetedPreview.lineImpacts.some((impact) => impact.estimatedUtilizationDelta < 0));
  assert.ok(targetedPreview.lineImpacts.some((impact) => impact.estimatedUtilizationDelta > 0));
  assert.ok(targetedPreview.affectedLineIds.includes("rhone-grenoble-edge"));
});

test("external cloud preview relieves the source datacenter load", () => {
  const state = createInitialGameState(eveningPeakScenario);
  const job = state.aiJobs.find((item) => item.id === "video-demo");
  assert.ok(job);
  job.status = "active";
  job.currentPowerMw = 30;

  const preview = previewCommand(state, {
    action: "externalize_ai",
    target: { kind: "workload", id: "video-demo" },
  });

  assert.equal(preview.cost, 8);
  assert.ok(preview.metricDeltas.demandMw < -20);
  assert.ok(preview.metricDeltas.reserveMw > 20);
  assert.ok(preview.lineImpacts.length > 0);
  assert.ok(preview.lineImpacts.every((impact) => impact.estimatedUtilizationDelta < 0));
});

test("agent timeout preview respects the targeted datacenter", () => {
  const state = createInitialGameState(eveningPeakScenario);
  const agent = state.aiJobs.find((item) => item.id === "looping-agent");
  assert.ok(agent);
  agent.status = "active";
  agent.currentPowerMw = 30;

  const wrongDatacenterPreview = previewCommand(state, {
    action: "agent_timeout",
    target: { kind: "node", id: "paris-saclay-ai" },
  });
  const rightDatacenterPreview = previewCommand(state, {
    action: "agent_timeout",
    target: { kind: "node", id: agent.assignedNodeId },
  });

  assert.equal(wrongDatacenterPreview.metricDeltas.demandMw, 0);
  assert.ok(rightDatacenterPreview.metricDeltas.demandMw < 0);
});

test("curtailment preview exposes organization contract penalties", () => {
  const state = createInitialGameState(eveningPeakScenario);
  const preview = previewCommand(state, {
    action: "curtail_industry",
    target: { kind: "node", id: "lyon-industry" },
    intensityMw: 20,
    durationMinutes: 30,
  });

  assert.equal(preview.resourceDeltas.organizationName, "Industrie Lyonnaise");
  assert.ok((preview.resourceDeltas.contractCostPenalty ?? 0) > 0);
  assert.ok((preview.resourceDeltas.contractReputationPenalty ?? 0) > 0);
  assert.equal(preview.resourceDeltas.contractDurationPenalty, 0);
  assert.equal(preview.resourceDeltas.contractMinDurationMinutes, 20);
  assert.equal(preview.resourceDeltas.contractMaxDurationMinutes, 45);
});

test("curtailment preview flags contract windows when duration is too short", () => {
  const state = createInitialGameState(eveningPeakScenario);
  const preview = previewCommand(state, {
    action: "curtail_industry",
    target: { kind: "node", id: "lyon-industry" },
    intensityMw: 20,
    durationMinutes: 5,
  });

  assert.equal(preview.resourceDeltas.organizationName, "Industrie Lyonnaise");
  assert.ok((preview.resourceDeltas.contractDurationPenalty ?? 0) > 0);
  assert.equal(preview.resourceDeltas.contractMinDurationMinutes, 20);
  assert.equal(preview.resourceDeltas.contractMaxDurationMinutes, 45);
});

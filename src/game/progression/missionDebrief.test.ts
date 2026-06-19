import assert from "node:assert/strict";
import { test } from "node:test";
import type { ActionRecord, CumulativeMetrics, GameMetrics } from "@/game/types";
import { createMissionDebrief } from "@/game/progression/missionDebrief";

const baseMetrics: GameMetrics = {
  stability: 84,
  carbon: 82,
  cost: 78,
  sovereignty: 84,
  aiProductivity: 86,
  publicSatisfaction: 82,
  criticalContinuity: 94,
  batteryLevel: 42,
  productionMw: 180,
  demandMw: 172,
  aiLoadMw: 34,
  reserveMw: 8,
  co2Intensity: 92,
  score: 790,
};

const baseCumulative: CumulativeMetrics = {
  overloadMinutes: 0,
  criticalLineMinutes: 0,
  unservedEnergyMwh: 0,
  criticalUnservedEnergyMwh: 0,
  co2Tons: 7.4,
  operatingCost: 120,
  aiValueDelivered: 90,
  wastedAiEnergyMwh: 0.4,
  commandCapacitySpent: 48,
  athenaAutopilotUses: 0,
  emergencyActions: 0,
  lineTrips: 0,
};

function action(type: ActionRecord["type"]): ActionRecord {
  return {
    id: `${type}-1`,
    impact: "positive",
    label: type,
    minute: 0,
    result: "ok",
    type,
  };
}

test("mission debrief recognizes a sovereign strategy without external actions", () => {
  const debrief = createMissionDebrief({
    metrics: {
      ...baseMetrics,
      stability: 60,
      sovereignty: 100,
      aiProductivity: 95,
      criticalContinuity: 95,
      reserveMw: 0,
    },
    cumulative: baseCumulative,
    actions: [action("migrate_ai"), action("activate_cache")],
  });

  assert.equal(debrief.doctrineId, "sovereignty");
  assert.ok(debrief.strengths.includes("Souveraineté numérique préservée"));
});

test("mission debrief recognizes an economic strategy with low command spend", () => {
  const debrief = createMissionDebrief({
    metrics: {
      ...baseMetrics,
      stability: 70,
      carbon: 60,
      cost: 96,
      sovereignty: 70,
      publicSatisfaction: 92,
      criticalContinuity: 75,
    },
    cumulative: {
      ...baseCumulative,
      commandCapacitySpent: 22,
      operatingCost: 80,
    },
    actions: [action("smart_ev")],
  });

  assert.equal(debrief.doctrineId, "economy");
  assert.ok(debrief.styleScores.economy > debrief.styleScores.resilience);
});

test("mission debrief prioritizes critical continuity before softer advice", () => {
  const debrief = createMissionDebrief({
    metrics: baseMetrics,
    cumulative: {
      ...baseCumulative,
      criticalUnservedEnergyMwh: 0.8,
      lineTrips: 2,
      overloadMinutes: 35,
      athenaAutopilotUses: 1,
    },
    actions: [action("thermal_backup"), action("repair_line")],
  });

  assert.equal(debrief.recommendation, "Priorité prochaine : protéger les nœuds critiques avant tout arbitrage coût ou souveraineté.");
  assert.ok(debrief.watchItems.includes("Cascade de protections"));
  assert.ok(debrief.watchItems.includes("Énergie non servie"));
});

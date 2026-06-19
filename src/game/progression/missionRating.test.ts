import assert from "node:assert/strict";
import test from "node:test";
import { medalForMissionRun, medalForScore } from "@/game/progression/missionRating";
import type { CumulativeMetrics } from "@/game/types";

const thresholds = { bronze: 500, silver: 700, gold: 850 };

function cumulative(athenaAutopilotUses = 0): CumulativeMetrics {
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
    athenaAutopilotUses,
    emergencyActions: 0,
    lineTrips: 0,
  };
}

test("medal thresholds map score bands to campaign medals", () => {
  assert.equal(medalForScore(860, thresholds), "gold");
  assert.equal(medalForScore(760, thresholds), "silver");
  assert.equal(medalForScore(540, thresholds), "bronze");
  assert.equal(medalForScore(320, thresholds), "none");
});

test("gold medal requires a run without ATHENA autopilot", () => {
  assert.equal(
    medalForMissionRun({ outcome: { score: 930 }, cumulative: cumulative(0) }, thresholds),
    "gold",
  );
  assert.equal(
    medalForMissionRun({ outcome: { score: 930 }, cumulative: cumulative(1) }, thresholds),
    "silver",
  );
  assert.equal(
    medalForMissionRun({ outcome: { score: 760 }, cumulative: cumulative(1) }, thresholds),
    "silver",
  );
});

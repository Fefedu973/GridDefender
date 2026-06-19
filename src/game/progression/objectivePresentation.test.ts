import assert from "node:assert/strict";
import test from "node:test";
import { formatObjectiveRule, formatObjectiveValue, objectiveProgress } from "@/game/progression/objectivePresentation";
import type { ObjectiveResult } from "@/game/types";

const stabilityObjective: ObjectiveResult = {
  id: "stable",
  label: "Stabiliser le réseau",
  metric: "stability",
  operator: ">=",
  target: 70,
  value: 63.4,
  passed: false,
  required: true,
};

test("objective presentation formats player-facing labels instead of metric ids", () => {
  assert.equal(formatObjectiveRule(stabilityObjective), "Stabilité au moins 70%");
  assert.equal(formatObjectiveValue(stabilityObjective, stabilityObjective.value), "63%");
});

test("objective presentation formats lower-is-better cumulative metrics", () => {
  const unservedObjective: ObjectiveResult = {
    id: "no-unserved",
    label: "Éviter les coupures",
    metric: "unservedEnergyMwh",
    operator: "<=",
    target: 0.4,
    value: 0.18,
    passed: true,
  };

  assert.equal(formatObjectiveRule(unservedObjective), "Énergie non servie max 0.4 MWh");
  assert.equal(formatObjectiveValue(unservedObjective, unservedObjective.value), "0.2 MWh");
  assert.equal(objectiveProgress(unservedObjective), 1);
});

test("objective progress keeps impossible zero-target failures visually empty", () => {
  const failedObjective: ObjectiveResult = {
    id: "no-trips",
    label: "Aucun déclenchement",
    metric: "lineTrips",
    operator: "<=",
    target: 0,
    value: 1,
    passed: false,
    required: true,
  };

  assert.equal(formatObjectiveRule(failedObjective), "Trips de lignes max 0");
  assert.equal(objectiveProgress(failedObjective), 0);
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  filterAvailableActions,
  isActionAvailableForScenario,
} from "@/game/commands/commandAvailability";
import type { Scenario } from "@/game/types";

test("command availability defaults to all actions for sandbox-like scenarios", () => {
  const scenario = {} as Pick<Scenario, "availableActions">;

  assert.equal(isActionAvailableForScenario(scenario, "externalize_ai"), true);
  assert.deepEqual(filterAvailableActions({ scenario }, ["discharge_battery", "externalize_ai"]), [
    "discharge_battery",
    "externalize_ai",
  ]);
});

test("command availability filters locked tools from a mission scenario", () => {
  const scenario = {
    availableActions: ["discharge_battery", "smart_ev"],
  } satisfies Pick<Scenario, "availableActions">;

  assert.equal(isActionAvailableForScenario(scenario, "discharge_battery"), true);
  assert.equal(isActionAvailableForScenario(scenario, "externalize_ai"), false);
  assert.deepEqual(filterAvailableActions({ scenario }, ["discharge_battery", "externalize_ai", "smart_ev"]), [
    "discharge_battery",
    "smart_ev",
  ]);
});

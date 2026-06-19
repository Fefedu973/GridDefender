import assert from "node:assert/strict";
import test from "node:test";
import { getAdvisorOptions } from "@/game/advisor/options";
import { createInitialGameState } from "@/game/engine/simulation";
import { eveningPeakScenario } from "@/game/scenarios/eveningPeak";

test("advisor options put the live recommendation first and expose preview impact", () => {
  const state = createInitialGameState(eveningPeakScenario);
  state.flags.evSurge = true;

  const options = getAdvisorOptions(state);

  assert.equal(options[0].action, "smart_ev");
  assert.equal(options[0].reason, "recommended");
  assert.deepEqual(options[0].command.target, { kind: "node", id: "bordeaux-ev" });
  assert.equal(options[0].targetLabel, "Bordeaux EV");
  assert.equal(options[0].cost, 10);
  assert.equal(options[0].autopilotEligible, false);
  assert.ok(options[0].reserveDeltaMw > 0);
  assert.ok(options.length >= 2);
});

test("advisor options flag capacity-blocked autopilot candidates", () => {
  const state = createInitialGameState(eveningPeakScenario);
  state.flags.agentLoop = true;
  const agent = state.aiJobs.find((item) => item.id === "looping-agent");
  assert.ok(agent);
  agent.status = "active";
  state.commandCapacity = 1;

  const options = getAdvisorOptions(state);

  assert.equal(options[0].action, "agent_timeout");
  assert.equal(options[0].capacityBlocked, true);
  assert.equal(options[0].autopilotEligible, false);
});

test("advisor options target the actual looping agent workload", () => {
  const state = createInitialGameState(eveningPeakScenario);
  const agent = state.aiJobs.find((item) => item.id === "looping-agent");
  assert.ok(agent);
  agent.status = "active";
  agent.currentPowerMw = 30;
  state.flags.agentLoop = true;

  const options = getAdvisorOptions(state);

  assert.equal(options[0].action, "agent_timeout");
  assert.deepEqual(options[0].command.target, { kind: "workload", id: "looping-agent" });
  assert.equal(options[0].targetLabel, agent.name);
  assert.equal(options[0].autopilotEligible, true);
  assert.ok(options[0].demandDeltaMw < 0);
});

test("advisor options exclude tools locked by the current mission", () => {
  const state = createInitialGameState({
    ...eveningPeakScenario,
    availableActions: ["discharge_battery"],
  });
  state.flags.evSurge = true;
  state.metrics.batteryLevel = 70;

  const options = getAdvisorOptions(state);

  assert.equal(options.some((option) => option.action === "smart_ev"), false);
  assert.equal(options[0].action, "discharge_battery");
});

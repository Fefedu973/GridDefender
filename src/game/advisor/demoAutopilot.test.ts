import assert from "node:assert/strict";
import test from "node:test";
import { getMissionDefinition } from "@/content/missions/missionRegistry";
import { getAthenaDemoDecision, getAthenaDemoDecisions } from "@/game/advisor/demoAutopilot";
import { advanceSimulation, applyPlayerAction, createInitialGameState } from "@/game/engine/simulation";
import { eveningPeakScenario } from "@/game/scenarios/eveningPeak";

test("demo autopilot selects and marks the recommended ATHENA command", () => {
  const state = createInitialGameState(eveningPeakScenario);
  const agent = state.aiJobs.find((item) => item.id === "looping-agent");
  assert.ok(agent);
  state.phase = "running";
  state.flags.agentLoop = true;
  agent.status = "active";
  agent.currentPowerMw = 30;

  const decision = getAthenaDemoDecision(state);

  assert.equal(decision?.action, "agent_timeout");
  assert.equal(decision?.command.source, "demo");
  assert.deepEqual(decision?.target, { kind: "workload", id: "looping-agent" });
  assert.equal(decision?.urgency, "critical");
});

test("demo autopilot respects cadence while pressure is active", () => {
  const state = createInitialGameState(eveningPeakScenario);
  state.phase = "running";
  state.metrics.reserveMw = -12;

  assert.equal(getAthenaDemoDecision(state, state.minute - 4), undefined);
  assert.ok(getAthenaDemoDecision(state, state.minute - 5));
});

test("demo autopilot can batch several commands during strong pressure", () => {
  const state = createInitialGameState(eveningPeakScenario);
  state.phase = "running";
  state.metrics.stability = 30;
  state.metrics.reserveMw = -18;
  state.grid.maxUtilization = 1.12;

  const decisions = getAthenaDemoDecisions(state);

  assert.ok(decisions.length >= 2);
  assert.ok(decisions.every((decision) => decision.command.source === "demo"));
  assert.ok(new Set(decisions.map((decision) => decision.action)).size >= 2);
});

test("demo autopilot can run one setup command after the first tick", () => {
  const state = createInitialGameState(eveningPeakScenario);
  state.phase = "running";
  state.minute = state.scenario.startMinute + state.scenario.tickMinutes;

  const decision = getAthenaDemoDecision(state);

  assert.ok(decision);
  assert.equal(decision?.urgency, "setup");
});

test("demo autopilot clears the Paris sous tension campaign mission", () => {
  let state = createInitialGameState(getMissionDefinition("paris-peak").scenario);
  state.phase = "running";
  let lastCommandMinute: number | undefined;

  while (state.phase !== "ended") {
    const decisions = getAthenaDemoDecisions(state, lastCommandMinute);
    if (decisions.length > 0) lastCommandMinute = state.minute;
    for (const decision of decisions) {
      state = applyPlayerAction(state, decision.command);
    }
    state = advanceSimulation(state);
  }

  const outcome = state.outcome;
  assert.ok(outcome);
  assert.equal(outcome.result, "victory");
  assert.equal(outcome.objectiveResults.every((objective) => !objective.required || objective.passed), true);
  assert.ok(outcome.objectiveResults.find((objective) => objective.id === "paris-ai-jobs")?.passed);
  assert.ok(state.actionHistory.some((action) => action.result !== "Commande refusée"));
  assert.equal(state.actionHistory.some((action) => action.result === "Commande refusée"), false);
  assert.ok(state.actionHistory.some((action) => action.type === "migrate_ai"));
  assert.ok(state.actionHistory.some((action) => action.type === "import_energy"));
});

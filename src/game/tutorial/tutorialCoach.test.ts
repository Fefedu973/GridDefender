import assert from "node:assert/strict";
import test from "node:test";
import { getMissionDefinition } from "@/content/missions/missionRegistry";
import { applyPlayerAction, advanceSimulation, createInitialGameState } from "@/game/engine/simulation";
import { eveningPeakScenario } from "@/game/scenarios/eveningPeak";
import { getTutorialCoachStep } from "@/game/tutorial/tutorialCoach";

test("tutorial coach is only active for tutorial missions", () => {
  const standard = createInitialGameState(eveningPeakScenario);
  assert.equal(getTutorialCoachStep(standard), undefined);

  const tutorial = createInitialGameState(getMissionDefinition("tutorial-microgrid").scenario);
  assert.equal(getTutorialCoachStep(tutorial)?.id, "inspect-line");
});

test("tutorial coach advances from line inspection to battery command", () => {
  const tutorial = createInitialGameState(getMissionDefinition("tutorial-microgrid").scenario);
  const selectedLine = { kind: "line" as const, id: "normandy-paris" };
  const step = getTutorialCoachStep(tutorial, selectedLine);

  assert.equal(step?.id, "use-battery");
  assert.deepEqual(step?.target, { kind: "node", id: "centre-battery" });
  assert.equal(step?.action, "discharge_battery");
});

test("tutorial coach battery target follows the active grid runtime profile", () => {
  const tutorial = createInitialGameState(getMissionDefinition("tutorial-microgrid").scenario);
  const battery = tutorial.grid.nodes.find((node) => node.id === "centre-battery");
  assert.ok(battery);
  battery.id = "custom-tutorial-storage";

  const step = getTutorialCoachStep(tutorial, { kind: "line", id: "normandy-paris" });

  assert.equal(step?.id, "use-battery");
  assert.deepEqual(step?.target, { kind: "node", id: "custom-tutorial-storage" });
});

test("tutorial coach reaches AI scheduling after battery use and video event", () => {
  let state = createInitialGameState(getMissionDefinition("tutorial-microgrid").scenario);
  state = applyPlayerAction(state, {
    action: "discharge_battery",
    target: { kind: "node", id: "centre-battery" },
    intensityMw: 20,
  });
  state.phase = "running";
  while (state.minute < 18 * 60 + 30 && state.phase !== "ended") {
    state = advanceSimulation(state);
  }

  const step = getTutorialCoachStep(state, { kind: "line", id: "normandy-paris" });
  assert.equal(step?.id, "schedule-ai");
  assert.deepEqual(step?.target, { kind: "workload", id: "video-demo" });
});

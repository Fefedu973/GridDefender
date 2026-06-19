import assert from "node:assert/strict";
import { test } from "node:test";
import { getMissionDefinition } from "@/content/missions/missionRegistry";
import { createInitialGameState } from "@/game/engine/simulation";
import { getHudVisibilityProfile, shouldShowJobsPanel } from "@/features/hud/hudVisibility";

test("tutorial HUD keeps only command-critical metrics visible", () => {
  const scenario = getMissionDefinition("tutorial-microgrid").scenario;
  const profile = getHudVisibilityProfile(scenario);

  assert.deepEqual(profile.railMetrics, ["criticalContinuity", "batteryLevel"]);
  assert.deepEqual(profile.topBarChips, ["stability", "reserve", "capacity"]);
  assert.equal(profile.showTelemetry, false);
  assert.equal(profile.showMapLegend, false);
});

test("campaign HUD reveals AI and then full expert metrics progressively", () => {
  const paris = getHudVisibilityProfile(getMissionDefinition("paris-peak").scenario);
  const blackGrid = getHudVisibilityProfile(getMissionDefinition("black-grid").scenario);

  assert.equal(paris.railMetrics.includes("aiProductivity"), true);
  assert.equal(paris.railMetrics.includes("sovereignty"), false);
  assert.equal(blackGrid.railMetrics.includes("sovereignty"), true);
  assert.equal(blackGrid.railMetrics.includes("publicSatisfaction"), true);
  assert.equal(blackGrid.topBarChips.includes("athena"), true);
});

test("jobs panel appears for AI layer, selected datacenters and triggered AI events", () => {
  const state = createInitialGameState(getMissionDefinition("paris-peak").scenario);

  assert.equal(shouldShowJobsPanel(state, undefined, "grid"), false);
  assert.equal(shouldShowJobsPanel(state, undefined, "ai"), true);
  assert.equal(shouldShowJobsPanel(state, { kind: "node", id: "paris-saclay-ai" }, "grid"), true);
  assert.equal(shouldShowJobsPanel(state, { kind: "workload", id: "video-demo" }, "grid"), true);

  const withAiEvent = {
    ...state,
    triggeredEventIds: ["video-job"],
  };
  assert.equal(shouldShowJobsPanel(withAiEvent, undefined, "grid"), true);
});


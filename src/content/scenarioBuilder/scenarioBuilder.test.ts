import assert from "node:assert/strict";
import test from "node:test";
import {
  applyCrisisDoctrine,
  buildCrisisRun,
  crisisRunDoctrines,
  nextCrisisRunWave,
  parseCrisisRunScenarioId,
} from "@/content/modes/crisisRun";
import { getDailyChallenge } from "@/content/modes/dailyChallenge";
import { getSandboxPresets } from "@/content/modes/sandbox";
import {
  buildRandomScenario,
  buildScenarioFromTemplate,
  scenarioTemplates,
} from "@/content/scenarioBuilder/scenarioBuilder";
import { buildScenarioRecipe } from "@/content/scenarioBuilder/scenarioRecipe";
import { applyPlayerAction, advanceSimulation, createInitialGameState } from "@/game/engine/simulation";
import { estimatedMissionSeconds } from "@/game/simulation/timing";
import type { GameState, PlayerCommand } from "@/game/types";

test("scenario builder is deterministic for a given seed", () => {
  const first = buildRandomScenario("2026-06-19");
  const second = buildRandomScenario("2026-06-19");
  assert.deepEqual(first.events, second.events);
  assert.equal(first.id, second.id);
  assert.equal(first.mapId, second.mapId);
});

test("daily challenge exposes a stable date seed and generated scenario", () => {
  const date = new Date("2026-06-19T12:00:00.000Z");
  const first = getDailyChallenge(date);
  const second = getDailyChallenge(date);
  assert.equal(first.seed, "2026-06-19");
  assert.equal(first.scenario.id, second.scenario.id);
  assert.equal(first.label, second.label);
});

test("scenario builder honors custom map, difficulty, timing and incident options", () => {
  const base = scenarioTemplates[0];
  const scenario = buildScenarioFromTemplate(
    {
      ...base,
      mapId: "europe-2030",
      difficulty: "expert",
      startMinute: 18 * 60 + 30,
      durationMinutes: 210,
      weather: "storm",
      demand: "industry-peak",
      incident: "west-line-trip",
      revealPolicy: "hidden",
    },
    { seed: "custom-builder" },
  );

  assert.equal(scenario.mapId, "europe-2030");
  assert.equal(scenario.difficulty, "expert");
  assert.equal(scenario.startMinute, 18 * 60 + 30);
  assert.equal(scenario.endMinute, 22 * 60);
  assert.equal(scenario.knownEventIds.length, 0);
  assert.equal(scenario.forecastEventIds?.length, 0);
  assert.equal(scenario.events.some((event) => event.effects?.some((effect) => effect.type === "trip_line")), true);
});

test("scenario builder distinguishes forecast intel from known and hidden events", () => {
  const base = scenarioTemplates[0];
  const scenario = buildScenarioFromTemplate(
    {
      ...base,
      revealPolicy: "forecast",
    },
    { seed: "forecast-builder" },
  );
  const recipe = buildScenarioRecipe(scenario);

  assert.equal(scenario.knownEventIds.length, 0);
  assert.deepEqual(new Set(scenario.forecastEventIds), new Set(scenario.events.map((event) => event.id)));
  assert.equal(recipe.knownEventCount, 0);
  assert.equal(recipe.forecastEventCount, scenario.events.length);
  assert.equal(recipe.hiddenEventCount, 0);
  assert.ok(recipe.primaryEvents.every((event) => event.intel === "forecast"));
  assert.match(recipe.recipeText, /0 annonces, \d+ previsions, 0 masques/);
});

test("scenario recipe summarizes generated mission data for hackathon handoff", () => {
  const base = scenarioTemplates[1];
  const scenario = buildScenarioFromTemplate(
    {
      ...base,
      revealPolicy: "hidden",
      startMinute: 18 * 60,
      durationMinutes: 150,
    },
    {
      seed: "recipe-seed",
      title: "Recipe scenario",
      runMode: "scenario-builder",
    },
  );

  const recipe = buildScenarioRecipe(scenario);

  assert.equal(recipe.id, scenario.id);
  assert.equal(recipe.mode, "scenario-builder");
  assert.equal(recipe.seed, "recipe-seed");
  assert.equal(recipe.mapName, "France nationale");
  assert.equal(recipe.timeWindow, "18:00-20:30");
  assert.equal(recipe.durationMinutes, 150);
  assert.equal(recipe.eventCount, scenario.events.length);
  assert.equal(recipe.knownEventCount, 0);
  assert.equal(recipe.forecastEventCount, 0);
  assert.equal(recipe.hiddenEventCount, scenario.events.length);
  assert.equal(recipe.primaryEvents.length > 0, true);
  assert.match(recipe.recipeText, /Scenario: builder-atlantic-storm-recipe-seed/);
  assert.match(recipe.recipeText, /Evenements:/);
});

test("crisis run builds three deterministic waves and exposes doctrine choices", () => {
  const first = buildCrisisRun("demo-seed");
  const second = buildCrisisRun("demo-seed");
  assert.equal(first.length, 3);
  assert.equal(crisisRunDoctrines.length >= 3, true);
  assert.deepEqual(
    first.map((wave) => wave.scenario.events),
    second.map((wave) => wave.scenario.events),
  );
  assert.ok(first[2].scenario.commandCapacity <= first[0].scenario.commandCapacity);
  assert.deepEqual(parseCrisisRunScenarioId(first[0].scenario.id), { seed: "demo-seed", waveIndex: 1 });
  const estimatedRunSeconds = first.reduce((total, wave) => total + estimatedMissionSeconds(wave.scenario), 0);
  assert.ok(estimatedRunSeconds >= 8 * 60, `Crisis Run too short: ${estimatedRunSeconds}s`);
  assert.ok(estimatedRunSeconds <= 12 * 60, `Crisis Run too long: ${estimatedRunSeconds}s`);

  const doctrine = crisisRunDoctrines[0];
  const nextWave = nextCrisisRunWave(first[0].scenario.id, doctrine);
  assert.ok(nextWave);
  assert.equal(nextWave.id, first[1].scenario.id);
  assert.equal(
    nextWave.commandCapacity,
    applyCrisisDoctrine(first[1].scenario, doctrine).commandCapacity,
  );
});

test("sandbox exposes playable generated presets", () => {
  const presets = getSandboxPresets();
  assert.equal(presets.length >= 3, true);
  for (const preset of presets) {
    assert.ok(preset.scenario.id.includes(preset.seed));
    assert.ok(preset.scenario.events.length > 0);
    assert.ok(preset.scenario.commandCapacity > 0);
    assert.ok(preset.scenario.objectiveChecks.length > 0);
  }
});

test("declarative scenario event effects can trip a line", () => {
  const template = scenarioTemplates.find((item) => item.incident === "west-line-trip");
  assert.ok(template);

  const scenario = buildScenarioFromTemplate(template, { seed: "storm-test" });
  const event = scenario.events.find((item) => item.effects?.some((effect) => effect.type === "trip_line"));
  assert.ok(event);
  assert.equal(event.source, "grid");

  let state = createInitialGameState(scenario);
  state.phase = "running";
  while (state.minute < event.minute && state.phase !== "ended") {
    state = advanceSimulation(state);
  }

  assert.equal(state.triggeredEventIds.includes(event.id), true);
  assert.equal(state.incidents.some((incident) => incident.id === event.id), true);
  assert.equal(state.grid.lines.some((line) => line.tripped && line.tripCount > 0), true);
});

test("generated scenario events expose declarative source and resolution rules", () => {
  const cyberTemplate = scenarioTemplates.find((item) => item.incident === "hidden-cyber");
  assert.ok(cyberTemplate);

  const scenario = buildScenarioFromTemplate(cyberTemplate, {
    seed: "cyber-test",
  });
  const weather = scenario.events.find((event) => event.id.endsWith("-weather"));
  const cyber = scenario.events.find((event) => event.id.endsWith("-cyber"));

  assert.equal(weather?.source, "weather");
  assert.ok(weather?.resolvesWhen?.some((rule) => rule.type === "stability_above"));
  assert.equal(cyber?.source, "ai");
  assert.ok(cyber?.resolvesWhen?.some((rule) => rule.type === "job_status" && rule.jobId === "cyber-critical"));
});

function stabilizingCommands(state: GameState): PlayerCommand[] {
  const commands: PlayerCommand[] = [];
  if (state.metrics.reserveMw < -12 && !state.activeEffects.some((effect) => effect.action === "import_energy")) {
    commands.push({ action: "import_energy", intensityMw: 35 });
  }
  if (
    state.metrics.stability < 55 &&
    state.metrics.batteryLevel > 20 &&
    !state.activeEffects.some((effect) => effect.action === "discharge_battery")
  ) {
    commands.push({ action: "discharge_battery", intensityMw: 32 });
  }
  if (state.flags.evSurge && !state.activeEffects.some((effect) => effect.action === "smart_ev")) {
    commands.push({ action: "smart_ev", intensityMw: 24 });
  }
  if (state.flags.agentLoop) commands.push({ action: "agent_timeout" });
  return commands.slice(0, 2);
}

test("seeded scenario generator remains finite across many challenge runs", () => {
  for (let index = 0; index < 120; index += 1) {
    const scenario = buildRandomScenario(`stress-${index}`);
    let state = createInitialGameState(scenario);
    state.phase = "running";

    while (state.phase !== "ended") {
      for (const command of stabilizingCommands(state)) {
        state = applyPlayerAction(state, command);
      }
      state = advanceSimulation(state);
    }

    assert.equal(Number.isFinite(state.metrics.score), true, scenario.id);
    assert.equal(Number.isFinite(state.metrics.stability), true, scenario.id);
    assert.equal(Number.isFinite(state.cumulative.unservedEnergyMwh), true, scenario.id);
    assert.ok(state.metrics.score >= 0 && state.metrics.score <= 1000, scenario.id);
    assert.ok(state.metrics.stability >= 0 && state.metrics.stability <= 100, scenario.id);
    assert.ok(state.cumulative.unservedEnergyMwh >= 0, scenario.id);
  }
});

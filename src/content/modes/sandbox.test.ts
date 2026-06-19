import assert from "node:assert/strict";
import test from "node:test";
import { buildSandboxScenario, defaultSandboxOptions, getSandboxPresets } from "@/content/modes/sandbox";

test("sandbox exposes playable generated presets", () => {
  const presets = getSandboxPresets();
  assert.equal(presets.length >= 3, true);
  assert.equal(presets.every((preset) => preset.scenario.mapId && preset.scenario.events.length > 0), true);
});

test("custom sandbox options control map, difficulty, timing, weather, demand and incident", () => {
  const scenario = buildSandboxScenario({
    ...defaultSandboxOptions,
    mapId: "rhone-corridor",
    difficulty: "expert",
    weather: "storm",
    demand: "industry-peak",
    incident: "rhone-congestion",
    startMinute: 17 * 60 + 45,
    durationMinutes: 120,
    seed: "sandbox-rhone-test",
  });

  assert.equal(scenario.mapId, "rhone-corridor");
  assert.equal(scenario.difficulty, "expert");
  assert.equal(scenario.startMinute, 17 * 60 + 45);
  assert.equal(scenario.endMinute, 19 * 60 + 45);
  assert.equal(scenario.id.includes("sandbox-rhone-test"), true);
  assert.equal(scenario.events.some((event) => event.id.includes("rhone")), true);
  assert.equal(
    scenario.events.some((event) =>
      event.effects?.some((effect) => effect.type === "set_flag" && effect.flag === "residentialPeak"),
    ),
    true,
  );
});

test("custom sandbox generation is deterministic for a seed", () => {
  const first = buildSandboxScenario({ ...defaultSandboxOptions, seed: "same-sandbox-seed" });
  const second = buildSandboxScenario({ ...defaultSandboxOptions, seed: "same-sandbox-seed" });

  assert.deepEqual(first.events, second.events);
  assert.equal(first.id, second.id);
});

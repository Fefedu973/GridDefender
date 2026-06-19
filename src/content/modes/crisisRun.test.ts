import assert from "node:assert/strict";
import test from "node:test";
import { buildScenarioFromTemplate, scenarioTemplates } from "@/content/scenarioBuilder/scenarioBuilder";
import {
  applyCrisisDoctrine,
  buildCrisisRun,
  crisisRunDoctrines,
  nextCrisisRunWave,
  parseCrisisRunScenarioId,
} from "@/content/modes/crisisRun";
import { getCommandCost } from "@/game/commands/commandCosts";

function doctrine(id: string) {
  const found = crisisRunDoctrines.find((item) => item.id === id);
  assert.ok(found, id);
  return found;
}

test("crisis run builds three waves and exposes a broad doctrine choice set", () => {
  const waves = buildCrisisRun("crisis-seed");

  assert.equal(waves.length, 3);
  assert.deepEqual(waves.map((wave) => wave.index), [1, 2, 3]);
  assert.ok(crisisRunDoctrines.length >= 6);
  assert.deepEqual(parseCrisisRunScenarioId(waves[0].scenario.id), {
    seed: "crisis-seed",
    waveIndex: 1,
  });
});

test("crisis doctrines can alter command costs for the next wave", () => {
  const scenario = buildCrisisRun("cost-seed")[0].scenario;
  const cached = applyCrisisDoctrine(scenario, doctrine("distributed-cache"));
  const hardened = applyCrisisDoctrine(scenario, doctrine("line-hardening"));

  assert.equal(cached.commandCapacity, scenario.commandCapacity + 6);
  assert.equal(getCommandCost("activate_cache", cached), getCommandCost("activate_cache", scenario) - 4);
  assert.equal(getCommandCost("agent_timeout", cached), getCommandCost("agent_timeout", scenario) - 2);
  assert.equal(getCommandCost("repair_line", hardened), getCommandCost("repair_line", scenario) - 5);
  assert.equal(getCommandCost("authorize_overload", hardened), getCommandCost("authorize_overload", scenario) - 4);
});

test("forecast and hardening doctrines reveal or delay scenario events by source", () => {
  const stormScenario = buildScenarioFromTemplate(
    {
      ...scenarioTemplates[1],
      revealPolicy: "hidden",
    },
    { seed: "doctrine-storm", title: "Doctrine storm" },
  );
  const weatherEvent = stormScenario.events.find((event) => event.source === "weather");
  const gridEvent = stormScenario.events.find((event) => event.source === "grid");
  assert.ok(weatherEvent);
  assert.ok(gridEvent);
  assert.equal(stormScenario.knownEventIds.includes(weatherEvent.id), false);

  const forecasted = applyCrisisDoctrine(stormScenario, doctrine("weather-forecast"));
  const hardened = applyCrisisDoctrine(stormScenario, doctrine("line-hardening"));
  const forecastedWeather = forecasted.events.find((event) => event.id === weatherEvent.id);
  const hardenedGrid = hardened.events.find((event) => event.id === gridEvent.id);

  assert.ok(forecasted.knownEventIds.includes(weatherEvent.id));
  assert.equal(forecastedWeather?.minute, weatherEvent.minute + 5);
  assert.equal(hardenedGrid?.minute, gridEvent.minute + 8);
});

test("crisis run continues only while waves remain", () => {
  const wave2 = nextCrisisRunWave("crisis-run-flow-seed-wave-1", doctrine("battery-reserve"));
  const afterFinal = nextCrisisRunWave("crisis-run-flow-seed-wave-3", doctrine("battery-reserve"));

  assert.equal(wave2?.id, "crisis-run-flow-seed-wave-2");
  assert.ok((wave2?.initialMetrics.batteryLevel ?? 0) > buildCrisisRun("flow-seed")[1].scenario.initialMetrics.batteryLevel);
  assert.equal(afterFinal, undefined);
});

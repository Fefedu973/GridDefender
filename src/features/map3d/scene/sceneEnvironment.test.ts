import assert from "node:assert/strict";
import test from "node:test";
import { getSceneEnvironment } from "@/features/map3d/scene/sceneEnvironment";

const base = {
  minute: 18 * 60,
  startMinute: 17 * 60 + 30,
  endMinute: 20 * 60 + 30,
};

test("expo maps keep a bright demo-floor environment", () => {
  const env = getSceneEnvironment({
    ...base,
    solarDrop: false,
    map: { cameraPreset: "close", environment: "expo-floor" },
  });

  assert.equal(env.phase, "expo");
  assert.equal(env.rain, false);
  assert.ok(env.ambientIntensity > 0.55);
});

test("storm maps enable tighter fog and rain", () => {
  const env = getSceneEnvironment({
    ...base,
    solarDrop: false,
    map: { cameraPreset: "national", environment: "storm" },
  });

  assert.equal(env.phase, "storm");
  assert.equal(env.rain, true);
  assert.ok(env.fogFar < 23);
});

test("national maps shift from dusk to night as the mission advances", () => {
  const dusk = getSceneEnvironment({
    minute: 19 * 60 + 45,
    startMinute: 17 * 60 + 30,
    endMinute: 20 * 60 + 30,
    solarDrop: false,
    map: { cameraPreset: "national", environment: "command-night" },
  });
  const night = getSceneEnvironment({
    minute: 20 * 60 + 20,
    startMinute: 17 * 60 + 30,
    endMinute: 20 * 60 + 30,
    solarDrop: false,
    map: { cameraPreset: "national", environment: "command-night" },
  });

  assert.equal(dusk.phase, "dusk");
  assert.equal(night.phase, "night");
  assert.notEqual(dusk.keyLight, night.keyLight);
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  coerceViewLayer,
  defaultGamePreferences,
  getAvailableViewLayers,
  loadGamePreferences,
  normalizeGamePreferences,
  persistGamePreferences,
  preferencesKey,
} from "@/store/gamePreferences";

function memoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set(preferencesKey, initial);

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    value: (key = preferencesKey) => values.get(key),
  };
}

test("game preferences normalize unknown or partial values to demo-safe defaults", () => {
  assert.deepEqual(normalizeGamePreferences(undefined), defaultGamePreferences);
  assert.deepEqual(
    normalizeGamePreferences({
      audioEnabled: "yes",
      renderQuality: "ultra",
      speed: 8,
      viewLayer: "pricing",
    }),
    defaultGamePreferences,
  );
  assert.deepEqual(normalizeGamePreferences({ renderQuality: "safe" }), {
    ...defaultGamePreferences,
    renderQuality: "safe",
  });
});

test("game preferences load persisted safe demo settings", () => {
  const storage = memoryStorage(
    JSON.stringify({
      audioEnabled: true,
      renderQuality: "safe",
      speed: 0.25,
      viewLayer: "ai",
    }),
  );

  assert.deepEqual(loadGamePreferences(storage), {
    audioEnabled: true,
    renderQuality: "safe",
    speed: 0.25,
    viewLayer: "ai",
  });
});

test("game preferences survive malformed storage and persist normalized values", () => {
  assert.deepEqual(loadGamePreferences(memoryStorage("{nope")), defaultGamePreferences);

  const storage = memoryStorage();
  persistGamePreferences(
    {
      audioEnabled: true,
      renderQuality: "safe",
      speed: 0.5,
      viewLayer: "carbon",
    },
    storage,
  );

  assert.deepEqual(JSON.parse(storage.value() ?? "{}"), {
    audioEnabled: true,
    renderQuality: "safe",
    speed: 0.5,
    viewLayer: "carbon",
  });
});

test("view layer helpers respect map-specific layer availability", () => {
  assert.deepEqual(getAvailableViewLayers({ availableLayers: ["grid", "ai"] }), ["grid", "ai"]);
  assert.equal(coerceViewLayer("carbon", { availableLayers: ["grid", "ai"] }), "grid");
  assert.equal(coerceViewLayer("ai", { availableLayers: ["grid", "ai"] }), "ai");
  assert.deepEqual(getAvailableViewLayers({ availableLayers: [] }), ["grid"]);
});

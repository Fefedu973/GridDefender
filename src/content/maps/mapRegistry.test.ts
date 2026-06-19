import assert from "node:assert/strict";
import test from "node:test";
import { missionRegistry } from "@/content/missions/missionRegistry";
import { getMapDefinition, mapRegistry } from "@/content/maps/mapRegistry";
import { createInitialGrid } from "@/game/network/franceGridData";

test("every mission references a registered map definition", () => {
  const mapIds = new Set(mapRegistry.map((map) => map.id));

  for (const mission of missionRegistry) {
    assert.equal(mapIds.has(mission.mapId), true, `${mission.id} mission map is registered`);
    assert.equal(mission.scenario.mapId, mission.mapId, `${mission.id} scenario map follows mission map`);
  }
});

test("map definitions own the active node and line topology", () => {
  for (const map of mapRegistry.filter((item) => item.nodeIds || item.lineIds)) {
    const grid = createInitialGrid(map.id);
    assert.deepEqual(
      grid.nodes.map((node) => node.id).sort(),
      [...(map.nodeIds ?? [])].sort(),
      `${map.id} nodes come from MapDefinition`,
    );
    assert.deepEqual(
      grid.lines.map((line) => line.id).sort(),
      [...(map.lineIds ?? [])].sort(),
      `${map.id} lines come from MapDefinition`,
    );
  }
});

test("unknown map ids fall back to the national map definition", () => {
  assert.equal(getMapDefinition("unknown-map").id, "france-national");
});

test("the europe finale uses its dedicated continent terrain and wide camera", () => {
  const europe = getMapDefinition("europe-2030");
  assert.equal(europe.terrain, "europe");
  assert.equal(europe.cameraPreset, "europe");
});

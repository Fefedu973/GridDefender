import assert from "node:assert/strict";
import test from "node:test";
import { createInitialGrid } from "@/game/network/franceGridData";
import type { GridRuntime } from "@/game/network/networkTypes";

function reachableNodeCount(grid: GridRuntime) {
  const adjacency = new Map(grid.nodes.map((node) => [node.id, [] as string[]]));
  for (const line of grid.lines) {
    adjacency.get(line.fromNodeId)?.push(line.toNodeId);
    adjacency.get(line.toNodeId)?.push(line.fromNodeId);
  }
  const first = grid.nodes[0]?.id;
  if (!first) return 0;
  const seen = new Set([first]);
  const stack = [first];
  while (stack.length > 0) {
    const id = stack.pop()!;
    for (const next of adjacency.get(id) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      stack.push(next);
    }
  }
  return seen.size;
}

test("line visual bends are carried by grid data", () => {
  const grid = createInitialGrid("france-national");
  const parisLyon = grid.lines.find((line) => line.id === "paris-lyon");
  const hospital = grid.lines.find((line) => line.id === "paris-hospital");

  assert.equal(parisLyon?.visualBend, 0.2);
  assert.equal(hospital?.visualBend, -0.05);
});

test("map ids create genuinely distinct active grid graphs", () => {
  const france = createInitialGrid("france-national");
  const microgrid = createInitialGrid("vivatech-campus");
  const corsica = createInitialGrid("corsica-island");
  const europe = createInitialGrid("europe-2030");
  const rhone = createInitialGrid("rhone-corridor");

  assert.ok(microgrid.nodes.length < france.nodes.length);
  assert.ok(corsica.nodes.length < france.nodes.length);
  assert.ok(rhone.nodes.length < france.nodes.length);
  assert.notEqual(microgrid.lines.length, corsica.lines.length);
  assert.equal(europe.nodes.length, france.nodes.length);
  assert.equal(microgrid.nodes.length, 6);
  assert.equal(rhone.nodes.some((node) => node.id === "lyon-industry"), true);
  assert.equal(rhone.nodes.some((node) => node.id === "normandy-production"), false);
  assert.equal(france.nodes.some((node) => node.id === "marseille-load"), true);
  assert.equal(microgrid.nodes.some((node) => node.id === "marseille-load"), false);
  assert.equal(microgrid.nodes.some((node) => node.id === "grenoble-ai-edge"), false);
  assert.equal(microgrid.nodes.some((node) => node.id === "rhone-production"), false);
  assert.equal(corsica.nodes.some((node) => node.id === "normandy-production"), false);
});

test("map-specific active graphs have no dangling references and stay connected", () => {
  for (const mapId of ["france-national", "vivatech-campus", "corsica-island", "rhone-corridor", "europe-2030"]) {
    const grid = createInitialGrid(mapId);
    const nodeIds = new Set(grid.nodes.map((node) => node.id));
    const lineIds = new Set(grid.lines.map((line) => line.id));

    for (const line of grid.lines) {
      assert.equal(nodeIds.has(line.fromNodeId), true, `${mapId}:${line.id}:from`);
      assert.equal(nodeIds.has(line.toNodeId), true, `${mapId}:${line.id}:to`);
    }
    for (const node of grid.nodes) {
      assert.equal(
        node.connectedLineIds.every((lineId) => lineIds.has(lineId)),
        true,
        `${mapId}:${node.id}:connectedLineIds`,
      );
    }
    assert.equal(reachableNodeCount(grid), grid.nodes.length, mapId);
  }
});

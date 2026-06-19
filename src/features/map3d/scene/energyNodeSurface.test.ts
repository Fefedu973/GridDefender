import assert from "node:assert/strict";
import test from "node:test";
import { createInitialGrid } from "@/game/network/franceGridData";
import { collectEnergyNodeSurfacePlacements } from "@/features/map3d/scene/energyNodeSurface";

test("energy node surfaces are collected for instanced rendering", () => {
  const snapshot = createInitialGrid("france-national");
  const placements = collectEnergyNodeSurfacePlacements(snapshot, "paris-saclay-ai", "grid");

  assert.equal(placements.pads.length, snapshot.nodes.length);
  assert.equal(placements.statusRings.length, snapshot.nodes.length);
  assert.equal(placements.outageRings.length, 0);
  assert.ok(placements.statusRings.some((placement) => placement.id === "paris-saclay-ai-status"));
  assert.ok(placements.statusRings.every((placement) => placement.radius > 0.2));
});

test("energy node surface collection separates blackout and emergency rings", () => {
  const snapshot = createInitialGrid("france-national");
  const hospital = snapshot.nodes.find((node) => node.id === "idf-hospital");
  assert.ok(hospital);

  hospital.servedDemandMw = 0;
  hospital.demandMw = Math.max(10, hospital.maxDemandMw);
  hospital.status = "critical";

  const placements = collectEnergyNodeSurfacePlacements(snapshot, undefined, "grid");

  assert.equal(placements.outageRings.some((placement) => placement.id === "idf-hospital-outage"), true);
  assert.equal(placements.blackoutDisks.some((placement) => placement.id === "idf-hospital-blackout"), true);
  assert.equal(placements.emergencyRings.some((placement) => placement.id === "idf-hospital-emergency"), true);
});

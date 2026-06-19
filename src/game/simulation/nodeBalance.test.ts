import assert from "node:assert/strict";
import test from "node:test";
import { createInitialGameState } from "@/game/engine/simulation";
import { eveningPeakScenario } from "@/game/scenarios/eveningPeak";
import { computeNodeLoads } from "@/game/simulation/nodeBalance";
import type { GridNode } from "@/game/network/networkTypes";

test("node load profiles are data-driven for arbitrary node ids", () => {
  const state = createInitialGameState(eveningPeakScenario);
  const template = state.grid.nodes.find((node) => node.id === "southwest-solar")!;
  const node: GridNode = {
    ...template,
    id: "custom-solar-lab",
    productionMw: 0,
    demandMw: 0,
    runtime: {
      production: { solarCapacityMw: 40, solarDropFactor: 0.5 },
      demand: {
        baseMw: 10,
        flagAdditions: [{ flag: "evSurge", mw: 5 }],
      },
    },
  };

  computeNodeLoads(state, [node]);
  assert.equal(node.productionMw > 30, true);
  assert.equal(node.demandMw, 10);

  state.flags.solarDrop = true;
  state.flags.evSurge = true;
  computeNodeLoads(state, [node]);
  assert.equal(node.productionMw > 15 && node.productionMw < 25, true);
  assert.equal(node.demandMw, 15);
});

test("production command effects apply only on the targeted runtime node", () => {
  const state = createInitialGameState(eveningPeakScenario);
  const template = state.grid.nodes.find((node) => node.id === "centre-battery")!;
  const storageA: GridNode = {
    ...template,
    id: "storage-a",
    productionMw: 0,
    demandMw: 0,
    runtime: { production: { baseMw: 0, effectAction: "discharge_battery" } },
  };
  const storageB: GridNode = {
    ...template,
    id: "storage-b",
    productionMw: 0,
    demandMw: 0,
    runtime: { production: { baseMw: 0, effectAction: "discharge_battery" } },
  };

  state.activeEffects = [
    {
      id: "effect-test",
      label: "Battery",
      action: "discharge_battery",
      target: { kind: "node", id: "storage-a" },
      startedAt: state.minute,
      expiresAt: state.minute + 20,
      magnitude: 25,
    },
  ];

  computeNodeLoads(state, [storageA, storageB]);

  assert.equal(storageA.productionMw, 25);
  assert.equal(storageB.productionMw, 0);
});

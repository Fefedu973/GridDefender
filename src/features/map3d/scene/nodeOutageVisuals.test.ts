import assert from "node:assert/strict";
import test from "node:test";
import { getNodeOutageVisual } from "@/features/map3d/scene/nodeOutageVisuals";

function node(overrides = {}) {
  return {
    criticality: "medium" as const,
    demandMw: 40,
    kind: "city" as const,
    servedDemandMw: 40,
    status: "stable" as const,
    ...overrides,
  };
}

test("outage visuals stay normal when demand is fully served", () => {
  const visual = getNodeOutageVisual(node());

  assert.equal(visual.level, "normal");
  assert.equal(visual.unservedMw, 0);
  assert.equal(visual.unservedRatio, 0);
  assert.equal(visual.emergencyOpacity, 0);
  assert.equal(visual.windowPower, 1);
});

test("outage visuals separate partial load shedding from blackout", () => {
  const partial = getNodeOutageVisual(node({ servedDemandMw: 24 }));
  const blackout = getNodeOutageVisual(node({ servedDemandMw: 4 }));

  assert.equal(partial.level, "partial");
  assert.equal(blackout.level, "blackout");
  assert.ok(partial.windowPower > blackout.windowPower);
  assert.ok(blackout.emergencyOpacity > partial.emergencyOpacity);
});

test("critical consumers preserve more emergency visibility under stress", () => {
  const city = getNodeOutageVisual(node({ servedDemandMw: 28 }));
  const hospital = getNodeOutageVisual(node({
    criticality: "critical" as const,
    kind: "hospital" as const,
    servedDemandMw: 28,
  }));

  assert.equal(city.level, "partial");
  assert.equal(hospital.level, "partial");
  assert.ok(hospital.windowPower > city.windowPower);
  assert.ok(hospital.emergencyOpacity > city.emergencyOpacity);
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  datacenterModelProfile,
  evChargeFillLevel,
  factoryVisualProfile,
  nodeActivityRatio,
  nodeRenderScale,
  productionSteamVisualProfile,
  solarPanelEmissiveScale,
} from "@/features/map3d/scene/nodeModelVisuals";

test("node model activity follows served production or demand ratios", () => {
  assert.equal(
    nodeActivityRatio({
      productionMw: 0,
      demandMw: 80,
      servedProductionMw: 0,
      servedDemandMw: 60,
      maxProductionMw: 0,
      maxDemandMw: 120,
    }),
    2 / 3,
  );

  assert.equal(
    nodeActivityRatio({
      productionMw: 30,
      demandMw: 0,
      servedProductionMw: 45,
      servedDemandMw: 0,
      maxProductionMw: 90,
      maxDemandMw: 0,
    }),
    0.5,
  );
});

test("datacenter model compactness is capacity-driven, not id-driven", () => {
  assert.deepEqual(datacenterModelProfile({ maxDemandMw: 58 }), { compact: true, scale: 0.86 });
  assert.deepEqual(datacenterModelProfile({ maxDemandMw: 95 }), { compact: false, scale: 0.9 });
});

test("solar and EV visual intensity scale with real node activity", () => {
  assert.ok(solarPanelEmissiveScale(0.1) < solarPanelEmissiveScale(0.8));
  assert.ok(evChargeFillLevel(0.15) < evChargeFillLevel(0.9));
  assert.equal(evChargeFillLevel(2), 0.98);
});

test("production and industry ambient effects scale with real activity", () => {
  const idleSteam = productionSteamVisualProfile(0);
  const activeSteam = productionSteamVisualProfile(0.85);
  assert.ok(activeSteam.opacity > idleSteam.opacity);
  assert.ok(activeSteam.speed > idleSteam.speed);
  assert.ok(activeSteam.pulseMax > idleSteam.pulseMax);

  const idleFactory = factoryVisualProfile(0);
  const activeFactory = factoryVisualProfile(0.9);
  assert.ok(activeFactory.furnaceMax > idleFactory.furnaceMax);
  assert.ok(activeFactory.smokeOpacity > idleFactory.smokeOpacity);
  assert.ok(activeFactory.smokeSpeed > idleFactory.smokeSpeed);
});

test("node render scale combines map scale, selection and activity safely", () => {
  const defaultScale = nodeRenderScale({ activity: 0.5, selected: false });
  const closeMapScale = nodeRenderScale({ activity: 0.5, mapModelScale: 1.25, selected: false });
  const selectedScale = nodeRenderScale({ activity: 0.5, mapModelScale: 1.25, selected: true });

  assert.ok(closeMapScale > defaultScale);
  assert.ok(selectedScale > closeMapScale);
  assert.equal(nodeRenderScale({ activity: 0, mapModelScale: Number.NaN, selected: false }), 0.96);
  assert.equal(nodeRenderScale({ activity: 2, mapModelScale: 3, selected: false }), 1.612);
});

import assert from "node:assert/strict";
import test from "node:test";
import { getSceneRenderQualityProfile, scaleEffectCount } from "@/features/map3d/scene/renderQualityProfile";

test("safe render quality disables expensive scene effects for demo stability", () => {
  const safe = getSceneRenderQualityProfile("safe");
  const standard = getSceneRenderQualityProfile("standard");
  const high = getSceneRenderQualityProfile("high");

  assert.equal(safe.antialias, false);
  assert.equal(safe.postprocessing, false);
  assert.equal(safe.weatherEffects, false);
  assert.equal(safe.extraLights, false);
  assert.ok(safe.flowParticleScale < standard.flowParticleScale);
  assert.ok(safe.pylonDensity < standard.pylonDensity);
  assert.equal(safe.pylonInsulators, false);
  assert.equal(high.shadowMode, "percentage");
  assert.ok(high.dpr[1] > standard.dpr[1]);
});

test("effect count scaling preserves at least one gameplay cue when active", () => {
  assert.equal(scaleEffectCount(0, 1), 0);
  assert.equal(scaleEffectCount(3, 0), 0);
  assert.equal(scaleEffectCount(2, 0.45), 1);
  assert.equal(scaleEffectCount(6, 1.1), 7);
});

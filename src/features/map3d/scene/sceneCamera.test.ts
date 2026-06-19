import assert from "node:assert/strict";
import test from "node:test";
import { FRANCE_BOUNDS } from "@/features/map3d/geo/franceGeo";
import { getSceneCameraConfig } from "@/features/map3d/scene/sceneCamera";

const westernNodes = [
  { position: [-2.5, 0, 0.8] as [number, number, number] },
  { position: [-1.1, 0, -0.6] as [number, number, number] },
];

const easternNodes = [
  { position: [2.4, 0, 0.4] as [number, number, number] },
  { position: [3.2, 0, -1.1] as [number, number, number] },
];

test("national camera keeps a full-France framing regardless of active nodes", () => {
  const config = getSceneCameraConfig({ cameraPreset: "national" }, westernNodes);

  assert.deepEqual(config.target, [FRANCE_BOUNDS.centerX, 0, FRANCE_BOUNDS.centerZ]);
  assert.equal(config.fov, 42);
  assert.equal(config.maxDistance, 13);
});

test("regional camera frames the active node bounds instead of the whole country", () => {
  const west = getSceneCameraConfig({ cameraPreset: "regional" }, westernNodes);
  const east = getSceneCameraConfig({ cameraPreset: "regional" }, easternNodes);

  assert.ok(west.target[0] < 0);
  assert.ok(east.target[0] > 0);
  assert.notEqual(west.target[0], east.target[0]);
  assert.ok(west.position[1] < 7.1);
  assert.ok(west.maxDistance < 13);
});

test("close camera uses the tightest orbit constraints for demo maps", () => {
  const close = getSceneCameraConfig({ cameraPreset: "close" }, westernNodes);
  const regional = getSceneCameraConfig({ cameraPreset: "regional" }, westernNodes);

  assert.ok(close.position[1] < regional.position[1]);
  assert.ok(close.maxDistance < regional.maxDistance);
  assert.ok(close.autoRotateSpeed < regional.autoRotateSpeed);
});

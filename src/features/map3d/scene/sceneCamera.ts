import type { MapDefinition } from "@/game/domain/mapDefinition";
import type { GridNode } from "@/game/network/networkTypes";
import { FRANCE_BOUNDS } from "@/features/map3d/geo/franceGeo";

export interface SceneCameraConfig {
  autoRotateSpeed: number;
  fov: number;
  maxDistance: number;
  maxPolarAngle: number;
  minDistance: number;
  minPolarAngle: number;
  position: [number, number, number];
  target: [number, number, number];
}

function activeBoundsCenter(nodes: Array<Pick<GridNode, "position">>) {
  if (nodes.length === 0) return { span: 7.6, x: FRANCE_BOUNDS.centerX, z: FRANCE_BOUNDS.centerZ };

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (const node of nodes) {
    minX = Math.min(minX, node.position[0]);
    maxX = Math.max(maxX, node.position[0]);
    minZ = Math.min(minZ, node.position[2]);
    maxZ = Math.max(maxZ, node.position[2]);
  }

  return {
    span: Math.max(1, maxX - minX, maxZ - minZ),
    x: (minX + maxX) / 2,
    z: (minZ + maxZ) / 2,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function getSceneCameraConfig(
  map: Pick<MapDefinition, "cameraPreset"> | undefined,
  nodes: Array<Pick<GridNode, "position">>,
): SceneCameraConfig {
  const preset = map?.cameraPreset ?? "national";
  const center = activeBoundsCenter(nodes);
  const target: [number, number, number] = [center.x, 0, center.z];

  if (preset === "close") {
    const height = clamp(3.7 + center.span * 0.28, 4.2, 5.2);
    const distance = clamp(3.9 + center.span * 0.32, 4.4, 6);
    return {
      autoRotateSpeed: 0.08,
      fov: 45,
      maxDistance: 7.2,
      maxPolarAngle: 1.05,
      minDistance: 2.8,
      minPolarAngle: 0.38,
      position: [center.x + 0.18, height, center.z + distance],
      target,
    };
  }

  if (preset === "europe") {
    // Pull back high and wide so the French hero sits inside the ghosted
    // continent and the cross-border interconnectors stay in frame.
    return {
      autoRotateSpeed: 0.14,
      fov: 46,
      maxDistance: 24,
      maxPolarAngle: 1.16,
      minDistance: 7,
      minPolarAngle: 0.32,
      position: [FRANCE_BOUNDS.centerX + 0.4, 10.6, FRANCE_BOUNDS.centerZ + 12.8],
      target: [FRANCE_BOUNDS.centerX + 0.3, 0, FRANCE_BOUNDS.centerZ - 0.6],
    };
  }

  if (preset === "regional") {
    const height = clamp(4.6 + center.span * 0.35, 5.2, 6.5);
    const distance = clamp(5.1 + center.span * 0.38, 5.8, 8.4);
    return {
      autoRotateSpeed: 0.13,
      fov: 43,
      maxDistance: 10.5,
      maxPolarAngle: 1.12,
      minDistance: 4,
      minPolarAngle: 0.35,
      position: [center.x + 0.28, height, center.z + distance],
      target,
    };
  }

  return {
    autoRotateSpeed: 0.18,
    fov: 42,
    maxDistance: 13,
    maxPolarAngle: 1.15,
    minDistance: 5,
    minPolarAngle: 0.35,
    position: [FRANCE_BOUNDS.centerX + 0.3, 7.1, FRANCE_BOUNDS.centerZ + 8.1],
    target: [FRANCE_BOUNDS.centerX, 0, FRANCE_BOUNDS.centerZ],
  };
}

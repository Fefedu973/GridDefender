import * as THREE from "three";

export const TRANSMISSION_LINE_Y = 0.34;
export const TRANSMISSION_NODE_INSET = 0.3;
export const TRANSMISSION_WIRE_OFFSETS = [-0.044, 0, 0.044] as const;

export interface TransmissionRouteInput {
  fromPosition: [number, number, number];
  toPosition: [number, number, number];
  visualBend?: number;
}

export interface TransmissionRoutePylon {
  angle: number;
  position: [number, number, number];
}

export interface TransmissionRouteGeometry {
  curve: THREE.CatmullRomCurve3;
  distance: number;
  points: THREE.Vector3[];
  pylons: TransmissionRoutePylon[];
  wirePoints: Array<{
    offset: number;
    points: THREE.Vector3[];
  }>;
}

function offsetPoints(points: THREE.Vector3[], normal: THREE.Vector3, offset: number) {
  return points.map((point) => point.clone().addScaledVector(normal, offset));
}

export function buildTransmissionRoute({
  fromPosition,
  toPosition,
  visualBend,
}: TransmissionRouteInput): TransmissionRouteGeometry {
  const from = new THREE.Vector3(fromPosition[0], TRANSMISSION_LINE_Y, fromPosition[2]);
  const to = new THREE.Vector3(toPosition[0], TRANSMISSION_LINE_Y, toPosition[2]);
  const direction = to.clone().sub(from);
  direction.y = 0;

  const distance = direction.length();
  if (distance > 0.001) direction.normalize();

  const normal = new THREE.Vector3(-direction.z, 0, direction.x);
  const inset = Math.min(TRANSMISSION_NODE_INSET, Math.max(0.12, distance * 0.12));
  const start = from.clone().addScaledVector(direction, inset);
  const end = to.clone().addScaledVector(direction, -inset);
  const bend = (visualBend ?? 0) * Math.min(1, distance / 1.8);
  const mid = start.clone().add(end).multiplyScalar(0.5).addScaledVector(normal, bend);
  const curve = new THREE.CatmullRomCurve3([start, mid, end], false, "catmullrom", 0.08);
  const points = curve.getPoints(34);
  const pylonCount = distance < 0.95 ? 0 : Math.min(3, Math.max(1, Math.floor(distance / 1.35)));
  const pylons = Array.from({ length: pylonCount }, (_, index) => {
    const t = (index + 1) / (pylonCount + 1);
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    return {
      angle: Math.atan2(tangent.x, tangent.z),
      position: [point.x, 0.095, point.z] as [number, number, number],
    };
  });

  const wirePoints = TRANSMISSION_WIRE_OFFSETS.map((offset) => ({
    offset,
    points: offsetPoints(points, normal, offset),
  }));

  return { curve, distance, points, pylons, wirePoints };
}

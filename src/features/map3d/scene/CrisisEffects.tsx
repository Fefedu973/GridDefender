"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { FranceGridSnapshot } from "@/game/network/networkTypes";
import { getNodeOutageVisual } from "@/features/map3d/scene/nodeOutageVisuals";

interface CrisisEffectsProps {
  snapshot: FranceGridSnapshot;
  ringSegments?: number;
}

const ALERT_RING_Y = 0.13;
const ALERT_RING_INNER_RADIUS = 0.2;
const ALERT_RING_OUTER_RADIUS = 0.27;
const NODE_OUTAGE_RING_Y = 0.145;

export function CrisisEffects({ snapshot, ringSegments = 40 }: CrisisEffectsProps) {
  const groupRef = useRef<THREE.Group>(null);

  const hotspots = useMemo(() => {
    const lineHotspots = snapshot.lines
      .filter((line) => line.tripped || line.status === "offline" || line.status === "critical" || line.status === "overloaded")
      .map((line) => {
        const from = snapshot.nodes.find((node) => node.id === line.fromNodeId);
        const to = snapshot.nodes.find((node) => node.id === line.toNodeId);
        if (!from || !to) return null;
        return {
          id: line.id,
          x: (from.position[0] + to.position[0]) / 2,
          z: (from.position[2] + to.position[2]) / 2,
          y: ALERT_RING_Y,
          inner: ALERT_RING_INNER_RADIUS,
          outer: ALERT_RING_OUTER_RADIUS,
          color: line.tripped || line.status === "offline" || line.status === "critical" ? "#ff2f5f" : "#ff7a1a",
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const nodeHotspots = snapshot.nodes.flatMap((node) => {
      const outage = getNodeOutageVisual(node);
      if (outage.level === "normal") return [];

      const radius = outage.level === "blackout" ? 0.31 : outage.level === "partial" ? 0.28 : 0.25;
      return [{
        id: `node-${node.id}`,
        x: node.position[0],
        z: node.position[2],
        y: NODE_OUTAGE_RING_Y,
        inner: radius,
        outer: radius + 0.035,
        color: outage.alertColor,
      }];
    });

    return [...lineHotspots, ...nodeHotspots];
  }, [snapshot.lines, snapshot.nodes]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.children.forEach((child, index) => {
      const phase = (t * 0.5 + index * 0.5) % 1;
      const scale = 0.5 + phase * 0.72;
      child.scale.set(scale, scale, scale);
      const mesh = child as THREE.Mesh;
      (mesh.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.36;
    });
  });

  return (
    <group ref={groupRef}>
      {hotspots.map((spot) => (
        <mesh key={spot.id} position={[spot.x, spot.y, spot.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[spot.inner, spot.outer, ringSegments]} />
          <meshBasicMaterial
            color={spot.color}
            transparent
            opacity={0.36}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

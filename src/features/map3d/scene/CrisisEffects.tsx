"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { FranceGridSnapshot } from "@/game/network/networkTypes";

interface CrisisEffectsProps {
  snapshot: FranceGridSnapshot;
}

export function CrisisEffects({ snapshot }: CrisisEffectsProps) {
  const groupRef = useRef<THREE.Group>(null);

  const hotspots = useMemo(() => {
    return snapshot.lines
      .filter((line) => line.status === "critical" || line.status === "overloaded")
      .map((line) => {
        const from = snapshot.nodes.find((node) => node.id === line.fromNodeId);
        const to = snapshot.nodes.find((node) => node.id === line.toNodeId);
        if (!from || !to) return null;
        return {
          id: line.id,
          x: (from.position[0] + to.position[0]) / 2,
          z: (from.position[2] + to.position[2]) / 2,
          critical: line.status === "critical",
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [snapshot.lines, snapshot.nodes]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.children.forEach((child, index) => {
      const phase = (t * 0.9 + index * 0.5) % 1;
      const scale = 0.4 + phase * 1.3;
      child.scale.set(scale, scale, scale);
      const mesh = child as THREE.Mesh;
      (mesh.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.45;
    });
  });

  return (
    <group ref={groupRef}>
      {hotspots.map((spot) => (
        <mesh key={spot.id} position={[spot.x, 0.03, spot.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.32, 0.4, 40]} />
          <meshBasicMaterial
            color={spot.critical ? "#ff2f5f" : "#ff7a1a"}
            transparent
            opacity={0.4}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

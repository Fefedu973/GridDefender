"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { TransmissionLineStatus } from "@/game/network/networkTypes";
import { lineStatusColor } from "@/features/map3d/scene/visuals";

interface FlowParticlesProps {
  curve: THREE.CatmullRomCurve3;
  count: number;
  speed: number;
  status: TransmissionLineStatus;
}

export function FlowParticles({ curve, count, speed, status }: FlowParticlesProps) {
  const groupRef = useRef<THREE.Group>(null);
  const offsets = useMemo(() => Array.from({ length: count }, (_, index) => index / count), [count]);
  const color = lineStatusColor(status);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const elapsed = clock.elapsedTime * speed;
    groupRef.current.children.forEach((child, index) => {
      const t = (elapsed + offsets[index]) % 1;
      const point = curve.getPoint(t);
      child.position.copy(point);
      // Fade particles in at the start and out near the end for a "pulse" feel.
      const fade = Math.sin(t * Math.PI);
      const mesh = child as THREE.Mesh;
      (mesh.material as THREE.MeshBasicMaterial).opacity = 0.35 + fade * 0.55;
      mesh.scale.setScalar(0.7 + fade * 0.6);
    });
  });

  return (
    <group ref={groupRef}>
      {offsets.map((offset) => (
        <mesh key={offset}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

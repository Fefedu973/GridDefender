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
      const next = curve.getPoint((t + 0.012) % 1);
      child.position.copy(point);
      child.lookAt(next);
      // Short, restrained pulses keep the line readable as infrastructure first.
      const fade = Math.sin(t * Math.PI);
      const mesh = child as THREE.Mesh;
      (mesh.material as THREE.MeshBasicMaterial).opacity = 0.15 + fade * 0.42;
      mesh.scale.setScalar(0.72 + fade * 0.35);
    });
  });

  return (
    <group ref={groupRef}>
      {offsets.map((offset) => (
        <mesh key={offset}>
          <boxGeometry args={[0.018, 0.018, 0.07]} />
          <meshBasicMaterial color={color} transparent opacity={0.48} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

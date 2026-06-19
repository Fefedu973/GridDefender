"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { FRANCE_BOUNDS } from "@/features/map3d/geo/franceGeo";

interface WeatherEffectsProps {
  rain: boolean;
}

export function WeatherEffects({ rain }: WeatherEffectsProps) {
  const groupRef = useRef<THREE.Group>(null);
  const drops = useMemo(
    () =>
      Array.from({ length: 80 }, (_, index) => {
        const lane = index % 10;
        const row = Math.floor(index / 10);
        return {
          id: index,
          x: FRANCE_BOUNDS.centerX - 4.5 + lane * 1.0 + ((index * 37) % 11) * 0.018,
          y: 1.8 + (index % 8) * 0.28,
          z: FRANCE_BOUNDS.centerZ - 3.8 + row * 0.9,
          speed: 0.34 + (index % 5) * 0.045,
        };
      }),
    [],
  );

  useFrame((_, delta) => {
    if (!rain || !groupRef.current) return;
    for (const child of groupRef.current.children) {
      const speed = Number(child.userData.speed ?? 0.4);
      child.position.y -= delta * speed * 4.2;
      child.position.x -= delta * speed * 0.35;
      if (child.position.y < 0.1) {
        child.position.y = 3.2;
        child.position.x += 0.28;
      }
    }
  });

  if (!rain) return null;

  return (
    <group ref={groupRef}>
      {drops.map((drop) => (
        <mesh key={drop.id} position={[drop.x, drop.y, drop.z]} rotation={[0.25, 0, -0.18]} userData={{ speed: drop.speed }}>
          <boxGeometry args={[0.008, 0.22, 0.008]} />
          <meshBasicMaterial color="#7dd3fc" transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}

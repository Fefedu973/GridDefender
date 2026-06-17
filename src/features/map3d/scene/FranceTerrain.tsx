"use client";

import { Grid, Line } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import {
  CORSICA_OUTLINE,
  FRANCE_BOUNDS,
  FRANCE_OUTLINE,
  outlineToWorld,
} from "@/features/map3d/geo/franceGeo";

const LAND_DEPTH = 0.22;

function buildShape(world: Array<[number, number]>) {
  const shape = new THREE.Shape();
  world.forEach(([x, z], index) => {
    if (index === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  });
  shape.closePath();
  return shape;
}

function Landmass({ outline }: { outline: Array<[number, number]> }) {
  const geometry = useMemo(() => {
    const shape = buildShape(outline);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: LAND_DEPTH,
      bevelEnabled: true,
      bevelSize: 0.03,
      bevelThickness: 0.05,
      bevelSegments: 2,
    });
    geo.computeVertexNormals();
    return geo;
  }, [outline]);

  // Rim drawn in world space, sitting just above the top face (y = 0).
  const rim = useMemo(
    () => outline.map(([x, z]) => [x, 0.04, z] as [number, number, number]),
    [outline],
  );

  return (
    <group>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh geometry={geometry} receiveShadow castShadow>
          <meshStandardMaterial
            color="#0a1c26"
            emissive="#06141c"
            emissiveIntensity={0.6}
            metalness={0.2}
            roughness={0.82}
          />
        </mesh>
      </group>

      {/* Glowing coastline (bright core + soft wide halo). */}
      <Line points={rim} color="#7df9ff" lineWidth={2.4} transparent opacity={0.95} />
      <Line points={rim} color="#22d3ee" lineWidth={9} transparent opacity={0.16} />
    </group>
  );
}

export function FranceTerrain() {
  const france = useMemo(() => outlineToWorld(FRANCE_OUTLINE), []);
  const corsica = useMemo(() => outlineToWorld(CORSICA_OUTLINE), []);

  return (
    <group>
      {/* Command-map sea floor. */}
      <Grid
        position={[FRANCE_BOUNDS.centerX, -0.28, FRANCE_BOUNDS.centerZ]}
        args={[40, 40]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#0e3a44"
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor="#12586a"
        fadeDistance={17}
        fadeStrength={2.6}
        infiniteGrid
        followCamera={false}
      />

      {/* Dark sea sheet beneath the grid to anchor the scene. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[FRANCE_BOUNDS.centerX, -0.3, FRANCE_BOUNDS.centerZ]}>
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial color="#020a0f" transparent opacity={0.92} />
      </mesh>

      <Landmass outline={france} />
      <Landmass outline={corsica} />
    </group>
  );
}

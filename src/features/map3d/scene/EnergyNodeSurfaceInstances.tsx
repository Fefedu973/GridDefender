"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import type { FranceGridSnapshot } from "@/game/network/networkTypes";
import type { ViewLayer } from "@/store/gameStore";
import {
  collectEnergyNodeSurfacePlacements,
  type EnergyNodeSurfacePlacement,
} from "@/features/map3d/scene/energyNodeSurface";

interface EnergyNodeSurfaceInstancesProps {
  snapshot: FranceGridSnapshot;
  selectedNodeId?: string;
  viewLayer: ViewLayer;
}

function usePlacementMatrices(
  ref: RefObject<THREE.InstancedMesh | null>,
  placements: EnergyNodeSurfacePlacement[],
  color: THREE.Color,
  dummy: THREE.Object3D,
) {
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;

    placements.forEach((placement, index) => {
      dummy.position.set(...placement.position);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.setScalar(placement.radius);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, color.set(placement.color));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [color, dummy, placements, ref]);
}

function SurfaceMesh({
  geometry,
  placements,
  opacity,
  renderOrder,
}: {
  geometry: THREE.BufferGeometry;
  placements: EnergyNodeSurfacePlacement[];
  opacity: number;
  renderOrder: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const color = useMemo(() => new THREE.Color(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ffffff",
        transparent: true,
        opacity,
        depthWrite: false,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
      }),
    [opacity],
  );

  usePlacementMatrices(ref, placements, color, dummy);

  if (placements.length === 0) return null;
  return <instancedMesh ref={ref} args={[geometry, material, placements.length]} renderOrder={renderOrder} frustumCulled={false} />;
}

export function EnergyNodeSurfaceInstances({ snapshot, selectedNodeId, viewLayer }: EnergyNodeSurfaceInstancesProps) {
  const placements = useMemo(
    () => collectEnergyNodeSurfacePlacements(snapshot, selectedNodeId, viewLayer),
    [selectedNodeId, snapshot, viewLayer],
  );
  const padGeometry = useMemo(() => new THREE.CircleGeometry(1, 32), []);
  const statusRingGeometry = useMemo(() => new THREE.RingGeometry(0.82, 1, 40), []);
  const outageRingGeometry = useMemo(() => new THREE.RingGeometry(0.92, 1, 44), []);
  const blackoutGeometry = useMemo(() => new THREE.CircleGeometry(1, 34), []);
  const emergencyRingGeometry = useMemo(() => new THREE.RingGeometry(0.95, 1, 46), []);

  return (
    <group>
      <SurfaceMesh geometry={padGeometry} placements={placements.pads} opacity={0.58} renderOrder={1} />
      <SurfaceMesh geometry={statusRingGeometry} placements={placements.statusRings} opacity={0.72} renderOrder={2} />
      <SurfaceMesh geometry={outageRingGeometry} placements={placements.outageRings} opacity={0.78} renderOrder={3} />
      <SurfaceMesh geometry={blackoutGeometry} placements={placements.blackoutDisks} opacity={0.46} renderOrder={4} />
      <SurfaceMesh geometry={emergencyRingGeometry} placements={placements.emergencyRings} opacity={0.7} renderOrder={5} />
    </group>
  );
}

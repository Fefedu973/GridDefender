"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { FranceGridSnapshot } from "@/game/network/networkTypes";
import type { ViewLayer } from "@/store/gameStore";
import { buildTransmissionRoute } from "@/features/map3d/scene/transmissionRoute";
import { lineLayerColor } from "@/features/map3d/scene/visuals";

interface TransmissionPylonInstancesProps {
  snapshot: FranceGridSnapshot;
  selectedLineId?: string;
  density?: number;
  showInsulators?: boolean;
  castShadows?: boolean;
  viewLayer: ViewLayer;
}

interface PylonPlacement {
  angle: number;
  crossbarWidth: number;
  id: string;
  lineColor: string;
  mastColor: string;
  mastHeight: number;
  position: [number, number, number];
}

interface InsulatorPlacement {
  color: string;
  id: string;
  position: [number, number, number];
}

const INSULATOR_RATIOS = [-0.34, 0, 0.34] as const;

function pylonDimensions(voltageKv: number) {
  const highVoltage = voltageKv >= 400;
  return {
    crossbarWidth: highVoltage ? 0.25 : 0.19,
    mastHeight: highVoltage ? 0.28 : 0.22,
  };
}

function shouldKeepPylon(index: number, total: number, active: boolean, density: number) {
  if (active || density >= 0.95 || total <= 1) return true;
  if (density <= 0.5) return index === Math.floor((total - 1) / 2);
  if (density <= 0.75) return index % 2 === 0;
  return true;
}

export function collectTransmissionPylonPlacements(
  snapshot: FranceGridSnapshot,
  selectedLineId: string | undefined,
  viewLayer: ViewLayer,
  options: { density?: number; showInsulators?: boolean } = {},
) {
  const nodesById = new Map(snapshot.nodes.map((node) => [node.id, node]));
  const pylons: PylonPlacement[] = [];
  const insulators: InsulatorPlacement[] = [];
  const density = Math.max(0, Math.min(1, options.density ?? 1));
  const showInsulators = options.showInsulators ?? true;

  for (const line of snapshot.lines) {
    const fromNode = nodesById.get(line.fromNodeId);
    const toNode = nodesById.get(line.toNodeId);
    if (!fromNode || !toNode) continue;

    const route = buildTransmissionRoute({
      fromPosition: fromNode.position,
      toPosition: toNode.position,
      visualBend: line.visualBend,
    });
    const lineColor = lineLayerColor(line, fromNode, toNode, viewLayer);
    const active = selectedLineId === line.id || line.tripped || line.status === "critical" || line.status === "overloaded";
    const mastColor = active ? lineColor : "#78919a";
    const dimensions = pylonDimensions(line.voltageKv);

    route.pylons.forEach((pylon, index) => {
      if (!shouldKeepPylon(index, route.pylons.length, active, density)) return;
      const id = `${line.id}-${index}`;
      const placement: PylonPlacement = {
        angle: pylon.angle,
        id,
        lineColor,
        mastColor,
        position: pylon.position,
        ...dimensions,
      };
      pylons.push(placement);

      if (!showInsulators) return;
      for (const ratio of INSULATOR_RATIOS) {
        const offset = ratio * dimensions.crossbarWidth;
        insulators.push({
          color: lineColor,
          id: `${id}-${ratio}`,
          position: [
            pylon.position[0] + Math.cos(pylon.angle) * offset,
            pylon.position[1] + dimensions.mastHeight - 0.01,
            pylon.position[2] - Math.sin(pylon.angle) * offset,
          ],
        });
      }
    });
  }

  return { insulators, pylons };
}

export function TransmissionPylonInstances({
  snapshot,
  selectedLineId,
  density = 1,
  showInsulators = true,
  castShadows = true,
  viewLayer,
}: TransmissionPylonInstancesProps) {
  const mastRef = useRef<THREE.InstancedMesh>(null);
  const crossbarRef = useRef<THREE.InstancedMesh>(null);
  const insulatorRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const { insulators, pylons } = useMemo(
    () => collectTransmissionPylonPlacements(snapshot, selectedLineId, viewLayer, { density, showInsulators }),
    [density, selectedLineId, showInsulators, snapshot, viewLayer],
  );

  const mastGeometry = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 6), []);
  const crossbarGeometry = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 6), []);
  const insulatorGeometry = useMemo(() => new THREE.SphereGeometry(1, 8, 6), []);
  const mastMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: "#12313b",
        emissiveIntensity: 0.14,
        metalness: 0.48,
        roughness: 0.34,
        vertexColors: true,
      }),
    [],
  );
  const crossbarMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: "#12313b",
        emissiveIntensity: 0.18,
        metalness: 0.55,
        roughness: 0.28,
        vertexColors: true,
      }),
    [],
  );
  const insulatorMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ffffff",
        opacity: 0.62,
        transparent: true,
        vertexColors: true,
      }),
    [],
  );

  useLayoutEffect(() => {
    const mastMesh = mastRef.current;
    const crossbarMesh = crossbarRef.current;
    if (!mastMesh || !crossbarMesh) return;

    pylons.forEach((pylon, index) => {
      const mastRadius = pylon.mastHeight >= 0.28 ? 0.009 : 0.007;
      dummy.position.set(pylon.position[0], pylon.position[1] + pylon.mastHeight / 2, pylon.position[2]);
      dummy.rotation.set(0, pylon.angle, 0);
      dummy.scale.set(mastRadius, pylon.mastHeight, mastRadius);
      dummy.updateMatrix();
      mastMesh.setMatrixAt(index, dummy.matrix);
      mastMesh.setColorAt(index, color.set(pylon.mastColor));

      dummy.position.set(pylon.position[0], pylon.position[1] + pylon.mastHeight + 0.024, pylon.position[2]);
      dummy.rotation.set(0, pylon.angle, Math.PI / 2);
      dummy.scale.set(0.0048, pylon.crossbarWidth, 0.0048);
      dummy.updateMatrix();
      crossbarMesh.setMatrixAt(index, dummy.matrix);
      crossbarMesh.setColorAt(index, color.set(pylon.mastColor));
    });

    mastMesh.instanceMatrix.needsUpdate = true;
    crossbarMesh.instanceMatrix.needsUpdate = true;
    if (mastMesh.instanceColor) mastMesh.instanceColor.needsUpdate = true;
    if (crossbarMesh.instanceColor) crossbarMesh.instanceColor.needsUpdate = true;
  }, [color, dummy, pylons]);

  useLayoutEffect(() => {
    const mesh = insulatorRef.current;
    if (!mesh) return;

    insulators.forEach((insulator, index) => {
      dummy.position.set(...insulator.position);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(0.024);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, color.set(insulator.color));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [color, dummy, insulators]);

  if (pylons.length === 0) return null;

  return (
    <group>
      <instancedMesh ref={mastRef} args={[mastGeometry, mastMaterial, pylons.length]} castShadow={castShadows} frustumCulled={false} />
      <instancedMesh ref={crossbarRef} args={[crossbarGeometry, crossbarMaterial, pylons.length]} castShadow={castShadows} frustumCulled={false} />
      {insulators.length > 0 && (
        <instancedMesh ref={insulatorRef} args={[insulatorGeometry, insulatorMaterial, insulators.length]} frustumCulled={false} />
      )}
    </group>
  );
}

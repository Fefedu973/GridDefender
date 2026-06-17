"use client";

import { Line } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import type { GridNode, TransmissionLine as TransmissionLineModel } from "@/game/network/networkTypes";
import { FlowParticles } from "@/features/map3d/scene/FlowParticles";
import { lineStatusColor } from "@/features/map3d/scene/visuals";

interface TransmissionLineProps {
  line: TransmissionLineModel;
  fromNode: GridNode;
  toNode: GridNode;
  selected: boolean;
  onSelect: () => void;
}

const LINE_Y = 0.1;

export function TransmissionLine({ line, fromNode, toNode, selected, onSelect }: TransmissionLineProps) {
  const curve = useMemo(() => {
    const from = new THREE.Vector3(fromNode.position[0], LINE_Y, fromNode.position[2]);
    const to = new THREE.Vector3(toNode.position[0], LINE_Y, toNode.position[2]);
    const mid = from.clone().add(to).multiplyScalar(0.5);
    const distance = from.distanceTo(to);
    mid.y += 0.18 + distance * 0.16;
    return new THREE.CatmullRomCurve3([from, mid, to]);
  }, [fromNode.position, toNode.position]);

  const points = useMemo(() => curve.getPoints(40), [curve]);
  const color = lineStatusColor(line.status);
  const width = selected ? 4.4 : Math.max(1.4, Math.min(3.6, 1.3 + line.utilizationRatio * 2.2));
  const particleCount = Math.max(5, Math.min(16, Math.round(line.currentFlowMw / 11)));
  const particleSpeed = 0.1 + line.utilizationRatio * 0.18;
  const isHot = line.status === "critical" || line.status === "overloaded";

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect();
  };

  return (
    <group onClick={handleClick}>
      {/* Soft halo */}
      <Line points={points} color={color} lineWidth={width + 7} transparent opacity={isHot ? 0.18 : 0.1} />
      {/* Core */}
      <Line
        points={points}
        color={color}
        lineWidth={width}
        transparent
        opacity={line.status === "critical" ? 1 : 0.78}
        dashed={line.status === "critical"}
        dashSize={0.18}
        gapSize={0.1}
      />
      {selected && <Line points={points} color="#ffffff" lineWidth={1.2} transparent opacity={0.9} />}

      {/* Invisible fat tube for easier clicking */}
      <mesh>
        <tubeGeometry args={[curve, 24, 0.13, 6, false]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <FlowParticles curve={curve} count={particleCount} speed={particleSpeed} status={line.status} />
    </group>
  );
}

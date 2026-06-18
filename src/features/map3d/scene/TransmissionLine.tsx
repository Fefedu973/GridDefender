"use client";

import { Line } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import { memo, useMemo } from "react";
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

interface PowerPylonProps {
  angle: number;
  color: string;
  position: [number, number, number];
  selected: boolean;
  voltageKv: number;
}

const LINE_Y = 0.34;
const NODE_INSET = 0.3;
const WIRE_OFFSETS = [-0.044, 0, 0.044];
const ROUTE_BENDS: Record<string, number> = {
  "normandy-paris": 0.12,
  "paris-hospital": -0.05,
  "interconnect-paris": -0.12,
  "normandy-interconnect": 0.08,
  "paris-lyon": 0.2,
  "atlantic-bordeaux": -0.08,
  "bordeaux-toulouse": -0.13,
  "bordeaux-centre": 0.18,
  "atlantic-centre": 0.16,
  "paris-centre-battery": -0.16,
  "centre-lyon": 0.14,
  "solar-rhone": -0.18,
  "lyon-marseille": 0.12,
};

function offsetPoints(points: THREE.Vector3[], normal: THREE.Vector3, offset: number) {
  return points.map((point) => point.clone().addScaledVector(normal, offset));
}

function PowerPylon({ angle, color, position, selected, voltageKv }: PowerPylonProps) {
  const highVoltage = voltageKv >= 400;
  const mastHeight = highVoltage ? 0.28 : 0.22;
  const crossbarWidth = highVoltage ? 0.25 : 0.19;
  const materialColor = selected ? "#e8fbff" : "#78919a";

  return (
    <group position={position} rotation={[0, angle, 0]}>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.04, 12]} />
        <meshBasicMaterial color="#020b0f" transparent opacity={0.66} />
      </mesh>
      <mesh position={[0, mastHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.006, 0.011, mastHeight, 6]} />
        <meshStandardMaterial color={materialColor} emissive={color} emissiveIntensity={0.12} metalness={0.48} roughness={0.34} />
      </mesh>
      <mesh position={[0, mastHeight + 0.024, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.0048, 0.0048, crossbarWidth, 6]} />
        <meshStandardMaterial color={materialColor} emissive={color} emissiveIntensity={0.16} metalness={0.55} roughness={0.28} />
      </mesh>
      {[-0.34, 0, 0.34].map((ratio) => (
        <mesh key={ratio} position={[ratio * crossbarWidth, mastHeight - 0.01, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 0.044, 6]} />
          <meshBasicMaterial color={color} transparent opacity={selected ? 0.82 : 0.56} />
        </mesh>
      ))}
    </group>
  );
}

export function TransmissionLine({ line, fromNode, toNode, selected, onSelect }: TransmissionLineProps) {
  const fromX = fromNode.position[0];
  const fromZ = fromNode.position[2];
  const toX = toNode.position[0];
  const toZ = toNode.position[2];

  const route = useMemo(() => {
    const from = new THREE.Vector3(fromX, LINE_Y, fromZ);
    const to = new THREE.Vector3(toX, LINE_Y, toZ);
    const direction = to.clone().sub(from);
    direction.y = 0;

    const distance = direction.length();
    if (distance > 0.001) direction.normalize();

    const normal = new THREE.Vector3(-direction.z, 0, direction.x);
    const inset = Math.min(NODE_INSET, Math.max(0.12, distance * 0.12));
    const start = from.clone().addScaledVector(direction, inset);
    const end = to.clone().addScaledVector(direction, -inset);
    const bend = (ROUTE_BENDS[line.id] ?? 0) * Math.min(1, distance / 1.8);
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

    const wirePoints = WIRE_OFFSETS.map((offset) => ({
      offset,
      points: offsetPoints(points, normal, offset),
    }));

    return { curve, distance, points, pylons, wirePoints };
  }, [fromX, fromZ, line.id, toX, toZ]);

  const color = lineStatusColor(line.status);
  const isHot = line.status === "critical" || line.status === "overloaded";
  const baseWireWidth = selected ? 2.4 : line.voltageKv >= 400 ? 1.35 : 1.05;
  const distanceFactor = Math.max(0.65, Math.min(1.35, route.distance / 1.7));
  const particleCount = Math.max(1, Math.min(6, Math.round((line.currentFlowMw / 34) * distanceFactor)));
  const particleSpeed = 0.035 + line.utilizationRatio * 0.055;

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect();
  };

  return (
    <group onClick={handleClick}>
      {route.pylons.map((pylon, index) => (
        <PowerPylon
          key={index}
          angle={pylon.angle}
          color={color}
          position={pylon.position}
          selected={selected || isHot}
          voltageKv={line.voltageKv}
        />
      ))}

      {selected && (
        <Line points={route.points} color="#ffffff" lineWidth={5.2} transparent opacity={0.12} />
      )}
      {isHot && (
        <Line points={route.points} color={color} lineWidth={4.4} transparent opacity={0.12} />
      )}

      {route.wirePoints.map(({ offset, points }) => {
        const isCore = offset === 0;
        return (
          <Line
            key={offset}
            points={points}
            color={isCore ? color : "#b7d7dd"}
            lineWidth={isCore ? baseWireWidth + (isHot ? 0.45 : 0) : baseWireWidth * 0.72}
            transparent
            opacity={isCore ? (line.status === "offline" ? 0.38 : 0.86) : 0.45}
          />
        );
      })}

      {selected && <Line points={route.points} color="#ffffff" lineWidth={1} transparent opacity={0.86} />}

      {/* Invisible tube keeps line selection usable despite the finer visual cables. */}
      <mesh>
        <tubeGeometry args={[route.curve, 24, 0.12, 6, false]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <FlowParticles curve={route.curve} count={particleCount} speed={particleSpeed} status={line.status} />
    </group>
  );
}

export const MemoTransmissionLine = memo(TransmissionLine, (prev, next) => (
  prev.selected === next.selected &&
  prev.line.currentFlowMw === next.line.currentFlowMw &&
  prev.line.status === next.line.status &&
  prev.line.utilizationRatio === next.line.utilizationRatio &&
  prev.line.overloadDuration === next.line.overloadDuration &&
  prev.fromNode.id === next.fromNode.id &&
  prev.toNode.id === next.toNode.id
));

MemoTransmissionLine.displayName = "MemoTransmissionLine";

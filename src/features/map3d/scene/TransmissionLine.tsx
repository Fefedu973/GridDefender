"use client";

import { Line } from "@react-three/drei";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { memo, useMemo, useRef } from "react";
import * as THREE from "three";
import type { GridNode, TransmissionLine as TransmissionLineModel } from "@/game/network/networkTypes";
import type { ViewLayer } from "@/store/gameStore";
import { FlowParticles } from "@/features/map3d/scene/FlowParticles";
import { scaleEffectCount } from "@/features/map3d/scene/renderQualityProfile";
import { buildTransmissionRoute } from "@/features/map3d/scene/transmissionRoute";
import { lineLayerColor, lineLayerEmphasis } from "@/features/map3d/scene/visuals";

interface TransmissionLineProps {
  line: TransmissionLineModel;
  fromNode: GridNode;
  toNode: GridNode;
  selected: boolean;
  particleScale: number;
  sparkScale: number;
  viewLayer: ViewLayer;
  onSelect: () => void;
}

interface LineHeatSparksProps {
  active: boolean;
  color: string;
  curve: THREE.CatmullRomCurve3;
  intensity: number;
  effectScale: number;
}

function LineHeatSparks({ active, color, curve, intensity, effectScale }: LineHeatSparksProps) {
  const groupRef = useRef<THREE.Group>(null);
  const sparks = useMemo(() => {
    const baseCount = active ? Math.max(2, Math.min(8, Math.round(intensity * 8))) : 0;
    const count = scaleEffectCount(baseCount, effectScale);
    return Array.from({ length: count }, (_, index) => {
      const t = (index + 1) / (count + 1);
      const point = curve.getPoint(t);
      const jitter = ((index % 3) - 1) * 0.028;
      return {
        id: index,
        position: [point.x + jitter, point.y + 0.045 + (index % 2) * 0.035, point.z - jitter] as [number, number, number],
        scale: 0.018 + intensity * 0.022,
      };
    });
  }, [active, curve, effectScale, intensity]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.children.forEach((child, index) => {
      const pulse = 0.45 + Math.sin(t * 8.5 + index * 1.7) * 0.35;
      child.scale.setScalar((sparks[index]?.scale ?? 0.02) * (1 + pulse));
      const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      material.opacity = 0.22 + Math.max(0, pulse) * 0.72;
    });
  });

  if (sparks.length === 0) return null;

  return (
    <group ref={groupRef}>
      {sparks.map((spark) => (
        <mesh key={spark.id} position={spark.position} scale={spark.scale}>
          <sphereGeometry args={[1, 7, 5]} />
          <meshBasicMaterial color={color} transparent opacity={0.72} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}

export function TransmissionLine({
  line,
  fromNode,
  toNode,
  selected,
  particleScale,
  sparkScale,
  viewLayer,
  onSelect,
}: TransmissionLineProps) {
  const fromX = fromNode.position[0];
  const fromZ = fromNode.position[2];
  const toX = toNode.position[0];
  const toZ = toNode.position[2];

  const route = useMemo(() => {
    return buildTransmissionRoute({
      fromPosition: [fromX, 0, fromZ],
      toPosition: [toX, 0, toZ],
      visualBend: line.visualBend,
    });
  }, [fromX, fromZ, line.visualBend, toX, toZ]);

  const color = lineLayerColor(line, fromNode, toNode, viewLayer);
  const layerEmphasis = lineLayerEmphasis(line, fromNode, toNode, viewLayer);
  const isHot = line.status === "critical" || line.status === "overloaded";
  const baseWireWidth = selected ? 2.4 : line.voltageKv >= 400 ? 1.35 : 1.05;
  const distanceFactor = Math.max(0.65, Math.min(1.35, route.distance / 1.7));
  const baseParticleCount =
    line.tripped || line.status === "offline" || line.currentFlowMw < 0.5
      ? 0
      : Math.max(1, Math.min(6, Math.round((line.currentFlowMw / 34) * distanceFactor)));
  const particleCount = scaleEffectCount(baseParticleCount, particleScale);
  const particleSpeed = line.status === "offline" ? 0 : 0.035 + line.utilizationRatio * 0.055;
  const reverseFlow = line.signedFlowMw < 0;
  const heatIntensity = Math.max(0, Math.min(1, (line.temperatureC - 70) / 55 + Math.max(0, line.utilizationRatio - 1) * 0.65));

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect();
  };

  return (
    <group onClick={handleClick}>
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
            opacity={
              isCore
                ? (line.status === "offline" ? 0.38 : 0.86) * layerEmphasis
                : 0.45 * Math.max(0.35, layerEmphasis)
            }
          />
        );
      })}

      {selected && <Line points={route.points} color="#ffffff" lineWidth={1} transparent opacity={0.86} />}

      {/* Invisible tube keeps line selection usable despite the finer visual cables. */}
      <mesh>
        <tubeGeometry args={[route.curve, 24, 0.12, 6, false]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <FlowParticles curve={route.curve} count={particleCount} speed={particleSpeed} status={line.status} reverse={reverseFlow} />
      <LineHeatSparks
        active={isHot && !line.tripped}
        color={color}
        curve={route.curve}
        effectScale={sparkScale}
        intensity={heatIntensity}
      />
    </group>
  );
}

export const MemoTransmissionLine = memo(TransmissionLine, (prev, next) => (
  prev.selected === next.selected &&
  prev.line.currentFlowMw === next.line.currentFlowMw &&
  prev.line.status === next.line.status &&
  prev.line.utilizationRatio === next.line.utilizationRatio &&
  prev.line.overloadDuration === next.line.overloadDuration &&
  prev.line.temperatureC === next.line.temperatureC &&
  prev.line.tripped === next.line.tripped &&
  prev.line.signedFlowMw === next.line.signedFlowMw &&
  prev.line.visualBend === next.line.visualBend &&
  prev.line.voltageKv === next.line.voltageKv &&
  prev.particleScale === next.particleScale &&
  prev.sparkScale === next.sparkScale &&
  prev.viewLayer === next.viewLayer &&
  prev.fromNode.id === next.fromNode.id &&
  prev.fromNode.position[0] === next.fromNode.position[0] &&
  prev.fromNode.position[2] === next.fromNode.position[2] &&
  prev.toNode.id === next.toNode.id &&
  prev.toNode.position[0] === next.toNode.position[0] &&
  prev.toNode.position[2] === next.toNode.position[2]
));

MemoTransmissionLine.displayName = "MemoTransmissionLine";

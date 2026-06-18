"use client";

import { Html } from "@react-three/drei";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import type { GridNode } from "@/game/network/networkTypes";
import { MemoNodeStructure } from "@/features/map3d/scene/NodeModels";
import { nodeKindColor, nodeRoleColor, nodeStatusColor } from "@/features/map3d/scene/visuals";
import { formatMw } from "@/lib/format";

interface EnergyNodeProps {
  node: GridNode;
  selected: boolean;
  onSelect: () => void;
}

const NODE_SURFACE_LIFT = 0.085;
const MODEL_SURFACE_LIFT = 0.035;

export function EnergyNode({ node, selected, onSelect }: EnergyNodeProps) {
  const reticleRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const kindColor = nodeKindColor(node.kind);
  const statusColor = nodeStatusColor(node.status);
  const accent = node.status === "stable" ? kindColor : statusColor;
  const roleColor = nodeRoleColor(node.role);

  const labelMode = node.labelMode ?? "auto";
  const activeStatus = node.status === "loaded" || node.status === "overloaded" || node.status === "critical";
  const showLabel = selected || hovered || labelMode === "always" || (labelMode === "auto" && activeStatus);
  const labelHeight = MODEL_SURFACE_LIFT + 0.88;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    if (reticleRef.current && selected) {
      reticleRef.current.rotation.z = t * 0.8;
    }
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect();
  };

  const handleOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  };

  const handleOut = () => {
    setHovered(false);
    document.body.style.cursor = "auto";
  };

  return (
    <group
      position={[node.position[0], node.position[1] + NODE_SURFACE_LIFT, node.position[2]]}
      onClick={handleClick}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
    >
      {/* Ground pad + status ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.024, 0]}>
        <circleGeometry args={[0.2, 32]} />
        <meshBasicMaterial color="#02141b" transparent opacity={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.2, 0.24, 40]} />
        <meshBasicMaterial color={accent} transparent opacity={selected ? 1 : 0.7} />
      </mesh>

      {/* Selection reticle */}
      {selected && (
        <group ref={reticleRef} position={[0, 0.038, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <ringGeometry args={[0.3, 0.33, 4]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
          </mesh>
        </group>
      )}

      <pointLight color={accent} intensity={selected ? 2.4 : 1.1} distance={2.4} position={[0, 0.4 + MODEL_SURFACE_LIFT, 0]} />

      <group position={[0, MODEL_SURFACE_LIFT, 0]} scale={selected ? 1.18 : 1}>
        <MemoNodeStructure node={node} />
      </group>

      {showLabel && (
        <Html
          center
          position={[0, labelHeight, 0]}
          distanceFactor={9}
          className="pointer-events-none select-none"
          zIndexRange={[20, 0]}
        >
          <div className={`node-label ${selected ? "node-label--selected" : ""} ${node.status === "critical" ? "node-label--critical" : ""}`}>
            <span className="node-label__dot" style={{ background: roleColor, boxShadow: `0 0 8px ${roleColor}` }} />
            <span className="node-label__name">{node.label}</span>
            <span className="node-label__value">{formatMw(Math.max(node.productionMw, node.demandMw))}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

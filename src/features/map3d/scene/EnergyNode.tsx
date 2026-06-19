"use client";

import { Html } from "@react-three/drei";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import type { GridNode } from "@/game/network/networkTypes";
import type { RenderQuality, ViewLayer } from "@/store/gameStore";
import { MemoNodeStructure } from "@/features/map3d/scene/NodeModels";
import { nodeRenderScale } from "@/features/map3d/scene/nodeModelVisuals";
import { getNodeOutageVisual } from "@/features/map3d/scene/nodeOutageVisuals";
import {
  nodeLayerColor,
  nodeLayerDotColor,
  nodeLayerEmphasis,
  nodeLayerLabelValue,
} from "@/features/map3d/scene/visuals";
import { MODEL_SURFACE_LIFT, NODE_SURFACE_LIFT } from "@/features/map3d/scene/energyNodeSurface";
import { formatMw } from "@/lib/format";

interface EnergyNodeProps {
  node: GridNode;
  selected: boolean;
  mapModelScale?: number;
  renderQuality: RenderQuality;
  viewLayer: ViewLayer;
  onSelect: () => void;
}

export function EnergyNode({ node, selected, mapModelScale = 1, renderQuality, viewLayer, onSelect }: EnergyNodeProps) {
  const reticleRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const accent = nodeLayerColor(node, viewLayer);
  const dotColor = nodeLayerDotColor(node, viewLayer);
  const layerEmphasis = nodeLayerEmphasis(node, viewLayer);
  const layerLabel = nodeLayerLabelValue(node, viewLayer);
  const activityBase = Math.max(node.productionMw, node.demandMw);
  const activityMax = Math.max(node.maxProductionMw, node.maxDemandMw, 1);
  const activity = Math.min(1.35, activityBase / activityMax);
  const outageVisual = getNodeOutageVisual(node);
  const unserved = outageVisual.unservedMw;
  const statusLift = node.status === "critical" ? 1.65 : node.status === "overloaded" ? 1.35 : node.status === "loaded" ? 1.12 : 0.9;

  const labelMode = node.labelMode ?? "auto";
  const activeStatus = node.status === "loaded" || node.status === "overloaded" || node.status === "critical";
  const layerLabelActive = viewLayer !== "grid" && layerEmphasis >= 0.95;
  const showLabel = selected || hovered || labelMode === "always" || layerLabelActive || (labelMode === "auto" && activeStatus);
  const safeMapModelScale = Number.isFinite(mapModelScale) ? Math.max(0.65, Math.min(1.55, mapModelScale)) : 1;
  const modelScale = nodeRenderScale({ activity, mapModelScale: safeMapModelScale, selected });
  const labelHeight = MODEL_SURFACE_LIFT + 0.78 * safeMapModelScale + 0.12;
  const shouldEmitLight =
    renderQuality === "high" ||
    selected ||
    node.status === "critical" ||
    node.status === "overloaded" ||
    unserved > 0;
  const lightScale = shouldEmitLight
    ? renderQuality === "high"
      ? 1
      : renderQuality === "standard"
        ? 0.42
        : 0.24
    : 0;

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
      {/* Selection reticle */}
      {selected && (
        <group ref={reticleRef} position={[0, 0.038, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <ringGeometry args={[0.3, 0.33, 4]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
          </mesh>
        </group>
      )}

      {lightScale > 0 && (
        <pointLight
          color={accent}
          intensity={(selected ? 2.4 : 0.8 + activity * 0.9) * statusLift * lightScale * layerEmphasis}
          distance={(renderQuality === "high" ? 2.4 : 1.6) * Math.max(0.8, Math.min(1.35, safeMapModelScale))}
          position={[0, 0.4 + MODEL_SURFACE_LIFT, 0]}
        />
      )}

      <group
        position={[0, MODEL_SURFACE_LIFT, 0]}
        scale={modelScale}
      >
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
            <span className="node-label__dot" style={{ background: dotColor, boxShadow: `0 0 8px ${dotColor}` }} />
            <span className="node-label__name">{node.label}</span>
            <span className="node-label__value">
              {layerLabel || formatMw(Math.max(node.servedProductionMw, node.servedDemandMw))}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}

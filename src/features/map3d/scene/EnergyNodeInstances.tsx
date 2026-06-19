"use client";

import type { FranceGridSnapshot } from "@/game/network/networkTypes";
import type { RenderQuality, ViewLayer } from "@/store/gameStore";
import { EnergyNode } from "@/features/map3d/scene/EnergyNode";
import { EnergyNodeSurfaceInstances } from "@/features/map3d/scene/EnergyNodeSurfaceInstances";

interface EnergyNodeInstancesProps {
  snapshot: FranceGridSnapshot;
  selectedNodeId?: string;
  mapModelScale?: number;
  renderQuality: RenderQuality;
  viewLayer: ViewLayer;
  onSelectNode: (nodeId: string) => void;
}

export function EnergyNodeInstances({
  snapshot,
  selectedNodeId,
  mapModelScale = 1,
  renderQuality,
  viewLayer,
  onSelectNode,
}: EnergyNodeInstancesProps) {
  return (
    <group>
      <EnergyNodeSurfaceInstances snapshot={snapshot} selectedNodeId={selectedNodeId} viewLayer={viewLayer} />
      {snapshot.nodes.map((node) => (
        <EnergyNode
          key={node.id}
          node={node}
          selected={selectedNodeId === node.id}
          mapModelScale={mapModelScale}
          renderQuality={renderQuality}
          viewLayer={viewLayer}
          onSelect={() => onSelectNode(node.id)}
        />
      ))}
    </group>
  );
}

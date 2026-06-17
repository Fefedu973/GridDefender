"use client";

import type { FranceGridSnapshot } from "@/game/network/networkTypes";
import { EnergyNode } from "@/features/map3d/scene/EnergyNode";

interface EnergyNodeInstancesProps {
  snapshot: FranceGridSnapshot;
  selectedNodeId?: string;
  onSelectNode: (nodeId: string) => void;
}

export function EnergyNodeInstances({ snapshot, selectedNodeId, onSelectNode }: EnergyNodeInstancesProps) {
  return (
    <group>
      {snapshot.nodes.map((node) => (
        <EnergyNode
          key={node.id}
          node={node}
          selected={selectedNodeId === node.id}
          onSelect={() => onSelectNode(node.id)}
        />
      ))}
    </group>
  );
}

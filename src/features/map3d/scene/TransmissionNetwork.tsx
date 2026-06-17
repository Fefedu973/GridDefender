"use client";

import type { FranceGridSnapshot } from "@/game/network/networkTypes";
import { TransmissionLine } from "@/features/map3d/scene/TransmissionLine";

interface TransmissionNetworkProps {
  snapshot: FranceGridSnapshot;
  selectedLineId?: string;
  onSelectLine: (lineId: string) => void;
}

export function TransmissionNetwork({ snapshot, selectedLineId, onSelectLine }: TransmissionNetworkProps) {
  return (
    <group>
      {snapshot.lines.map((line) => {
        const fromNode = snapshot.nodes.find((node) => node.id === line.fromNodeId);
        const toNode = snapshot.nodes.find((node) => node.id === line.toNodeId);
        if (!fromNode || !toNode) return null;

        return (
          <TransmissionLine
            key={line.id}
            line={line}
            fromNode={fromNode}
            toNode={toNode}
            selected={selectedLineId === line.id}
            onSelect={() => onSelectLine(line.id)}
          />
        );
      })}
    </group>
  );
}

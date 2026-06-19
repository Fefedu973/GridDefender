"use client";

import { useMemo } from "react";
import type { FranceGridSnapshot } from "@/game/network/networkTypes";
import type { ViewLayer } from "@/store/gameStore";
import type { SceneRenderQualityProfile } from "@/features/map3d/scene/renderQualityProfile";
import { MemoTransmissionLine } from "@/features/map3d/scene/TransmissionLine";
import { TransmissionPylonInstances } from "@/features/map3d/scene/TransmissionPylonInstances";

interface TransmissionNetworkProps {
  snapshot: FranceGridSnapshot;
  selectedLineId?: string;
  renderProfile: SceneRenderQualityProfile;
  viewLayer: ViewLayer;
  onSelectLine: (lineId: string) => void;
}

export function TransmissionNetwork({
  snapshot,
  selectedLineId,
  renderProfile,
  viewLayer,
  onSelectLine,
}: TransmissionNetworkProps) {
  const nodesById = useMemo(
    () => new Map(snapshot.nodes.map((node) => [node.id, node])),
    [snapshot.nodes],
  );

  return (
    <group>
      <TransmissionPylonInstances
        snapshot={snapshot}
        selectedLineId={selectedLineId}
        density={renderProfile.pylonDensity}
        showInsulators={renderProfile.pylonInsulators}
        castShadows={renderProfile.pylonShadows}
        viewLayer={viewLayer}
      />
      {snapshot.lines.map((line) => {
        const fromNode = nodesById.get(line.fromNodeId);
        const toNode = nodesById.get(line.toNodeId);
        if (!fromNode || !toNode) return null;

        return (
          <MemoTransmissionLine
            key={line.id}
            line={line}
            fromNode={fromNode}
            toNode={toNode}
            selected={selectedLineId === line.id}
            particleScale={renderProfile.flowParticleScale}
            sparkScale={renderProfile.heatSparkScale}
            viewLayer={viewLayer}
            onSelect={() => onSelectLine(line.id)}
          />
        );
      })}
    </group>
  );
}

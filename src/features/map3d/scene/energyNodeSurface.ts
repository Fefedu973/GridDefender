import type { FranceGridSnapshot, GridNode } from "@/game/network/networkTypes";
import type { ViewLayer } from "@/store/gameStore";
import { getNodeOutageVisual } from "@/features/map3d/scene/nodeOutageVisuals";
import { nodeLayerColor, nodeLayerEmphasis } from "@/features/map3d/scene/visuals";

export const NODE_SURFACE_LIFT = 0.085;
export const MODEL_SURFACE_LIFT = 0.035;

export interface EnergyNodeSurfacePlacement {
  id: string;
  color: string;
  opacity: number;
  position: [number, number, number];
  radius: number;
}

export interface EnergyNodeSurfacePlacements {
  pads: EnergyNodeSurfacePlacement[];
  statusRings: EnergyNodeSurfacePlacement[];
  outageRings: EnergyNodeSurfacePlacement[];
  blackoutDisks: EnergyNodeSurfacePlacement[];
  emergencyRings: EnergyNodeSurfacePlacement[];
}

function nodeActivity(node: GridNode) {
  const activityBase = Math.max(node.productionMw, node.demandMw);
  const activityMax = Math.max(node.maxProductionMw, node.maxDemandMw, 1);
  return Math.min(1.35, activityBase / activityMax);
}

function placement(
  id: string,
  node: GridNode,
  localY: number,
  radius: number,
  color: string,
  opacity: number,
): EnergyNodeSurfacePlacement {
  return {
    id,
    color,
    opacity,
    position: [node.position[0], node.position[1] + NODE_SURFACE_LIFT + localY, node.position[2]],
    radius,
  };
}

export function collectEnergyNodeSurfacePlacements(
  snapshot: FranceGridSnapshot,
  selectedNodeId: string | undefined,
  viewLayer: ViewLayer,
): EnergyNodeSurfacePlacements {
  const pads: EnergyNodeSurfacePlacement[] = [];
  const statusRings: EnergyNodeSurfacePlacement[] = [];
  const outageRings: EnergyNodeSurfacePlacement[] = [];
  const blackoutDisks: EnergyNodeSurfacePlacement[] = [];
  const emergencyRings: EnergyNodeSurfacePlacement[] = [];

  for (const node of snapshot.nodes) {
    const accent = nodeLayerColor(node, viewLayer);
    const activity = nodeActivity(node);
    const layerEmphasis = nodeLayerEmphasis(node, viewLayer);
    const selected = selectedNodeId === node.id;
    const outageVisual = getNodeOutageVisual(node);

    pads.push(placement(`${node.id}-pad`, node, 0.024, 0.2, "#02141b", 0.5 + layerEmphasis * 0.3));
    statusRings.push(
      placement(
        `${node.id}-status`,
        node,
        0.03,
        0.24 + activity * 0.025,
        accent,
        selected ? 1 : (0.34 + activity * 0.28) * layerEmphasis,
      ),
    );

    if (outageVisual.unservedMw > 0) {
      outageRings.push(
        placement(
          `${node.id}-outage`,
          node,
          0.034,
          0.315,
          outageVisual.alertColor,
          0.5 + outageVisual.emergencyOpacity * 0.38,
        ),
      );
    }

    if (outageVisual.level === "blackout") {
      blackoutDisks.push(placement(`${node.id}-blackout`, node, 0.036, 0.275, "#12030b", 0.46));
    }

    if (outageVisual.emergencyOpacity > 0) {
      emergencyRings.push(
        placement(
          `${node.id}-emergency`,
          node,
          0.04,
          0.358,
          outageVisual.alertColor,
          outageVisual.emergencyOpacity * 0.52,
        ),
      );
    }
  }

  return { pads, statusRings, outageRings, blackoutDisks, emergencyRings };
}

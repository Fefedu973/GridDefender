import type { GridNode } from "@/game/network/networkTypes";

export type NodeOutageLevel = "normal" | "strained" | "partial" | "blackout";

export interface NodeOutageVisual {
  level: NodeOutageLevel;
  unservedMw: number;
  unservedRatio: number;
  emissiveScale: number;
  windowPower: number;
  emergencyOpacity: number;
  alertColor: string;
}

type OutageNode = Pick<
  GridNode,
  "criticality" | "demandMw" | "kind" | "servedDemandMw" | "status"
>;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function getNodeOutageVisual(node: OutageNode): NodeOutageVisual {
  const demandMw = Math.max(0, node.demandMw);
  const servedDemandMw = Math.max(0, node.servedDemandMw);
  const unservedMw = Math.max(0, demandMw - servedDemandMw);
  const statusBlackout = node.status === "offline";
  const unservedRatio = demandMw > 0 ? clamp01(unservedMw / demandMw) : statusBlackout ? 1 : 0;
  const isCriticalLoad = node.criticality === "critical" || node.kind === "hospital";

  const level: NodeOutageLevel =
    statusBlackout || unservedRatio >= 0.7
      ? "blackout"
      : unservedRatio >= 0.22
        ? "partial"
        : unservedRatio > 0.02
          ? "strained"
          : "normal";

  const emergencyBoost = isCriticalLoad ? 1.12 : 0.82;
  const emergencyOpacity = level === "normal" ? 0 : clamp01(0.18 + unservedRatio * emergencyBoost);
  const windowPower = clamp01(level === "blackout" ? 0.08 : 1 - unservedRatio * (isCriticalLoad ? 0.52 : 0.82));
  const emissiveScale = clamp01(level === "blackout" ? 0.16 : 1 - unservedRatio * 0.68);
  const alertColor = level === "strained" ? "#ffd447" : level === "partial" ? "#ff7a1a" : "#ff2f5f";

  return {
    level,
    unservedMw,
    unservedRatio,
    emissiveScale,
    windowPower,
    emergencyOpacity,
    alertColor,
  };
}

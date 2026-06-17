import type { GridNodeKind, GridNodeStatus, TransmissionLineStatus } from "@/game/network/networkTypes";

export function lineStatusColor(status: TransmissionLineStatus) {
  if (status === "critical") return "#ff2f5f";
  if (status === "overloaded") return "#ff7a1a";
  if (status === "loaded") return "#ffd447";
  if (status === "offline") return "#64748b";
  return "#39f6c0";
}

export function nodeStatusColor(status: GridNodeStatus) {
  if (status === "critical") return "#ff2f5f";
  if (status === "overloaded") return "#ff7a1a";
  if (status === "loaded") return "#ffd447";
  if (status === "offline") return "#64748b";
  return "#42f59e";
}

export function nodeKindColor(kind: GridNodeKind) {
  if (kind === "datacenter") return "#22d3ee";
  if (kind === "battery") return "#a78bfa";
  if (kind === "hospital") return "#fb7185";
  if (kind === "solar") return "#facc15";
  if (kind === "wind") return "#7dd3fc";
  if (kind === "nuclear") return "#4ade80";
  if (kind === "interconnect") return "#f59e0b";
  if (kind === "ev") return "#fbbf24";
  if (kind === "industry") return "#94a3b8";
  return "#60a5fa";
}

import type {
  GridNode,
  GridNodeKind,
  GridNodeRole,
  GridNodeStatus,
  TransmissionLine,
  TransmissionLineStatus,
} from "@/game/network/networkTypes";
import type { ViewLayer } from "@/store/gameStore";

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

export function nodeRoleColor(role: GridNodeRole) {
  if (role === "producer") return "#34f5b0";
  if (role === "consumer") return "#ff6b5f";
  if (role === "storage") return "#a78bfa";
  return "#7df9ff";
}

type LayerNode = Pick<
  GridNode,
  "aiWorkloadIds" | "demandMw" | "kind" | "productionMw" | "role" | "status"
>;

type LayerLine = Pick<TransmissionLine, "status">;

function isAiNode(node: LayerNode) {
  return node.kind === "datacenter" || node.aiWorkloadIds.length > 0;
}

function isLowCarbonProducer(node: LayerNode) {
  return node.kind === "nuclear" || node.kind === "solar" || node.kind === "wind";
}

function isCarbonPressureNode(node: LayerNode) {
  return node.kind === "interconnect";
}

function isFlexibleDemandNode(node: LayerNode) {
  return node.kind === "industry" || node.kind === "ev";
}

export function nodeLayerColor(node: LayerNode, layer: ViewLayer) {
  if (node.status === "critical" || node.status === "overloaded" || node.status === "offline") {
    return nodeStatusColor(node.status);
  }

  if (layer === "ai") {
    if (isAiNode(node)) return "#22d3ee";
    if (node.kind === "battery") return "#a78bfa";
    return "#475569";
  }

  if (layer === "carbon") {
    if (isLowCarbonProducer(node)) return "#34f5b0";
    if (isCarbonPressureNode(node)) return "#f59e0b";
    if (isFlexibleDemandNode(node)) return "#ff7a1a";
    if (node.role === "consumer" && node.demandMw > node.productionMw) return "#ff7a1a";
    if (node.kind === "battery") return "#a78bfa";
    return "#60a5fa";
  }

  return node.status === "stable" ? nodeKindColor(node.kind) : nodeStatusColor(node.status);
}

export function nodeLayerDotColor(node: LayerNode, layer: ViewLayer) {
  if (layer === "grid") return nodeRoleColor(node.role);
  return nodeLayerColor(node, layer);
}

export function nodeLayerEmphasis(node: LayerNode, layer: ViewLayer) {
  if (layer === "grid") return 1;
  if (layer === "ai") return isAiNode(node) || node.kind === "battery" ? 1 : 0.38;
  if (isLowCarbonProducer(node) || isCarbonPressureNode(node) || isFlexibleDemandNode(node) || node.kind === "battery") return 1;
  return node.role === "consumer" ? 0.74 : 0.52;
}

export function nodeLayerLabelValue(node: LayerNode, layer: ViewLayer) {
  if (layer === "ai") {
    if (isAiNode(node)) return `${node.aiWorkloadIds.length} jobs`;
    return "";
  }

  if (layer === "carbon") {
    if (isLowCarbonProducer(node)) return "bas CO₂";
    if (node.kind === "interconnect") return "import";
    if (isFlexibleDemandNode(node)) return "flex";
    return "";
  }

  return undefined;
}

export function lineLayerColor(line: LayerLine, fromNode: LayerNode, toNode: LayerNode, layer: ViewLayer) {
  if (line.status === "critical" || line.status === "overloaded" || line.status === "offline") {
    return lineStatusColor(line.status);
  }

  if (layer === "ai") {
    return isAiNode(fromNode) || isAiNode(toNode) ? "#22d3ee" : "#36515c";
  }

  if (layer === "carbon") {
    if (fromNode.kind === "interconnect" || toNode.kind === "interconnect") return "#f59e0b";
    if (isLowCarbonProducer(fromNode) || isLowCarbonProducer(toNode)) return "#34f5b0";
    if (isFlexibleDemandNode(fromNode) || isFlexibleDemandNode(toNode)) return "#ff7a1a";
    return "#5b7080";
  }

  return lineStatusColor(line.status);
}

export function lineLayerEmphasis(line: LayerLine, fromNode: LayerNode, toNode: LayerNode, layer: ViewLayer) {
  if (layer === "grid" || line.status !== "stable") return 1;
  if (layer === "ai") return isAiNode(fromNode) || isAiNode(toNode) ? 1 : 0.32;
  if (
    isLowCarbonProducer(fromNode) ||
    isLowCarbonProducer(toNode) ||
    isCarbonPressureNode(fromNode) ||
    isCarbonPressureNode(toNode) ||
    isFlexibleDemandNode(fromNode) ||
    isFlexibleDemandNode(toNode)
  ) {
    return 1;
  }
  return 0.46;
}

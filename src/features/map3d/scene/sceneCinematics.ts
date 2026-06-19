import type {
  FranceGridSnapshot,
  GridNode,
  TransmissionLine,
} from "@/game/network/networkTypes";
import { getNodeOutageVisual } from "@/features/map3d/scene/nodeOutageVisuals";

export type SceneCinematicCueKind = "line" | "node";

export interface SceneCinematicCue {
  id: string;
  kind: SceneCinematicCueKind;
  target: [number, number, number];
  camera: [number, number, number];
  severity: number;
  shakeIntensity: number;
  color: string;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function lineStatusScore(line: TransmissionLine) {
  if (line.tripped || line.status === "offline") return 6.2;
  if (line.status === "critical") return 4.8;
  if (line.status === "overloaded") return 3.2;
  if (line.utilizationRatio >= 0.96) return 1.4;
  return 0;
}

function lineCue(
  line: TransmissionLine,
  fromNode: GridNode,
  toNode: GridNode,
): SceneCinematicCue & { score: number } {
  const x = (fromNode.position[0] + toNode.position[0]) / 2;
  const z = (fromNode.position[2] + toNode.position[2]) / 2;
  const overloadScore = Math.max(0, line.utilizationRatio - 1) * 1.4;
  const heatScore = Math.max(0, line.temperatureC - 85) / 55;
  const score = lineStatusScore(line) + overloadScore + heatScore + Math.min(1.2, line.tripCount * 0.35);
  const severity = clamp01(score / 7.5);

  return {
    id: line.id,
    kind: "line",
    target: [x, 0.24, z],
    camera: [x + 0.65, 4.35 - severity * 0.55, z + 3.45],
    severity,
    shakeIntensity: line.tripped || line.status === "offline" ? 0.09 + severity * 0.055 : severity * 0.035,
    color: line.tripped || line.status === "offline" || line.status === "critical" ? "#ff2f5f" : "#ff7a1a",
    score,
  };
}

function nodeCue(node: GridNode): SceneCinematicCue & { score: number } {
  const outage = getNodeOutageVisual(node);
  const criticalBoost = node.criticality === "critical" || node.kind === "hospital" ? 1.1 : 0;
  const statusBoost = node.status === "critical" ? 1.3 : node.status === "overloaded" ? 0.55 : 0;
  const score = outage.unservedRatio * 5.2 + criticalBoost + statusBoost;
  const severity = clamp01(score / 6.5);

  return {
    id: node.id,
    kind: "node",
    target: [node.position[0], 0.28, node.position[2]],
    camera: [node.position[0] + 0.35, 4.7 - severity * 0.45, node.position[2] + 3.95],
    severity,
    shakeIntensity: severity * 0.035,
    color: outage.alertColor,
    score,
  };
}

export function getSceneCinematicCue(snapshot: FranceGridSnapshot): SceneCinematicCue | undefined {
  const nodesById = new Map(snapshot.nodes.map((node) => [node.id, node]));
  const candidates: Array<SceneCinematicCue & { score: number }> = [];

  for (const line of snapshot.lines) {
    const baseScore = lineStatusScore(line);
    if (baseScore <= 0) continue;
    const fromNode = nodesById.get(line.fromNodeId);
    const toNode = nodesById.get(line.toNodeId);
    if (!fromNode || !toNode) continue;
    candidates.push(lineCue(line, fromNode, toNode));
  }

  for (const node of snapshot.nodes) {
    const outage = getNodeOutageVisual(node);
    if (outage.level === "normal" && node.status !== "critical") continue;
    candidates.push(nodeCue(node));
  }

  candidates.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const [best] = candidates;
  if (!best || best.score < 1.35) return undefined;

  return {
    id: best.id,
    kind: best.kind,
    target: best.target,
    camera: best.camera,
    severity: best.severity,
    shakeIntensity: best.shakeIntensity,
    color: best.color,
  };
}

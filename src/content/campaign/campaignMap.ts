import type { MissionDefinition } from "@/game/domain/missionDefinition";
import type { CampaignProgress } from "@/game/progression/campaignProgress";
import { isMissionUnlocked } from "@/game/progression/campaignProgress";

export type CampaignMapNodeStatus = "locked" | "available" | "completed";

export interface CampaignMapNode {
  id: string;
  index: number;
  medal?: string;
  status: CampaignMapNodeStatus;
  title: string;
  x: number;
  y: number;
  z: number;
}

export interface CampaignMapEdge {
  fromId: string;
  toId: string;
  unlocked: boolean;
}

const missionPositions: Record<string, [number, number]> = {
  "tutorial-microgrid": [12, 72],
  "paris-peak": [27, 45],
  "corsica-islanding": [42, 68],
  "atlantic-storm": [57, 36],
  "rhone-corridor": [70, 61],
  "sovereign-ai": [82, 47],
  "black-grid": [91, 28],
  "europe-2030": [96, 64],
};

function fallbackPosition(index: number, total: number): [number, number] {
  const t = total <= 1 ? 0 : index / (total - 1);
  return [12 + t * 80, 55 + Math.sin(t * Math.PI * 2) * 20];
}

function nodeElevation(status: CampaignMapNodeStatus, index: number) {
  const base = status === "completed" ? 34 : status === "available" ? 24 : 8;
  return base + index * 1.5;
}

export function getCampaignMap(missions: MissionDefinition[], progress: CampaignProgress) {
  const nodes: CampaignMapNode[] = missions.map((mission, index) => {
    const [x, y] = missionPositions[mission.id] ?? fallbackPosition(index, missions.length);
    const missionProgress = progress.missions[mission.id];
    const completed = missionProgress?.bestMedal !== undefined && missionProgress.bestMedal !== "none";
    const unlocked = isMissionUnlocked(progress, mission.id, mission.unlockAfter);
    return {
      id: mission.id,
      index,
      medal: missionProgress?.bestMedal,
      status: completed ? "completed" : unlocked ? "available" : "locked",
      title: mission.title,
      x,
      y,
      z: nodeElevation(completed ? "completed" : unlocked ? "available" : "locked", index),
    };
  });

  const statusById = new Map(nodes.map((node) => [node.id, node.status]));
  const edges: CampaignMapEdge[] = missions.slice(1).map((mission, index) => {
    const from = missions[index];
    return {
      fromId: from.id,
      toId: mission.id,
      unlocked: statusById.get(mission.id) !== "locked",
    };
  });

  return { edges, nodes };
}

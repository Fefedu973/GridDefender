import type { MissionMedal } from "@/game/domain/reward";

export interface MissionProgress {
  bestScore: number;
  bestMedal: MissionMedal;
  completedAt?: string;
}

export interface CampaignProgress {
  missions: Record<string, MissionProgress>;
  unlockedRewards: string[];
}

export const emptyCampaignProgress: CampaignProgress = {
  missions: {},
  unlockedRewards: [],
};

const medalRank: Record<MissionMedal, number> = {
  none: 0,
  bronze: 1,
  silver: 2,
  gold: 3,
};

export function betterMedal(a: MissionMedal, b: MissionMedal): MissionMedal {
  return medalRank[a] >= medalRank[b] ? a : b;
}

export function isMissionUnlocked(progress: CampaignProgress, missionId: string, unlockAfter?: string) {
  if (!unlockAfter) return true;
  return progress.missions[unlockAfter]?.bestMedal !== undefined && progress.missions[unlockAfter].bestMedal !== "none";
}

export function hasUnlockedReward(progress: CampaignProgress, rewardId?: string) {
  if (!rewardId) return true;
  return progress.unlockedRewards.includes(rewardId);
}

export function normalizeCampaignProgress(progress: Partial<CampaignProgress>): CampaignProgress {
  return {
    missions: progress.missions ?? {},
    unlockedRewards: progress.unlockedRewards ?? [],
  };
}

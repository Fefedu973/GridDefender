import type { MissionMedal } from "@/game/domain/reward";
import type { GameState } from "@/game/types";

export interface MedalThresholds {
  bronze: number;
  silver: number;
  gold: number;
}

export function medalForScore(score: number, thresholds: MedalThresholds): MissionMedal {
  if (score >= thresholds.gold) return "gold";
  if (score >= thresholds.silver) return "silver";
  if (score >= thresholds.bronze) return "bronze";
  return "none";
}

export function medalForMissionRun(
  run: Pick<GameState, "cumulative"> & { outcome?: { score: number } },
  thresholds: MedalThresholds,
): MissionMedal {
  const medal = medalForScore(run.outcome?.score ?? 0, thresholds);
  if (medal === "gold" && run.cumulative.athenaAutopilotUses > 0) return "silver";
  return medal;
}

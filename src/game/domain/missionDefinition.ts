import type { Scenario } from "@/game/types";

export interface MissionDefinition {
  id: string;
  mapId: string;
  title: string;
  subtitle: string;
  unlockAfter?: string;
  newMechanic: string;
  scenario: Scenario;
  medalThresholds: {
    bronze: number;
    silver: number;
    gold: number;
  };
}

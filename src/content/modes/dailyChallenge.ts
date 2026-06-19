import { getMapDefinition } from "@/content/maps/mapRegistry";
import { buildRandomScenario } from "@/content/scenarioBuilder/scenarioBuilder";
import type { Scenario } from "@/game/types";

export interface DailyChallenge {
  seed: string;
  scenario: Scenario;
  mapName: string;
  label: string;
}

export function dailyChallengeSeed(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function getDailyChallenge(date = new Date()): DailyChallenge {
  const seed = dailyChallengeSeed(date);
  const scenario = buildRandomScenario(seed, "daily-challenge");
  const map = getMapDefinition(scenario.mapId);
  return {
    seed,
    scenario,
    mapName: map.name,
    label: `${map.name} · ${scenario.difficulty}`,
  };
}

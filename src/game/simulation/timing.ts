import type { Scenario } from "@/game/types";

export const DEFAULT_TICK_INTERVAL_MS = 4500;

export function estimatedMissionSeconds(
  scenario: Pick<Scenario, "startMinute" | "endMinute" | "tickMinutes">,
  speed = 1,
) {
  const ticks = Math.ceil((scenario.endMinute - scenario.startMinute) / Math.max(1, scenario.tickMinutes));
  return (ticks * DEFAULT_TICK_INTERVAL_MS) / Math.max(0.01, speed) / 1000;
}

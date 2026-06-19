import type { PlayerActionType, Scenario } from "@/game/types";

export function isActionAvailableForScenario(
  scenario: Pick<Scenario, "availableActions">,
  action: PlayerActionType,
): boolean {
  return !scenario.availableActions || scenario.availableActions.includes(action);
}

export function isActionAvailable(state: { scenario: Pick<Scenario, "availableActions"> }, action: PlayerActionType): boolean {
  return isActionAvailableForScenario(state.scenario, action);
}

export function filterAvailableActions<T extends PlayerActionType>(
  state: { scenario: Pick<Scenario, "availableActions"> },
  actions: T[],
): T[] {
  return actions.filter((action) => isActionAvailable(state, action));
}

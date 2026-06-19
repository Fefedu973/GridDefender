import { getActionDefinition } from "@/game/actions";
import type { PlayerActionType, PlayerCommand, Scenario } from "@/game/types";

export function getCommandCost(
  actionOrCommand: PlayerActionType | PlayerCommand,
  scenario?: Pick<Scenario, "commandCostAdjustments">,
) {
  const command = typeof actionOrCommand === "string" ? { action: actionOrCommand } : actionOrCommand;
  const definition = getActionDefinition(command.action);
  const adjustedBaseCost = Math.max(
    0,
    (definition?.commandCost ?? 0) + (scenario?.commandCostAdjustments?.[command.action] ?? 0),
  );
  return adjustedBaseCost + (command.source === "athena" ? 5 : 0);
}

export function getCommandCooldown(action: PlayerActionType) {
  return getActionDefinition(action)?.cooldownMinutes ?? 0;
}

export function getDefaultCommandDuration(action: PlayerActionType) {
  return getActionDefinition(action)?.defaultDurationMinutes ?? 20;
}

export function getDefaultCommandIntensity(action: PlayerActionType) {
  return getActionDefinition(action)?.defaultIntensityMw ?? 0;
}

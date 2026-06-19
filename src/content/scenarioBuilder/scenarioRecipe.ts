import { getMapDefinition } from "@/content/maps/mapRegistry";
import type { Scenario } from "@/game/types";
import { formatClock } from "@/lib/format";

export interface ScenarioRecipeEvent {
  id: string;
  time: string;
  title: string;
  severity: Scenario["events"][number]["severity"];
  source: string;
  intel: "known" | "forecast" | "hidden";
}

export interface ScenarioRecipe {
  id: string;
  title: string;
  mode: NonNullable<Scenario["runMode"]> | "campaign";
  mapName: string;
  difficulty: Scenario["difficulty"];
  seed?: string;
  timeWindow: string;
  durationMinutes: number;
  commandCapacity: number;
  availableActionCount: number;
  objectiveCount: number;
  eventCount: number;
  knownEventCount: number;
  forecastEventCount: number;
  hiddenEventCount: number;
  primaryEvents: ScenarioRecipeEvent[];
  recipeText: string;
}

export function buildScenarioRecipe(scenario: Scenario): ScenarioRecipe {
  const map = getMapDefinition(scenario.mapId);
  const durationMinutes = scenario.endMinute - scenario.startMinute;
  const knownEventIds = new Set(scenario.knownEventIds);
  const forecastEventIds = new Set(scenario.forecastEventIds ?? []);
  const primaryEvents = scenario.events.slice(0, 5).map((event) => ({
    id: event.id,
    time: formatClock(event.minute),
    title: event.title,
    severity: event.severity,
    source: event.source ?? "grid",
    intel: knownEventIds.has(event.id)
      ? "known" as const
      : forecastEventIds.has(event.id)
        ? "forecast" as const
        : "hidden" as const,
  }));
  const knownEventCount = scenario.events.filter((event) => knownEventIds.has(event.id)).length;
  const forecastEventCount = scenario.events.filter((event) => !knownEventIds.has(event.id) && forecastEventIds.has(event.id)).length;
  const hiddenEventCount = scenario.events.length - knownEventCount - forecastEventCount;
  const mode = scenario.runMode ?? "campaign";
  const timeWindow = `${formatClock(scenario.startMinute)}-${formatClock(scenario.endMinute)}`;
  const availableActionCount = scenario.availableActions?.length ?? 14;
  const title = `${scenario.name} · ${map.name}`;
  const recipeLines = [
    `Scenario: ${scenario.id}`,
    `Mode: ${mode}`,
    `Carte: ${map.name}`,
    `Difficulte: ${scenario.difficulty}`,
    scenario.seed ? `Seed: ${scenario.seed}` : undefined,
    `Fenêtre : ${timeWindow} (${durationMinutes} min)`,
    `Capacité : ${scenario.commandCapacity} CP`,
    `Outils: ${availableActionCount}`,
    `Objectifs: ${scenario.objectiveChecks.length}`,
    `Evenements: ${scenario.events.length} (${knownEventCount} annonces, ${forecastEventCount} previsions, ${hiddenEventCount} masques)`,
    ...primaryEvents.map(
      (event) => `- ${event.time} [${event.source}/${event.severity}/${event.intel}] ${event.title}`,
    ),
  ].filter((line): line is string => Boolean(line));

  return {
    id: scenario.id,
    title,
    mode,
    mapName: map.name,
    difficulty: scenario.difficulty,
    seed: scenario.seed,
    timeWindow,
    durationMinutes,
    commandCapacity: scenario.commandCapacity,
    availableActionCount,
    objectiveCount: scenario.objectiveChecks.length,
    eventCount: scenario.events.length,
    knownEventCount,
    forecastEventCount,
    hiddenEventCount,
    primaryEvents,
    recipeText: recipeLines.join("\n"),
  };
}

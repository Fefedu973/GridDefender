import type { Scenario, ScenarioEvent } from "@/game/types";

export type TimelineIntelLevel = "known" | "forecast" | "hidden";

export interface TimelineEventIntel {
  level: TimelineIntelLevel;
  markerMinute: number;
  windowStartMinute?: number;
  windowEndMinute?: number;
  title: string;
  description: string;
}

const forecastHorizonByDifficulty: Record<Scenario["difficulty"], number> = {
  tutorial: 999,
  standard: 30,
  hard: 20,
  expert: 10,
};

function clampMinute(minute: number, scenario: Scenario) {
  return Math.min(scenario.endMinute, Math.max(scenario.startMinute, minute));
}

function forecastWindow(scenario: Scenario, event: ScenarioEvent): TimelineEventIntel {
  const telemetry = scenario.telemetry;
  const telemetryDegraded = telemetry?.mode === "degraded" || telemetry?.mode === "blackout";
  const halfWindow = Math.max(scenario.tickMinutes, scenario.difficulty === "expert" ? 5 : 10);

  return {
    level: "forecast",
    markerMinute: clampMinute(event.minute, scenario),
    windowStartMinute: clampMinute(event.minute - halfWindow, scenario),
    windowEndMinute: clampMinute(event.minute + halfWindow, scenario),
    title: telemetryDegraded
      ? event.severity === "critical"
        ? "Incident fantôme probable"
        : "Écho télémétrie"
      : event.severity === "critical"
        ? "Incident probable"
        : "Signal incertain",
    description: telemetryDegraded ? "Données incomplètes : heure et cible incertaines." : "Renseignement ATHENA incomplet.",
  };
}

export function getTimelineEventIntel(
  scenario: Scenario,
  event: ScenarioEvent,
  currentMinute: number,
  triggeredEventIds: string[],
): TimelineEventIntel {
  const known = scenario.knownEventIds.includes(event.id) || triggeredEventIds.includes(event.id);
  if (known) {
    return {
      level: "known",
      markerMinute: event.minute,
      title: event.title,
      description: event.description,
    };
  }

  if (scenario.forecastEventIds?.includes(event.id)) {
    return forecastWindow(scenario, event);
  }

  const telemetry = scenario.telemetry;
  const telemetryDegraded = telemetry?.mode === "degraded" || telemetry?.mode === "blackout";
  const forecastHorizon = telemetry?.forecastHorizonMinutes ?? forecastHorizonByDifficulty[scenario.difficulty];
  if (event.minute - currentMinute > forecastHorizon) {
    return {
      level: "hidden",
      markerMinute: event.minute,
      title: telemetry?.mode === "blackout" ? "Télémétrie noire" : "Signal masqué",
      description: telemetryDegraded
        ? "ATHENA reçoit des données partielles : événement masqué jusqu'au dernier moment."
        : "ATHENA n'a pas encore assez de télémétrie pour annoncer cet événement.",
    };
  }

  return forecastWindow(scenario, event);
}

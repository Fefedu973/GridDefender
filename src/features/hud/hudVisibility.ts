import type { SelectedEntity } from "@/game/network/networkTypes";
import type { GameState, Scenario } from "@/game/types";

export type HudRailMetric =
  | "criticalContinuity"
  | "aiProductivity"
  | "sovereignty"
  | "carbon"
  | "cost"
  | "publicSatisfaction"
  | "batteryLevel";

export type HudTopBarChip =
  | "stability"
  | "aiProductivity"
  | "carbon"
  | "sovereignty"
  | "reserve"
  | "capacity"
  | "athena";

export type HudVisibilityProfile = {
  railMetrics: HudRailMetric[];
  topBarChips: HudTopBarChip[];
  showMapLegend: boolean;
  showTelemetry: boolean;
  enableJobsPanel: boolean;
};

type ViewLayerLike = "grid" | "ai" | "carbon";

const fullRail: HudRailMetric[] = [
  "criticalContinuity",
  "aiProductivity",
  "sovereignty",
  "carbon",
  "cost",
  "publicSatisfaction",
  "batteryLevel",
];

const fullTopBar: HudTopBarChip[] = [
  "stability",
  "aiProductivity",
  "carbon",
  "sovereignty",
  "reserve",
  "capacity",
  "athena",
];

const missionProfiles: Record<string, HudVisibilityProfile> = {
  "tutorial-microgrid": {
    railMetrics: ["criticalContinuity", "batteryLevel"],
    topBarChips: ["stability", "reserve", "capacity"],
    showMapLegend: false,
    showTelemetry: false,
    enableJobsPanel: true,
  },
  "paris-peak": {
    railMetrics: ["criticalContinuity", "aiProductivity", "batteryLevel"],
    topBarChips: ["stability", "aiProductivity", "reserve", "capacity", "athena"],
    showMapLegend: true,
    showTelemetry: true,
    enableJobsPanel: true,
  },
  "corsica-islanding": {
    railMetrics: ["criticalContinuity", "aiProductivity", "carbon", "cost", "batteryLevel"],
    topBarChips: ["stability", "aiProductivity", "carbon", "reserve", "capacity", "athena"],
    showMapLegend: true,
    showTelemetry: true,
    enableJobsPanel: true,
  },
  "atlantic-storm": {
    railMetrics: ["criticalContinuity", "aiProductivity", "carbon", "cost", "publicSatisfaction", "batteryLevel"],
    topBarChips: ["stability", "aiProductivity", "carbon", "reserve", "capacity", "athena"],
    showMapLegend: true,
    showTelemetry: true,
    enableJobsPanel: true,
  },
};

export function getHudVisibilityProfile(scenario: Pick<Scenario, "id" | "difficulty" | "telemetry">): HudVisibilityProfile {
  const missionProfile = missionProfiles[scenario.id];
  if (missionProfile) return missionProfile;

  if (scenario.difficulty === "expert") {
    return {
      railMetrics: fullRail,
      topBarChips: fullTopBar,
      showMapLegend: true,
      showTelemetry: true,
      enableJobsPanel: true,
    };
  }

  if (scenario.difficulty === "hard") {
    return {
      railMetrics: ["criticalContinuity", "aiProductivity", "sovereignty", "carbon", "cost", "publicSatisfaction", "batteryLevel"],
      topBarChips: ["stability", "aiProductivity", "carbon", "sovereignty", "reserve", "capacity", "athena"],
      showMapLegend: true,
      showTelemetry: true,
      enableJobsPanel: true,
    };
  }

  return {
    railMetrics: ["criticalContinuity", "aiProductivity", "carbon", "batteryLevel"],
    topBarChips: ["stability", "aiProductivity", "reserve", "capacity", "athena"],
    showMapLegend: true,
    showTelemetry: scenario.telemetry?.mode !== "nominal",
    enableJobsPanel: true,
  };
}

function selectedDatacenter(game: GameState, selectedEntity: SelectedEntity | undefined) {
  if (selectedEntity?.kind !== "node") return false;
  return game.grid.nodes.some((node) => node.id === selectedEntity.id && node.kind === "datacenter");
}

function hasTriggeredAiEvent(game: GameState) {
  return game.triggeredEventIds.some((id) => id.includes("job") || id.includes("agent"));
}

export function shouldShowJobsPanel(
  game: GameState,
  selectedEntity: SelectedEntity | undefined,
  viewLayer: ViewLayerLike,
) {
  const profile = getHudVisibilityProfile(game.scenario);
  if (!profile.enableJobsPanel) return false;

  return (
    viewLayer === "ai" ||
    selectedEntity?.kind === "workload" ||
    selectedDatacenter(game, selectedEntity) ||
    game.flags.cyberPriority ||
    game.flags.agentLoop ||
    hasTriggeredAiEvent(game)
  );
}


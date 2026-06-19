import {
  buildScenarioFromTemplate,
  type DemandPreset,
  type IncidentPreset,
  scenarioTemplates,
  type ScenarioBuilderTemplate,
  type WeatherPreset,
} from "@/content/scenarioBuilder/scenarioBuilder";
import type { Scenario } from "@/game/types";

export interface SandboxOptions {
  mapId: string;
  difficulty: ScenarioBuilderTemplate["difficulty"];
  weather: WeatherPreset;
  demand: DemandPreset;
  incident: IncidentPreset;
  startMinute: number;
  durationMinutes: number;
  seed: string;
}

export interface SandboxPreset {
  id: string;
  label: string;
  description: string;
  seed: string;
  scenario: Scenario;
}

export const defaultSandboxOptions: SandboxOptions = {
  mapId: "france-national",
  difficulty: "standard",
  weather: "clear",
  demand: "balanced",
  incident: "none",
  startMinute: 18 * 60,
  durationMinutes: 180,
  seed: "sandbox-custom",
};

export function buildSandboxScenario(options: SandboxOptions): Scenario {
  const template = scenarioTemplates[0];
  return buildScenarioFromTemplate(
    {
      ...template,
      id: "sandbox-custom",
      label: "Sandbox personnalisé",
      mapId: options.mapId,
      difficulty: options.difficulty,
      weather: options.weather,
      demand: options.demand,
      incident: options.incident,
      revealPolicy: "forecast",
      startMinute: options.startMinute,
      durationMinutes: options.durationMinutes,
    },
    {
      seed: options.seed.trim() || defaultSandboxOptions.seed,
      title: "Sandbox · personnalisé",
      runMode: "sandbox",
    },
  );
}

export function getSandboxPresets(): SandboxPreset[] {
  const [paris, storm, rhone] = scenarioTemplates;
  return [
    {
      id: "sandbox-balanced",
      label: "Sandbox équilibré",
      description: "Pic maîtrisable pour tester les commandes sans forte pénalité.",
      seed: "sandbox-balanced",
      scenario: buildScenarioFromTemplate(paris, {
        seed: "sandbox-balanced",
        title: "Sandbox · équilibré",
        runMode: "sandbox",
      }),
    },
    {
      id: "sandbox-storm",
      label: "Sandbox tempête",
      description: "Ligne ouest vulnérable, météo dure et réparation prioritaire.",
      seed: "sandbox-storm",
      scenario: buildScenarioFromTemplate(storm, {
        seed: "sandbox-storm",
        title: "Sandbox · tempête",
        runMode: "sandbox",
      }),
    },
    {
      id: "sandbox-expert",
      label: "Sandbox expert",
      description: "Couloir Rhône, industrie haute et peu de capacité opérationnelle.",
      seed: "sandbox-expert",
      scenario: buildScenarioFromTemplate(rhone, {
        seed: "sandbox-expert",
        title: "Sandbox · expert",
        runMode: "sandbox",
      }),
    },
  ];
}

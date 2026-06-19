import { eveningPeakScenario } from "@/game/scenarios/eveningPeak";
import { createSeededRandom, pickSeeded, seededInt } from "@/game/random/seeded";
import type { Scenario, ScenarioEvent } from "@/game/types";

export type WeatherPreset = "clear" | "solar-drop" | "storm";
export type DemandPreset = "balanced" | "ev-heavy" | "ai-surge" | "industry-peak";
export type IncidentPreset = "none" | "west-line-trip" | "rhone-congestion" | "hidden-cyber";

export interface ScenarioBuilderTemplate {
  id: string;
  label: string;
  mapId: string;
  difficulty: Scenario["difficulty"];
  startMinute: number;
  durationMinutes: number;
  commandCapacity: number;
  weather: WeatherPreset;
  demand: DemandPreset;
  incident: IncidentPreset;
  revealPolicy: "known" | "forecast" | "hidden";
}

export interface ScenarioBuildOptions {
  seed: string;
  title?: string;
  runMode?: Scenario["runMode"];
}

export const scenarioTemplates: ScenarioBuilderTemplate[] = [
  {
    id: "builder-paris-peak",
    label: "Pic IDF",
    mapId: "france-national",
    difficulty: "standard",
    startMinute: 18 * 60,
    durationMinutes: 150,
    commandCapacity: 98,
    weather: "solar-drop",
    demand: "ev-heavy",
    incident: "hidden-cyber",
    revealPolicy: "forecast",
  },
  {
    id: "builder-atlantic-storm",
    label: "Tempête Atlantique",
    mapId: "france-national",
    difficulty: "hard",
    startMinute: 17 * 60 + 45,
    durationMinutes: 165,
    commandCapacity: 92,
    weather: "storm",
    demand: "balanced",
    incident: "west-line-trip",
    revealPolicy: "hidden",
  },
  {
    id: "builder-rhone-corridor",
    label: "Couloir Rhône",
    mapId: "france-national",
    difficulty: "expert",
    startMinute: 18 * 60 + 10,
    durationMinutes: 160,
    commandCapacity: 86,
    weather: "solar-drop",
    demand: "industry-peak",
    incident: "rhone-congestion",
    revealPolicy: "forecast",
  },
];

function cloneScenario(scenario: Scenario): Scenario {
  return JSON.parse(JSON.stringify(scenario)) as Scenario;
}

function cloneEvents(events: ScenarioEvent[]) {
  return events.map((event) => ({ ...event, effects: event.effects ? [...event.effects] : undefined }));
}

function jitterEvents(events: ScenarioEvent[], seed: string, startMinute: number, endMinute: number) {
  const random = createSeededRandom(seed);
  return events.map((event) => ({
    ...event,
    minute: Math.min(endMinute - 10, Math.max(startMinute + 10, event.minute + seededInt(-5, 5, random))),
  }));
}

function knownEventIdsForPolicy(events: ScenarioEvent[], policy: ScenarioBuilderTemplate["revealPolicy"]) {
  if (policy === "known") return events.map((event) => event.id);
  return [];
}

function forecastEventIdsForPolicy(events: ScenarioEvent[], policy: ScenarioBuilderTemplate["revealPolicy"]) {
  if (policy !== "forecast") return [];
  return events.map((event) => event.id);
}

function buildWeatherEvents(template: ScenarioBuilderTemplate, seed: string, startMinute: number): ScenarioEvent[] {
  if (template.weather === "clear") return [];
  const minute = startMinute + seededInt(35, 60, createSeededRandom(`${seed}:weather`));
  return [
    {
      id: `${template.id}-weather`,
      minute,
      title: template.weather === "storm" ? "Front orageux" : "Chute solaire rapide",
      description:
        template.weather === "storm"
          ? "La production ouest devient instable et une ligne peut sortir du service."
          : "Le solaire baisse plus vite que prévu pendant la pointe du soir.",
      severity: template.weather === "storm" ? "critical" : "warning",
      source: "weather",
      effects: [
        { type: "set_flag", flag: "solarDrop", value: true },
        { type: "set_flag", flag: "residentialPeak", value: true },
      ],
      resolvesWhen: [{ type: "stability_above", threshold: 54, flag: "solarDrop" }],
    },
  ];
}

function buildIncidentEvents(template: ScenarioBuilderTemplate, seed: string, startMinute: number): ScenarioEvent[] {
  const random = createSeededRandom(`${seed}:incident`);
  const minute = startMinute + seededInt(50, 95, random);

  if (template.incident === "west-line-trip") {
    return [
      {
        id: `${template.id}-line-trip`,
        minute,
        title: "Panne ligne ouest",
        description: "Un corridor Atlantique tombe. Les flux doivent être reroutés ou la ligne réparée.",
        severity: "critical",
        source: "grid",
        effects: [{ type: "trip_line", lineId: pickSeeded(["atlantic-bordeaux", "atlantic-centre"], random) }],
      },
    ];
  }

  if (template.incident === "rhone-congestion") {
    return [
      {
        id: `${template.id}-rhone`,
        minute,
        title: "Congestion couloir Rhône",
        description: "Le couloir sud-est chauffe pendant que l'industrie garde une demande élevée.",
        severity: "warning",
        source: "grid",
        effects: [{ type: "set_flag", flag: "residentialPeak", value: true }],
        resolvesWhen: [{ type: "stability_above", threshold: 58 }],
      },
    ];
  }

  if (template.incident === "hidden-cyber") {
    return [
      {
        id: `${template.id}-cyber`,
        minute,
        title: "Détection cyber prioritaire",
        description: "Un job critique doit rester local et terminer avant la fin de la mission.",
        severity: "critical",
        source: "ai",
        effects: [
          { type: "set_flag", flag: "cyberPriority", value: true },
          { type: "activate_ai_job", jobId: "cyber-critical" },
        ],
        resolvesWhen: [{ type: "job_status", jobId: "cyber-critical", statuses: ["completed"] }],
      },
    ];
  }

  return [];
}

function applyDemandPreset(scenario: Scenario, preset: DemandPreset) {
  if (preset === "ai-surge") {
    scenario.aiJobs = scenario.aiJobs.map((job) => ({
      ...job,
      basePowerMw: job.criticality === "critical" ? job.basePowerMw : Math.round(job.basePowerMw * 1.12),
      startMinute: Math.max(scenario.startMinute + 10, job.startMinute - 10),
    }));
  }

  if (preset === "ev-heavy") {
    scenario.events = scenario.events.map((event) =>
      event.id === "ev-surge" ? { ...event, minute: Math.max(scenario.startMinute + 15, event.minute - 10) } : event,
    );
    scenario.initialMetrics.publicSatisfaction = Math.max(40, scenario.initialMetrics.publicSatisfaction - 4);
  }

  if (preset === "industry-peak") {
    scenario.initialMetrics.cost = Math.max(45, scenario.initialMetrics.cost - 5);
    scenario.initialMetrics.stability = Math.max(45, scenario.initialMetrics.stability - 4);
  }
}

export function buildScenarioFromTemplate(
  template: ScenarioBuilderTemplate,
  options: ScenarioBuildOptions,
): Scenario {
  const scenario = cloneScenario(eveningPeakScenario);
  const endMinute = template.startMinute + template.durationMinutes;
  const baseEvents = cloneEvents(eveningPeakScenario.events).filter((event) => {
    if (template.demand !== "ev-heavy" && event.id === "ev-surge") return false;
    if (template.weather !== "solar-drop" && event.id === "solar-drop") return false;
    return true;
  });

  scenario.id = `${template.id}-${options.seed}`;
  scenario.mapId = template.mapId;
  scenario.runMode = options.runMode;
  scenario.seed = options.seed;
  scenario.difficulty = template.difficulty;
  scenario.name = options.title ?? template.label;
  scenario.subtitle = `Seed ${options.seed} · ${template.weather} · ${template.demand}`;
  scenario.startMinute = template.startMinute;
  scenario.endMinute = endMinute;
  scenario.commandCapacity = template.commandCapacity;
  scenario.events = jitterEvents(
    [...baseEvents, ...buildWeatherEvents(template, options.seed, template.startMinute), ...buildIncidentEvents(template, options.seed, template.startMinute)],
    options.seed,
    template.startMinute,
    endMinute,
  ).sort((a, b) => a.minute - b.minute);
  scenario.knownEventIds = knownEventIdsForPolicy(scenario.events, template.revealPolicy);
  scenario.forecastEventIds = forecastEventIdsForPolicy(scenario.events, template.revealPolicy);
  scenario.rewards = [];
  applyDemandPreset(scenario, template.demand);
  return scenario;
}

export function buildRandomScenario(seed: string, runMode?: Scenario["runMode"]): Scenario {
  const random = createSeededRandom(seed);
  const template = pickSeeded(scenarioTemplates, random);
  return buildScenarioFromTemplate(template, { seed, title: `Challenge ${seed}`, runMode });
}

import { buildRandomScenario } from "@/content/scenarioBuilder/scenarioBuilder";
import type { IncidentSource, PlayerActionType, Scenario } from "@/game/types";

export interface CrisisDoctrine {
  id: string;
  label: string;
  description: string;
  effect: {
    commandCostAdjustments?: Partial<Record<PlayerActionType, number>>;
    commandCapacityBonus?: number;
    stabilityBonus?: number;
    batteryBonus?: number;
    costBonus?: number;
    sovereigntyBonus?: number;
    publicSatisfactionBonus?: number;
    knownEventSources?: IncidentSource[];
    eventDelayBySource?: Partial<Record<IncidentSource, number>>;
  };
}

export interface CrisisRunWave {
  index: number;
  scenario: Scenario;
}

export const crisisRunDoctrines: CrisisDoctrine[] = [
  {
    id: "distributed-cache",
    label: "Cache IA distribué",
    description: "Les jobs répétitifs coûtent moins de capacité opérationnelle.",
    effect: {
      commandCapacityBonus: 6,
      commandCostAdjustments: {
        activate_cache: -4,
        agent_timeout: -2,
      },
    },
  },
  {
    id: "battery-reserve",
    label: "Réserve batterie",
    description: "La vague suivante démarre avec plus de stockage disponible.",
    effect: {
      batteryBonus: 12,
      commandCostAdjustments: {
        discharge_battery: -3,
      },
    },
  },
  {
    id: "weather-forecast",
    label: "Prévision météo",
    description: "Les événements météo sont mieux anticipés et légèrement retardés.",
    effect: {
      stabilityBonus: 5,
      knownEventSources: ["weather"],
      eventDelayBySource: { weather: 5 },
    },
  },
  {
    id: "ev-flex-contracts",
    label: "Contrats EV flexibles",
    description: "Le lissage des recharges devient moins coûteux socialement et opérationnellement.",
    effect: {
      commandCapacityBonus: 6,
      publicSatisfactionBonus: 5,
      commandCostAdjustments: {
        smart_ev: -4,
      },
    },
  },
  {
    id: "interconnect-broker",
    label: "Courtier interconnexion",
    description: "Les achats externes sont mieux négociés, avec moins de pénalité économique.",
    effect: {
      costBonus: 8,
      sovereigntyBonus: 3,
    },
  },
  {
    id: "line-hardening",
    label: "Protection de ligne",
    description: "Les actions réseau coûtent moins et les incidents grille laissent plus de temps.",
    effect: {
      stabilityBonus: 2,
      commandCostAdjustments: {
        reroute_line: -3,
        repair_line: -5,
        authorize_overload: -4,
      },
      eventDelayBySource: { grid: 8 },
    },
  },
];

export function buildCrisisRun(seed: string): CrisisRunWave[] {
  return [1, 2, 3].map((index) => {
    const scenario = buildRandomScenario(`${seed}:wave-${index}`, "crisis-run");
    scenario.id = `crisis-run-${seed}-wave-${index}`;
    scenario.seed = seed;
    scenario.runMode = "crisis-run";
    scenario.name = `Crisis Run · vague ${index}`;
    scenario.tickMinutes = 4;
    scenario.commandCapacity = Math.max(70, scenario.commandCapacity - (index - 1) * 8);
    scenario.initialMetrics.stability = Math.max(45, scenario.initialMetrics.stability - (index - 1) * 6);
    return { index, scenario };
  });
}

export function parseCrisisRunScenarioId(scenarioId: string) {
  const match = /^crisis-run-(.+)-wave-(\d+)$/.exec(scenarioId);
  if (!match) return undefined;
  return {
    seed: match[1],
    waveIndex: Number(match[2]),
  };
}

export function applyCrisisDoctrine(scenario: Scenario, doctrine: CrisisDoctrine): Scenario {
  const next = JSON.parse(JSON.stringify(scenario)) as Scenario;
  next.commandCapacity += doctrine.effect.commandCapacityBonus ?? 0;
  next.commandCostAdjustments = mergeCommandCostAdjustments(
    next.commandCostAdjustments,
    doctrine.effect.commandCostAdjustments,
  );
  next.initialMetrics.stability = Math.min(
    100,
    next.initialMetrics.stability + (doctrine.effect.stabilityBonus ?? 0),
  );
  next.initialMetrics.batteryLevel = Math.min(
    100,
    next.initialMetrics.batteryLevel + (doctrine.effect.batteryBonus ?? 0),
  );
  next.initialMetrics.cost = Math.min(100, next.initialMetrics.cost + (doctrine.effect.costBonus ?? 0));
  next.initialMetrics.sovereignty = Math.min(
    100,
    next.initialMetrics.sovereignty + (doctrine.effect.sovereigntyBonus ?? 0),
  );
  next.initialMetrics.publicSatisfaction = Math.min(
    100,
    next.initialMetrics.publicSatisfaction + (doctrine.effect.publicSatisfactionBonus ?? 0),
  );
  next.knownEventIds = revealEventSources(next, doctrine.effect.knownEventSources);
  next.events = delayEventsBySource(next, doctrine.effect.eventDelayBySource);
  next.subtitle = `${next.subtitle} · Doctrine ${doctrine.label}`;
  return next;
}

function mergeCommandCostAdjustments(
  existing: Scenario["commandCostAdjustments"],
  additions: Scenario["commandCostAdjustments"],
): Scenario["commandCostAdjustments"] {
  if (!additions) return existing;
  const next = { ...(existing ?? {}) };
  for (const [action, adjustment] of Object.entries(additions) as Array<[PlayerActionType, number]>) {
    next[action] = (next[action] ?? 0) + adjustment;
  }
  return next;
}

function revealEventSources(scenario: Scenario, sources: IncidentSource[] | undefined): string[] {
  if (!sources?.length) return scenario.knownEventIds;
  const sourceSet = new Set(sources);
  return [
    ...new Set([
      ...scenario.knownEventIds,
      ...scenario.events
        .filter((event) => event.source && sourceSet.has(event.source))
        .map((event) => event.id),
    ]),
  ];
}

function delayEventsBySource(
  scenario: Scenario,
  delayBySource: Partial<Record<IncidentSource, number>> | undefined,
): Scenario["events"] {
  if (!delayBySource) return scenario.events;
  const latestMinute = Math.max(scenario.startMinute + scenario.tickMinutes, scenario.endMinute - scenario.tickMinutes);
  return scenario.events
    .map((event) => {
      const delay = event.source ? delayBySource[event.source] ?? 0 : 0;
      if (delay <= 0) return event;
      return {
        ...event,
        minute: Math.min(latestMinute, event.minute + delay),
      };
    })
    .sort((a, b) => a.minute - b.minute);
}

export function nextCrisisRunWave(currentScenarioId: string, doctrine: CrisisDoctrine): Scenario | undefined {
  const parsed = parseCrisisRunScenarioId(currentScenarioId);
  if (!parsed || parsed.waveIndex >= 3) return undefined;
  const nextWave = buildCrisisRun(parsed.seed).find((wave) => wave.index === parsed.waveIndex + 1);
  return nextWave ? applyCrisisDoctrine(nextWave.scenario, doctrine) : undefined;
}

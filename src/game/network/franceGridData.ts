import { getMapDefinition } from "@/content/maps/mapRegistry";
import type { PlayerActionType } from "@/game/types";
import type { GridNode, GridRuntime, TransmissionLine } from "@/game/network/networkTypes";
import { projectLonLat } from "@/features/map3d/geo/franceGeo";
import { round } from "@/lib/math";

// Small deterministic nudges (in world units) keep dense regions legible while
// preserving their real geography: IDF, Centre and Rhône-Alpes otherwise stack.
// Purely visual layout — not simulation input.
const NODE_OFFSETS: Record<string, [number, number]> = {
  "normandy-production": [-0.18, -0.04],
  "paris-saclay-ai": [-0.46, 0.22],
  "idf-hospital": [0.36, -0.13],
  "interconnect-north": [0.42, -0.22],
  "atlantic-wind": [-0.16, -0.04],
  "bordeaux-ev": [-0.06, 0.08],
  "southwest-solar": [0.22, 0.18],
  "centre-battery": [0.05, -0.08],
  "rhone-production": [-0.62, -0.2],
  "lyon-industry": [0.05, 0.32],
  "grenoble-ai-edge": [0.45, 0.42],
  "marseille-load": [0.12, 0.06],
};

const MAP_POSITION_OVERRIDES: Record<string, Record<string, [number, number, number]>> = {
  "vivatech-campus": {
    "normandy-production": [-1.55, 0, -0.9],
    "interconnect-north": [-0.55, 0, -1.15],
    "paris-saclay-ai": [-0.25, 0, -0.3],
    "idf-hospital": [0.55, 0, -0.35],
    "centre-battery": [0.85, 0, 0.4],
    "bordeaux-ev": [-1.05, 0, 0.35],
    "atlantic-wind": [-1.75, 0, 0.1],
    "southwest-solar": [-0.45, 0, 0.95],
    "rhone-production": [0.55, 0, 1.05],
    "lyon-industry": [1.35, 0, 0.65],
    "grenoble-ai-edge": [1.55, 0, -0.05],
    "marseille-load": [0.2, 0, 1.55],
  },
  "corsica-island": {
    "normandy-production": [-0.85, 0, -1.65],
    "interconnect-north": [-0.35, 0, -1.1],
    "paris-saclay-ai": [0.15, 0, -0.65],
    "idf-hospital": [0.7, 0, -0.85],
    "centre-battery": [0.25, 0, 0.05],
    "bordeaux-ev": [-0.55, 0, 0.15],
    "atlantic-wind": [-0.95, 0, 0.75],
    "southwest-solar": [-0.25, 0, 0.95],
    "rhone-production": [0.55, 0, 0.85],
    "lyon-industry": [0.9, 0, 0.25],
    "grenoble-ai-edge": [1.05, 0, -0.25],
    "marseille-load": [0.15, 0, 1.55],
  },
  "rhone-corridor": {
    "interconnect-north": [-1.25, 0, -1.2],
    "paris-saclay-ai": [-0.75, 0, -1.25],
    "centre-battery": [-0.35, 0, -0.25],
    "bordeaux-ev": [-1.05, 0, 0.45],
    "southwest-solar": [-0.5, 0, 0.95],
    "rhone-production": [0.4, 0, 0.55],
    "lyon-industry": [0.75, 0, -0.1],
    "grenoble-ai-edge": [1.28, 0, 0.42],
    "marseille-load": [0.65, 0, 1.38],
  },
};

type NodeOverride = Partial<
  Pick<
    GridNode,
    | "label"
    | "region"
    | "maxProductionMw"
    | "maxDemandMw"
    | "flexibilityMw"
    | "criticality"
    | "runtime"
    | "description"
  >
>;

type LineOverride = Partial<
  Pick<TransmissionLine, "nominalCapacityMw" | "capacityMw" | "isCritical" | "isControllable" | "susceptance">
>;

const MAP_NODE_OVERRIDES: Record<string, Record<string, NodeOverride>> = {
  "vivatech-campus": {
    "normandy-production": {
      label: "Arrivée réseau",
      region: "Hall VivaTech",
      maxProductionMw: 95,
      runtime: {
        production: { baseMw: 78 },
        demand: { baseMw: 0 },
      },
      description: "Arrivée réseau principale du microgrid de démonstration.",
    },
    "paris-saclay-ai": {
      label: "Datacenter Stand",
      region: "Hall VivaTech",
      maxDemandMw: 64,
      description: "Compute local du stand, utile mais limité pour un tutoriel compact.",
    },
    "idf-hospital": {
      label: "Service critique",
      region: "Hall VivaTech",
      maxDemandMw: 28,
      description: "Charge critique fictive du tutoriel. Elle ne doit jamais être délestée.",
    },
    "centre-battery": {
      label: "Batterie stand",
      region: "Hall VivaTech",
      maxProductionMw: 52,
      flexibilityMw: 52,
    },
    "bordeaux-ev": {
      label: "Bornes demo EV",
      region: "Hall VivaTech",
      maxDemandMw: 58,
      runtime: {
        demand: {
          baseMw: 22,
          floorMw: 8,
          flagAdditions: [{ flag: "evSurge", mw: 22 }],
          minuteAdditions: [{ fromMinute: 18 * 60 + 35, mw: 8 }],
          effectReductionAction: "smart_ev",
        },
      },
    },
    "atlantic-wind": {
      label: "Eolien demo",
      region: "Hall VivaTech",
      maxProductionMw: 30,
    },
    "southwest-solar": {
      label: "Solaire toiture",
      region: "Hall VivaTech",
      maxProductionMw: 38,
      runtime: {
        production: { solarCapacityMw: 22, solarDropFactor: 0.42 },
        demand: { baseMw: 0 },
      },
    },
    "rhone-production": {
      label: "Groupe secours",
      region: "Hall VivaTech",
      maxProductionMw: 58,
      runtime: {
        production: { effectAction: "thermal_backup" },
        demand: { baseMw: 0 },
      },
    },
  },
  "corsica-island": {
    "interconnect-north": {
      label: "Câble continent",
      region: "Interconnexion Corse",
      maxProductionMw: 64,
      description: "Interconnexion unique : utile, mais contrainte et politiquement sensible.",
    },
    "centre-battery": {
      label: "Stockage île",
      region: "Corse",
      maxProductionMw: 58,
      flexibilityMw: 58,
      criticality: "critical",
    },
    "paris-saclay-ai": {
      label: "Datacenter Bastia",
      region: "Corse",
      maxDemandMw: 72,
      runtime: {
        demand: { baseMw: 8, assignedAi: true },
      },
    },
    "idf-hospital": {
      label: "Centre hospitalier île",
      region: "Corse",
      maxDemandMw: 28,
      runtime: {
        demand: { baseMw: 16 },
      },
    },
    "bordeaux-ev": {
      label: "Recharge littorale",
      region: "Corse",
      maxDemandMw: 48,
      runtime: {
        demand: {
          baseMw: 14,
          floorMw: 5,
          flagAdditions: [{ flag: "evSurge", mw: 14 }],
          minuteAdditions: [{ fromMinute: 18 * 60 + 35, mw: 5 }],
          effectReductionAction: "smart_ev",
        },
      },
    },
    "southwest-solar": {
      label: "Solaire Corse",
      region: "Corse",
      maxProductionMw: 52,
      runtime: {
        production: { solarCapacityMw: 34, solarDropFactor: 0.42 },
        demand: { baseMw: 0 },
      },
    },
    "atlantic-wind": {
      label: "Vent littoral",
      region: "Corse",
      maxProductionMw: 24,
    },
    "rhone-production": {
      label: "Groupe pilotable",
      region: "Corse",
      maxProductionMw: 74,
      runtime: {
        production: {
          baseMw: 96,
          effectAction: "thermal_backup",
          stabilityBoost: { below: 48, mw: 4 },
        },
        demand: { baseMw: 0 },
      },
    },
    "lyon-industry": {
      label: "Port industriel",
      region: "Corse",
      maxDemandMw: 48,
      runtime: {
        demand: {
          baseMw: 28,
          floorMw: 16,
          effectReductionAction: "curtail_industry",
          effectTargetId: "lyon-industry",
        },
      },
    },
    "marseille-load": {
      label: "Ajaccio",
      region: "Corse",
      maxDemandMw: 70,
      runtime: {
        demand: {
          baseMw: 28,
          progressionMw: 9,
          flagAdditions: [{ flag: "residentialPeak", mw: 6 }],
        },
      },
    },
    "grenoble-ai-edge": {
      label: "Edge Ajaccio",
      region: "Corse",
      maxDemandMw: 46,
      runtime: {
        demand: { baseMw: 10, assignedAi: true },
      },
    },
  },
  "europe-2030": {
    "interconnect-north": {
      label: "Interconnexion Europe Nord",
      region: "Couloir européen",
      maxProductionMw: 104,
      flexibilityMw: 82,
      runtime: {
        production: { baseMw: 0, effectAction: "import_energy" },
      },
      description: "Solidarité européenne disponible, mais coûteuse en souveraineté et en prix spot.",
    },
    "atlantic-wind": {
      label: "Eolien Atlantique renforcé",
      region: "Façade Atlantique",
      maxProductionMw: 58,
      runtime: {
        production: {
          baseMw: 26,
          floorMw: 10,
          waveMw: 7,
          wavePeriodMinutes: 16,
          flagPenalties: [{ flag: "solarDrop", mw: 4 }],
        },
        demand: { baseMw: 0 },
      },
    },
    "rhone-production": {
      label: "Rhône Pilotable",
      region: "Couloir Rhône-Alpes",
      maxProductionMw: 122,
      runtime: {
        production: {
          baseMw: 84,
          effectAction: "thermal_backup",
          stabilityBoost: { below: 44, mw: 8 },
        },
        demand: { baseMw: 0 },
      },
    },
    "lyon-industry": {
      label: "Industrie européenne",
      region: "Auvergne-Rhône-Alpes",
      maxDemandMw: 78,
      runtime: {
        demand: {
          baseMw: 42,
          progressionMw: 16,
          floorMw: 22,
          flagAdditions: [{ flag: "residentialPeak", mw: 8 }],
          effectReductionAction: "curtail_industry",
          effectTargetId: "lyon-industry",
        },
      },
    },
  },
  "rhone-corridor": {
    "interconnect-north": {
      label: "Interconnexion Nord-Est",
      region: "Couloir européen",
      maxProductionMw: 92,
      flexibilityMw: 66,
      runtime: {
        production: { baseMw: 32, effectAction: "import_energy" },
      },
      description: "Appui d'import régional, utile mais à coût économique et souverain.",
    },
    "paris-saclay-ai": {
      label: "Poste Nord-Est",
      region: "Bourgogne-Franche-Comté",
      maxDemandMw: 54,
      runtime: {
        demand: { baseMw: 8, assignedAi: true },
      },
      description: "Point d'entrée nord du couloir. Les charges IA doivent rester modestes ici.",
    },
    "centre-battery": {
      label: "Batterie Besançon",
      region: "Bourgogne-Franche-Comté",
      maxProductionMw: 62,
      flexibilityMw: 62,
      criticality: "high",
    },
    "bordeaux-ev": {
      label: "Recharge A7",
      region: "Vallée du Rhône",
      maxDemandMw: 56,
      runtime: {
        demand: {
          baseMw: 18,
          floorMw: 7,
          flagAdditions: [{ flag: "evSurge", mw: 16 }],
          minuteAdditions: [{ fromMinute: 18 * 60 + 40, mw: 9 }],
          effectReductionAction: "smart_ev",
        },
      },
    },
    "southwest-solar": {
      label: "Solaire Sud-Est",
      region: "Drôme-Provence",
      maxProductionMw: 58,
      runtime: {
        production: { solarCapacityMw: 38, solarDropFactor: 0.4 },
        demand: { baseMw: 0 },
      },
    },
    "rhone-production": {
      label: "Rhône Production",
      region: "Auvergne-Rhône-Alpes",
      maxProductionMw: 132,
      runtime: {
        production: {
          baseMw: 118,
          effectAction: "thermal_backup",
          stabilityBoost: { below: 46, mw: 7 },
        },
        demand: { baseMw: 0 },
      },
    },
    "lyon-industry": {
      label: "Industrie Lyon",
      region: "Auvergne-Rhône-Alpes",
      maxDemandMw: 78,
      flexibilityMw: 34,
      runtime: {
        demand: {
          baseMw: 40,
          progressionMw: 10,
          floorMw: 24,
          flagAdditions: [{ flag: "residentialPeak", mw: 10 }],
          effectReductionAction: "curtail_industry",
          effectTargetId: "lyon-industry",
        },
      },
      description: "Site industriel stratégique : flexible, mais coûteux à effacer trop longtemps.",
    },
    "grenoble-ai-edge": {
      label: "Grenoble IA Edge",
      region: "Alpes",
      maxDemandMw: 58,
      runtime: {
        demand: { baseMw: 12, assignedAi: true },
      },
    },
    "marseille-load": {
      label: "PACA résidentiel",
      region: "PACA",
      maxDemandMw: 76,
      runtime: {
        demand: {
          baseMw: 30,
          progressionMw: 8,
          flagAdditions: [{ flag: "residentialPeak", mw: 10 }],
        },
      },
    },
  },
};

const MAP_LINE_OVERRIDES: Record<string, Record<string, LineOverride>> = {
  "vivatech-campus": {
    "normandy-paris": { nominalCapacityMw: 50, capacityMw: 50, isCritical: true, susceptance: 3.2 },
    "paris-hospital": { nominalCapacityMw: 38, capacityMw: 38, isCritical: true, isControllable: false, susceptance: 2.2 },
    "paris-centre-battery": { nominalCapacityMw: 60, capacityMw: 60, isCritical: true, susceptance: 3.5 },
    "atlantic-bordeaux": { nominalCapacityMw: 42, capacityMw: 42, susceptance: 2.0 },
    "bordeaux-centre": { nominalCapacityMw: 48, capacityMw: 48, susceptance: 2.4 },
    "centre-lyon": { nominalCapacityMw: 50, capacityMw: 50, susceptance: 2.3 },
    "lyon-marseille": { nominalCapacityMw: 54, capacityMw: 54, isCritical: false, susceptance: 2.4 },
  },
  "corsica-island": {
    "normandy-interconnect": { nominalCapacityMw: 46, capacityMw: 46, isCritical: true, susceptance: 1.7 },
    "interconnect-paris": { nominalCapacityMw: 58, capacityMw: 58, isCritical: true, susceptance: 1.6 },
    "paris-centre-battery": { nominalCapacityMw: 72, capacityMw: 72, isCritical: true, susceptance: 2.1 },
    "bordeaux-centre": { nominalCapacityMw: 78, capacityMw: 78, susceptance: 2.0 },
    "atlantic-centre": { nominalCapacityMw: 38, capacityMw: 38, susceptance: 1.4 },
    "solar-rhone": { nominalCapacityMw: 88, capacityMw: 88, susceptance: 1.8 },
    "lyon-marseille": { nominalCapacityMw: 64, capacityMw: 64, isCritical: true, susceptance: 2.0 },
    "rhone-grenoble-edge": { nominalCapacityMw: 46, capacityMw: 46, susceptance: 1.5 },
  },
  "europe-2030": {
    "normandy-paris": { nominalCapacityMw: 82, capacityMw: 82, isCritical: true, susceptance: 2.4 },
    "normandy-interconnect": { nominalCapacityMw: 50, capacityMw: 50, isCritical: true, susceptance: 1.9 },
    "interconnect-paris": { nominalCapacityMw: 54, capacityMw: 54, isCritical: true, susceptance: 1.7 },
    "atlantic-centre": { nominalCapacityMw: 42, capacityMw: 42, susceptance: 1.4 },
    "bordeaux-centre": { nominalCapacityMw: 60, capacityMw: 60, susceptance: 2.0 },
    "centre-lyon": { nominalCapacityMw: 68, capacityMw: 68, isCritical: true, susceptance: 2.0 },
    "paris-lyon": { nominalCapacityMw: 70, capacityMw: 70, isCritical: true, susceptance: 1.9 },
    "lyon-marseille": { nominalCapacityMw: 58, capacityMw: 58, isCritical: true, susceptance: 1.8 },
    "bordeaux-toulouse": { nominalCapacityMw: 90, capacityMw: 90, susceptance: 1.9 },
    "solar-rhone": { nominalCapacityMw: 92, capacityMw: 92, susceptance: 1.8 },
    "rhone-grenoble-edge": { nominalCapacityMw: 50, capacityMw: 50, susceptance: 1.4 },
  },
  "rhone-corridor": {
    "interconnect-paris": { nominalCapacityMw: 64, capacityMw: 64, isCritical: true, susceptance: 1.7 },
    "paris-lyon": { nominalCapacityMw: 70, capacityMw: 70, isCritical: true, susceptance: 1.8 },
    "paris-centre-battery": { nominalCapacityMw: 58, capacityMw: 58, isCritical: true, susceptance: 2.0 },
    "bordeaux-centre": { nominalCapacityMw: 90, capacityMw: 90, susceptance: 1.7 },
    "bordeaux-toulouse": { nominalCapacityMw: 112, capacityMw: 112, susceptance: 1.7 },
    "solar-rhone": { nominalCapacityMw: 112, capacityMw: 112, isCritical: true, susceptance: 1.7 },
    "centre-lyon": { nominalCapacityMw: 76, capacityMw: 76, isCritical: true, susceptance: 1.8 },
    "lyon-marseille": { nominalCapacityMw: 66, capacityMw: 66, isCritical: true, susceptance: 1.8 },
    "rhone-grenoble-edge": { nominalCapacityMw: 56, capacityMw: 56, susceptance: 1.4 },
  },
};

/** Live, per-tick fields are derived by the engine, so seeds omit them. */
type NodeSeed = Omit<GridNode, "position" | "servedProductionMw" | "servedDemandMw">;

const NODE_SEEDS: NodeSeed[] = [
  {
    id: "normandy-production",
    label: "Normandie",
    kind: "nuclear",
    role: "producer",
    labelMode: "always",
    region: "Normandie",
    lat: 49.4,
    lon: 0.2,
    productionMw: 92,
    demandMw: 16,
    maxProductionMw: 130,
    maxDemandMw: 34,
    flexibilityMw: 8,
    criticality: "high",
    status: "stable",
    connectedLineIds: ["normandy-paris", "normandy-interconnect"],
    aiWorkloadIds: [],
    runtime: {
      production: { baseMw: 82 },
      demand: { baseMw: 0 },
    },
    description: "Socle bas carbone qui alimente fortement l'Île-de-France.",
  },
  {
    id: "paris-saclay-ai",
    label: "Paris-Saclay IA",
    kind: "datacenter",
    role: "consumer",
    labelMode: "always",
    region: "Île-de-France",
    lat: 48.7,
    lon: 2.1,
    productionMw: 0,
    demandMw: 24,
    maxProductionMw: 0,
    maxDemandMw: 95,
    flexibilityMw: 42,
    criticality: "critical",
    status: "loaded",
    connectedLineIds: ["normandy-paris", "paris-lyon", "paris-centre-battery"],
    aiWorkloadIds: ["assistant-public", "dev-agent", "video-demo", "cyber-critical", "looping-agent"],
    organization: {
      name: "SovereignAI Cloud",
      contract: "critical",
      minCurtailmentMinutes: 10,
      maxCurtailmentMinutes: 25,
      reductionCost: 8,
      reputationRisk: 72,
      satisfaction: 72,
    },
    runtime: {
      demand: { baseMw: 18, assignedAi: true },
    },
    description: "Datacenter IA souverain. Sa charge est flexible sauf pour les jobs cyber critiques.",
  },
  {
    id: "idf-hospital",
    label: "Hôpital IDF",
    kind: "hospital",
    role: "consumer",
    labelMode: "always",
    region: "Île-de-France",
    lat: 48.85,
    lon: 2.35,
    productionMw: 0,
    demandMw: 24,
    maxProductionMw: 0,
    maxDemandMw: 36,
    flexibilityMw: 0,
    criticality: "critical",
    status: "stable",
    connectedLineIds: ["paris-hospital"],
    aiWorkloadIds: [],
    organization: {
      name: "AP-HP Urgence",
      contract: "critical",
      minCurtailmentMinutes: 0,
      maxCurtailmentMinutes: 0,
      reductionCost: 999,
      reputationRisk: 100,
      satisfaction: 96,
    },
    runtime: {
      demand: { baseMw: 24 },
    },
    description: "Charge prioritaire. Le réseau doit la préserver pendant toute la crise.",
  },
  {
    id: "interconnect-north",
    label: "Interconnexion Nord",
    kind: "interconnect",
    role: "connector",
    labelMode: "always",
    region: "Nord",
    lat: 50.5,
    lon: 3.1,
    productionMw: 0,
    demandMw: 0,
    maxProductionMw: 70,
    maxDemandMw: 0,
    flexibilityMw: 55,
    criticality: "medium",
    status: "stable",
    connectedLineIds: ["normandy-interconnect", "interconnect-paris"],
    aiWorkloadIds: [],
    runtime: {
      production: { effectAction: "import_energy" },
    },
    description: "Import possible mais pénalisant pour le coût et la souveraineté.",
  },
  {
    id: "atlantic-wind",
    label: "Eolien Atlantique",
    kind: "wind",
    role: "producer",
    labelMode: "always",
    region: "Atlantique",
    lat: 47.1,
    lon: -2.7,
    productionMw: 18,
    demandMw: 5,
    maxProductionMw: 44,
    maxDemandMw: 16,
    flexibilityMw: 4,
    criticality: "medium",
    status: "stable",
    connectedLineIds: ["atlantic-bordeaux", "atlantic-centre"],
    aiWorkloadIds: [],
    runtime: {
      production: {
        baseMw: 20,
        floorMw: 8,
        waveMw: 4,
        wavePeriodMinutes: 18,
        flagPenalties: [{ flag: "solarDrop", mw: 1.5 }],
      },
      demand: { baseMw: 0 },
    },
    description: "Production variable qui peut soulager le Sud-Ouest quand le vent tient.",
  },
  {
    id: "bordeaux-ev",
    label: "Bordeaux EV",
    kind: "ev",
    role: "consumer",
    labelMode: "always",
    region: "Nouvelle-Aquitaine",
    lat: 44.84,
    lon: -0.58,
    productionMw: 0,
    demandMw: 28,
    maxProductionMw: 0,
    maxDemandMw: 72,
    flexibilityMw: 30,
    criticality: "medium",
    status: "loaded",
    connectedLineIds: ["atlantic-bordeaux", "bordeaux-toulouse", "bordeaux-centre"],
    aiWorkloadIds: [],
    organization: {
      name: "Métropole Recharge",
      contract: "flexible",
      minCurtailmentMinutes: 20,
      maxCurtailmentMinutes: 90,
      reductionCost: 2,
      reputationRisk: 24,
      satisfaction: 78,
    },
    runtime: {
      demand: {
        baseMw: 22,
        floorMw: 8,
        flagAdditions: [{ flag: "evSurge", mw: 22 }],
        minuteAdditions: [{ fromMinute: 18 * 60 + 35, mw: 8 }],
        effectReductionAction: "smart_ev",
      },
    },
    description: "Zone résidentielle et recharge EV. Très flexible si le lissage démarre tôt.",
  },
  {
    id: "southwest-solar",
    label: "Solaire Sud-Ouest",
    kind: "solar",
    role: "producer",
    labelMode: "always",
    region: "Occitanie",
    lat: 43.6,
    lon: 1.44,
    productionMw: 28,
    demandMw: 8,
    maxProductionMw: 60,
    maxDemandMw: 20,
    flexibilityMw: 4,
    criticality: "medium",
    status: "stable",
    connectedLineIds: ["bordeaux-toulouse", "solar-rhone"],
    aiWorkloadIds: [],
    runtime: {
      production: { solarCapacityMw: 30, solarDropFactor: 0.42 },
      demand: { baseMw: 0 },
    },
    description: "Production solaire forte en journée, très sensible à la chute de 18h50.",
  },
  {
    id: "rhone-production",
    label: "Rhône Production",
    kind: "nuclear",
    role: "producer",
    labelMode: "always",
    region: "Auvergne-Rhône-Alpes",
    lat: 45.7,
    lon: 4.8,
    productionMw: 76,
    demandMw: 18,
    maxProductionMw: 108,
    maxDemandMw: 44,
    flexibilityMw: 12,
    criticality: "high",
    status: "stable",
    connectedLineIds: ["paris-lyon", "solar-rhone", "lyon-marseille", "rhone-grenoble-edge"],
    aiWorkloadIds: [],
    runtime: {
      production: {
        baseMw: 62,
        effectAction: "thermal_backup",
        stabilityBoost: { below: 48, mw: 6 },
      },
      demand: { baseMw: 0 },
    },
    description: "Production pilotable bas carbone du couloir Rhône.",
  },
  {
    id: "lyon-industry",
    label: "Lyon Industrie",
    kind: "industry",
    role: "consumer",
    labelMode: "auto",
    region: "Auvergne-Rhône-Alpes",
    lat: 45.76,
    lon: 4.84,
    productionMw: 0,
    demandMw: 44,
    maxProductionMw: 0,
    maxDemandMw: 70,
    flexibilityMw: 18,
    criticality: "high",
    status: "loaded",
    connectedLineIds: ["paris-lyon", "lyon-marseille", "centre-lyon"],
    aiWorkloadIds: [],
    organization: {
      name: "Industrie Lyonnaise",
      contract: "market",
      minCurtailmentMinutes: 20,
      maxCurtailmentMinutes: 45,
      reductionCost: 7,
      reputationRisk: 46,
      satisfaction: 62,
    },
    runtime: {
      demand: {
        baseMw: 44,
        floorMw: 22,
        effectReductionAction: "curtail_industry",
        effectTargetId: "lyon-industry",
      },
    },
    description: "Industrie stratégique, partiellement flexible mais coûteuse à réduire.",
  },
  {
    id: "marseille-load",
    label: "Marseille",
    kind: "city",
    role: "consumer",
    labelMode: "auto",
    region: "PACA",
    lat: 43.3,
    lon: 5.37,
    productionMw: 0,
    demandMw: 48,
    maxProductionMw: 0,
    maxDemandMw: 82,
    flexibilityMw: 14,
    criticality: "medium",
    status: "loaded",
    connectedLineIds: ["lyon-marseille"],
    aiWorkloadIds: [],
    organization: {
      name: "Régie Marseille",
      contract: "public",
      minCurtailmentMinutes: 15,
      maxCurtailmentMinutes: 35,
      reductionCost: 3,
      reputationRisk: 38,
      satisfaction: 70,
    },
    runtime: {
      demand: {
        baseMw: 40,
        progressionMw: 14,
        flagAdditions: [{ flag: "residentialPeak", mw: 8 }],
      },
    },
    description: "Demande urbaine du soir, peu flexible hors sobriété légère.",
  },
  {
    id: "centre-battery",
    label: "Batterie Est",
    kind: "battery",
    role: "storage",
    labelMode: "always",
    region: "Bourgogne-Franche-Comte",
    lat: 47.24,
    lon: 6.02,
    productionMw: 0,
    demandMw: 0,
    maxProductionMw: 46,
    maxDemandMw: 0,
    flexibilityMw: 46,
    criticality: "high",
    status: "stable",
    connectedLineIds: ["paris-centre-battery", "bordeaux-centre", "centre-lyon", "atlantic-centre"],
    aiWorkloadIds: [],
    organization: {
      name: "BatteryOps Est",
      contract: "flexible",
      minCurtailmentMinutes: 10,
      maxCurtailmentMinutes: 60,
      reductionCost: 4,
      reputationRisk: 12,
      satisfaction: 82,
    },
    runtime: {
      production: { effectAction: "discharge_battery" },
      storageLevel: true,
    },
    description: "Réserve tactique positionnée à l'est. Très utile pour refroidir les lignes en surcharge.",
  },
  {
    id: "grenoble-ai-edge",
    label: "Grenoble IA Edge",
    kind: "datacenter",
    role: "consumer",
    labelMode: "always",
    region: "Alpes",
    lat: 45.18,
    lon: 5.72,
    productionMw: 0,
    demandMw: 16,
    maxProductionMw: 0,
    maxDemandMw: 54,
    flexibilityMw: 24,
    criticality: "medium",
    status: "stable",
    connectedLineIds: ["rhone-grenoble-edge"],
    aiWorkloadIds: [],
    organization: {
      name: "Alpine Edge Labs",
      contract: "flexible",
      minCurtailmentMinutes: 20,
      maxCurtailmentMinutes: 60,
      reductionCost: 5,
      reputationRisk: 34,
      satisfaction: 74,
    },
    runtime: {
      demand: { baseMw: 14, assignedAi: true },
    },
    description: "Datacenter IA secondaire, utile pour déplacer des charges non critiques.",
  },
];

type LineSeed = {
  id: string;
  label: string;
  fromNodeId: string;
  toNodeId: string;
  voltageKv: number;
  capacityMw: number;
  visualBend?: number;
  isControllable: boolean;
  isCritical: boolean;
  incidentIds: string[];
  actions: PlayerActionType[];
};

const LINE_SEEDS: LineSeed[] = [
  {
    id: "normandy-paris",
    label: "Normandie -> Paris-Saclay",
    fromNodeId: "normandy-production",
    toNodeId: "paris-saclay-ai",
    voltageKv: 400,
    capacityMw: 64,
    visualBend: 0.12,
    isControllable: true,
    isCritical: true,
    incidentIds: ["video-job", "ev-surge"],
    actions: ["defer_ai", "migrate_ai", "activate_cache", "smart_ev", "discharge_battery", "authorize_overload"],
  },
  {
    id: "paris-hospital",
    label: "Paris-Saclay -> Hôpital IDF",
    fromNodeId: "paris-saclay-ai",
    toNodeId: "idf-hospital",
    voltageKv: 225,
    capacityMw: 58,
    visualBend: -0.05,
    isControllable: false,
    isCritical: true,
    incidentIds: ["cyber-job"],
    actions: ["discharge_battery", "import_energy", "authorize_overload"],
  },
  {
    id: "interconnect-paris",
    label: "Interconnexion Nord -> Paris",
    fromNodeId: "interconnect-north",
    toNodeId: "paris-saclay-ai",
    voltageKv: 400,
    capacityMw: 90,
    visualBend: -0.12,
    isControllable: true,
    isCritical: false,
    incidentIds: [],
    actions: ["import_energy", "reroute_line"],
  },
  {
    id: "normandy-interconnect",
    label: "Normandie -> Interconnexion Nord",
    fromNodeId: "normandy-production",
    toNodeId: "interconnect-north",
    voltageKv: 400,
    capacityMw: 100,
    visualBend: 0.08,
    isControllable: true,
    isCritical: false,
    incidentIds: [],
    actions: ["import_energy", "reroute_line"],
  },
  {
    id: "paris-lyon",
    label: "Paris -> Lyon",
    fromNodeId: "paris-saclay-ai",
    toNodeId: "lyon-industry",
    voltageKv: 400,
    capacityMw: 130,
    visualBend: 0.2,
    isControllable: true,
    isCritical: true,
    incidentIds: ["solar-drop"],
    actions: ["discharge_battery", "defer_ai", "curtail_industry", "thermal_backup", "authorize_overload"],
  },
  {
    id: "atlantic-bordeaux",
    label: "Atlantique -> Bordeaux EV",
    fromNodeId: "atlantic-wind",
    toNodeId: "bordeaux-ev",
    voltageKv: 225,
    capacityMw: 78,
    visualBend: -0.08,
    isControllable: true,
    isCritical: false,
    incidentIds: ["ev-surge"],
    actions: ["smart_ev", "discharge_battery", "reroute_line"],
  },
  {
    id: "bordeaux-toulouse",
    label: "Bordeaux -> Sud-Ouest Solaire",
    fromNodeId: "bordeaux-ev",
    toNodeId: "southwest-solar",
    voltageKv: 225,
    capacityMw: 82,
    visualBend: -0.13,
    isControllable: true,
    isCritical: false,
    incidentIds: ["ev-surge", "solar-drop"],
    actions: ["smart_ev", "discharge_battery", "reroute_line"],
  },
  {
    id: "bordeaux-centre",
    label: "Bordeaux -> Batterie Est",
    fromNodeId: "bordeaux-ev",
    toNodeId: "centre-battery",
    voltageKv: 400,
    capacityMw: 105,
    visualBend: 0.18,
    isControllable: true,
    isCritical: false,
    incidentIds: ["ev-surge"],
    actions: ["smart_ev", "discharge_battery", "reroute_line"],
  },
  {
    id: "atlantic-centre",
    label: "Atlantique -> Batterie Est",
    fromNodeId: "atlantic-wind",
    toNodeId: "centre-battery",
    voltageKv: 225,
    capacityMw: 86,
    visualBend: 0.16,
    isControllable: true,
    isCritical: false,
    incidentIds: [],
    actions: ["discharge_battery", "reroute_line"],
  },
  {
    id: "paris-centre-battery",
    label: "Batterie Est -> Paris",
    fromNodeId: "centre-battery",
    toNodeId: "paris-saclay-ai",
    voltageKv: 400,
    capacityMw: 118,
    visualBend: -0.16,
    isControllable: true,
    isCritical: true,
    incidentIds: ["video-job", "solar-drop"],
    actions: ["discharge_battery", "defer_ai", "migrate_ai", "activate_cache", "authorize_overload"],
  },
  {
    id: "centre-lyon",
    label: "Batterie Est -> Lyon",
    fromNodeId: "centre-battery",
    toNodeId: "lyon-industry",
    voltageKv: 400,
    capacityMw: 108,
    visualBend: 0.14,
    isControllable: true,
    isCritical: false,
    incidentIds: ["solar-drop"],
    actions: ["discharge_battery", "curtail_industry", "thermal_backup", "reroute_line"],
  },
  {
    id: "solar-rhone",
    label: "Sud-Ouest -> Rhône",
    fromNodeId: "southwest-solar",
    toNodeId: "rhone-production",
    voltageKv: 225,
    capacityMw: 82,
    visualBend: -0.18,
    isControllable: true,
    isCritical: false,
    incidentIds: ["solar-drop"],
    actions: ["thermal_backup", "reroute_line"],
  },
  {
    id: "lyon-marseille",
    label: "Lyon -> Marseille",
    fromNodeId: "lyon-industry",
    toNodeId: "marseille-load",
    voltageKv: 400,
    capacityMw: 120,
    visualBend: 0.12,
    isControllable: true,
    isCritical: true,
    incidentIds: ["solar-drop"],
    actions: ["thermal_backup", "discharge_battery", "curtail_industry", "authorize_overload"],
  },
  {
    id: "rhone-grenoble-edge",
    label: "Rhône -> Grenoble IA Edge",
    fromNodeId: "rhone-production",
    toNodeId: "grenoble-ai-edge",
    voltageKv: 225,
    capacityMw: 72,
    isControllable: true,
    isCritical: false,
    incidentIds: ["agent-loop"],
    actions: ["defer_ai", "migrate_ai", "reduce_model", "activate_cache", "discharge_battery", "authorize_overload"],
  },
];

function nodeWorldPosition(node: NodeSeed, mapId?: string): [number, number, number] {
  const override = mapId ? MAP_POSITION_OVERRIDES[mapId]?.[node.id] : undefined;
  if (override) return override;

  const [x, z] = projectLonLat([node.lon, node.lat]);
  const offset = NODE_OFFSETS[node.id] ?? [0, 0];
  return [round(x + offset[0], 3), 0, round(z + offset[1], 3)];
}

function createNode(seed: NodeSeed, mapId?: string): GridNode {
  const override = mapId ? MAP_NODE_OVERRIDES[mapId]?.[seed.id] : undefined;
  return {
    ...seed,
    ...override,
    position: nodeWorldPosition(seed, mapId),
    servedProductionMw: seed.productionMw,
    servedDemandMw: seed.demandMw,
  };
}

function createLine(seed: LineSeed, mapId?: string): TransmissionLine {
  const override = mapId ? MAP_LINE_OVERRIDES[mapId]?.[seed.id] : undefined;
  const base: TransmissionLine = {
    ...seed,
    nominalCapacityMw: seed.capacityMw,
    signedFlowMw: 0,
    currentFlowMw: 0,
    utilizationRatio: 0,
    status: "stable",
    // Susceptance from voltage class, deliberately decoupled from thermal
    // capacity (as in a real grid). Flow distributes by electrical topology, so
    // a lower-capacity corridor on a busy path genuinely congests.
    susceptance: seed.voltageKv / 100,
    temperatureC: 20,
    overloadDuration: 0,
    utilizationHistory: [],
    tripped: false,
    protectionState: "closed",
    tripCount: 0,
    causes: [],
  };

  return {
    ...base,
    ...override,
    capacityMw: override?.capacityMw ?? override?.nominalCapacityMw ?? base.capacityMw,
    nominalCapacityMw: override?.nominalCapacityMw ?? base.nominalCapacityMw,
  };
}

function activeNodeSeeds(mapId?: string) {
  const activeIds = mapId ? getMapDefinition(mapId).nodeIds : undefined;
  if (!activeIds) return NODE_SEEDS;
  const active = new Set(activeIds);
  return NODE_SEEDS.filter((seed) => active.has(seed.id));
}

function activeLineSeeds(mapId: string | undefined, nodeIds: Set<string>) {
  const activeIds = mapId ? getMapDefinition(mapId).lineIds : undefined;
  const lineSeeds = activeIds ? LINE_SEEDS.filter((seed) => activeIds.includes(seed.id)) : LINE_SEEDS;
  return lineSeeds.filter((seed) => nodeIds.has(seed.fromNodeId) && nodeIds.has(seed.toNodeId));
}

function connectNodesToActiveLines(nodes: GridNode[], lines: TransmissionLine[]) {
  const lineIdsByNode = new Map<string, string[]>();
  for (const node of nodes) lineIdsByNode.set(node.id, []);
  for (const line of lines) {
    lineIdsByNode.get(line.fromNodeId)?.push(line.id);
    lineIdsByNode.get(line.toNodeId)?.push(line.id);
  }
  return nodes.map((node) => ({
    ...node,
    connectedLineIds: lineIdsByNode.get(node.id) ?? [],
  }));
}

/** Fresh, unsolved grid runtime. Call solveGridTick once to populate flows. */
export function createInitialGrid(mapId?: string): GridRuntime {
  const nodeSeeds = activeNodeSeeds(mapId);
  const nodeIds = new Set(nodeSeeds.map((seed) => seed.id));
  const lineSeeds = activeLineSeeds(mapId, nodeIds);
  const lines = lineSeeds.map((seed) => createLine(seed, mapId));
  const nodes = connectNodesToActiveLines(
    nodeSeeds.map((seed) => createNode(seed, mapId)),
    lines,
  );

  return {
    nodes,
    lines,
    unservedMw: 0,
    overloadMw: 0,
    trippedLineIds: [],
    maxUtilization: 0,
  };
}

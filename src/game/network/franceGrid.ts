import type { GameState, PlayerActionType } from "@/game/types";
import type { FranceGridSnapshot, GridNode, GridNodeStatus, TransmissionLine, TransmissionLineStatus } from "@/game/network/networkTypes";
import { projectLonLat } from "@/features/map3d/geo/franceGeo";
import { clamp, round } from "@/lib/math";

// Small deterministic nudges (in world units) so geographically-coincident nodes
// stay legible: Lyon industry vs Rhone plant, Paris datacenter vs IDF hospital.
const NODE_OFFSETS: Record<string, [number, number]> = {
  "paris-saclay-ai": [-0.32, 0.16],
  "idf-hospital": [0.42, -0.05],
  "interconnect-north": [0.3, -0.18],
  "rhone-production": [-0.42, -0.12],
  "lyon-industry": [0.28, 0.24],
  "grenoble-ai-edge": [0.24, 0.18],
};

function nodeWorldPosition(node: GridNode): [number, number, number] {
  const [x, z] = projectLonLat([node.lon, node.lat]);
  const offset = NODE_OFFSETS[node.id] ?? [0, 0];
  return [round(x + offset[0], 3), 0, round(z + offset[1], 3)];
}

const baseNodes: GridNode[] = [
  {
    id: "normandy-production",
    label: "Normandie",
    kind: "nuclear",
    region: "Normandie",
    lat: 49.4,
    lon: 0.2,
    position: [-1.9, 0.14, -3.4],
    productionMw: 92,
    demandMw: 16,
    maxProductionMw: 130,
    maxDemandMw: 34,
    flexibilityMw: 8,
    criticality: "high",
    status: "stable",
    connectedLineIds: ["normandy-paris", "normandy-interconnect"],
    aiWorkloadIds: [],
    description: "Socle bas carbone qui alimente fortement l'Ile-de-France.",
  },
  {
    id: "paris-saclay-ai",
    label: "Paris-Saclay IA",
    kind: "datacenter",
    region: "Ile-de-France",
    lat: 48.7,
    lon: 2.1,
    position: [0.75, 0.2, -2.4],
    productionMw: 0,
    demandMw: 24,
    maxProductionMw: 0,
    maxDemandMw: 95,
    flexibilityMw: 42,
    criticality: "critical",
    status: "loaded",
    connectedLineIds: ["normandy-paris", "paris-lyon", "paris-centre-battery"],
    aiWorkloadIds: ["assistant-public", "dev-agent", "video-demo", "cyber-critical", "looping-agent"],
    description: "Datacenter IA souverain. Sa charge est flexible sauf pour les jobs cyber critiques.",
  },
  {
    id: "idf-hospital",
    label: "Hopital IDF",
    kind: "hospital",
    region: "Ile-de-France",
    lat: 48.85,
    lon: 2.35,
    position: [1.45, 0.12, -2.65],
    productionMw: 0,
    demandMw: 24,
    maxProductionMw: 0,
    maxDemandMw: 36,
    flexibilityMw: 0,
    criticality: "critical",
    status: "stable",
    connectedLineIds: ["paris-hospital"],
    aiWorkloadIds: [],
    description: "Charge prioritaire. Le réseau doit la préserver pendant toute la crise.",
  },
  {
    id: "interconnect-north",
    label: "Interconnexion Nord",
    kind: "interconnect",
    region: "Nord",
    lat: 50.5,
    lon: 3.1,
    position: [1.8, 0.12, -4.15],
    productionMw: 0,
    demandMw: 0,
    maxProductionMw: 70,
    maxDemandMw: 0,
    flexibilityMw: 55,
    criticality: "medium",
    status: "stable",
    connectedLineIds: ["normandy-interconnect", "interconnect-paris"],
    aiWorkloadIds: [],
    description: "Import possible mais pénalisant pour le coût et la souveraineté.",
  },
  {
    id: "atlantic-wind",
    label: "Eolien Atlantique",
    kind: "wind",
    region: "Atlantique",
    lat: 47.1,
    lon: -2.7,
    position: [-3.45, 0.12, -0.7],
    productionMw: 18,
    demandMw: 5,
    maxProductionMw: 44,
    maxDemandMw: 16,
    flexibilityMw: 4,
    criticality: "medium",
    status: "stable",
    connectedLineIds: ["atlantic-bordeaux", "atlantic-centre"],
    aiWorkloadIds: [],
    description: "Production variable qui peut soulager le Sud-Ouest quand le vent tient.",
  },
  {
    id: "bordeaux-ev",
    label: "Bordeaux EV",
    kind: "ev",
    region: "Nouvelle-Aquitaine",
    lat: 44.84,
    lon: -0.58,
    position: [-1.9, 0.12, 1.25],
    productionMw: 0,
    demandMw: 28,
    maxProductionMw: 0,
    maxDemandMw: 72,
    flexibilityMw: 30,
    criticality: "medium",
    status: "loaded",
    connectedLineIds: ["atlantic-bordeaux", "bordeaux-toulouse", "bordeaux-centre"],
    aiWorkloadIds: [],
    description: "Zone résidentielle et recharge EV. Très flexible si le lissage démarre tôt.",
  },
  {
    id: "southwest-solar",
    label: "Solaire Sud-Ouest",
    kind: "solar",
    region: "Occitanie",
    lat: 43.6,
    lon: 1.44,
    position: [-0.25, 0.12, 2.45],
    productionMw: 28,
    demandMw: 8,
    maxProductionMw: 60,
    maxDemandMw: 20,
    flexibilityMw: 4,
    criticality: "medium",
    status: "stable",
    connectedLineIds: ["bordeaux-toulouse", "solar-rhone"],
    aiWorkloadIds: [],
    description: "Production solaire forte en journée, très sensible à la chute de 18h50.",
  },
  {
    id: "rhone-production",
    label: "Rhône Production",
    kind: "nuclear",
    region: "Auvergne-Rhône-Alpes",
    lat: 45.7,
    lon: 4.8,
    position: [2.25, 0.14, 1.3],
    productionMw: 76,
    demandMw: 18,
    maxProductionMw: 108,
    maxDemandMw: 44,
    flexibilityMw: 12,
    criticality: "high",
    status: "stable",
    connectedLineIds: ["paris-lyon", "solar-rhone", "lyon-marseille"],
    aiWorkloadIds: [],
    description: "Production pilotable bas carbone du couloir Rhône.",
  },
  {
    id: "lyon-industry",
    label: "Lyon Industrie",
    kind: "industry",
    region: "Auvergne-Rhône-Alpes",
    lat: 45.76,
    lon: 4.84,
    position: [1.45, 0.12, 0.55],
    productionMw: 0,
    demandMw: 44,
    maxProductionMw: 0,
    maxDemandMw: 70,
    flexibilityMw: 18,
    criticality: "high",
    status: "loaded",
    connectedLineIds: ["paris-lyon", "lyon-marseille", "centre-lyon"],
    aiWorkloadIds: [],
    description: "Industrie stratégique, partiellement flexible mais coûteuse à réduire.",
  },
  {
    id: "marseille-load",
    label: "Marseille",
    kind: "city",
    region: "PACA",
    lat: 43.3,
    lon: 5.37,
    position: [2.6, 0.12, 3.2],
    productionMw: 0,
    demandMw: 48,
    maxProductionMw: 0,
    maxDemandMw: 82,
    flexibilityMw: 14,
    criticality: "medium",
    status: "loaded",
    connectedLineIds: ["lyon-marseille"],
    aiWorkloadIds: [],
    description: "Demande urbaine du soir, peu flexible hors sobriété légère.",
  },
  {
    id: "centre-battery",
    label: "Batterie Centre",
    kind: "battery",
    region: "Centre",
    lat: 47.8,
    lon: 1.9,
    position: [0.15, 0.16, -0.65],
    productionMw: 0,
    demandMw: 0,
    maxProductionMw: 46,
    maxDemandMw: 0,
    flexibilityMw: 46,
    criticality: "high",
    status: "stable",
    connectedLineIds: ["paris-centre-battery", "bordeaux-centre", "centre-lyon", "atlantic-centre"],
    aiWorkloadIds: [],
    description: "Réserve tactique. Très utile pour refroidir les lignes en surcharge.",
  },
  {
    id: "grenoble-ai-edge",
    label: "Grenoble IA Edge",
    kind: "datacenter",
    region: "Alpes",
    lat: 45.18,
    lon: 5.72,
    position: [3.15, 0.18, 0.35],
    productionMw: 0,
    demandMw: 16,
    maxProductionMw: 0,
    maxDemandMw: 54,
    flexibilityMw: 24,
    criticality: "medium",
    status: "stable",
    connectedLineIds: ["centre-lyon", "lyon-marseille"],
    aiWorkloadIds: [],
    description: "Datacenter IA secondaire, utile pour déplacer des charges non critiques.",
  },
];

const lineSeeds: Array<Omit<TransmissionLine, "currentFlowMw" | "utilizationRatio" | "status" | "overloadDuration" | "causes"> & { baseFlowMw: number }> = [
  {
    id: "normandy-paris",
    label: "Normandie -> Paris-Saclay",
    fromNodeId: "normandy-production",
    toNodeId: "paris-saclay-ai",
    voltageKv: 400,
    capacityMw: 120,
    baseFlowMw: 76,
    isControllable: true,
    isCritical: true,
    incidentIds: ["video-job", "ev-surge"],
    actions: ["defer_ai", "activate_cache", "smart_ev", "discharge_battery", "import_energy"],
  },
  {
    id: "paris-hospital",
    label: "Paris-Saclay -> Hopital IDF",
    fromNodeId: "paris-saclay-ai",
    toNodeId: "idf-hospital",
    voltageKv: 225,
    capacityMw: 58,
    baseFlowMw: 29,
    isControllable: false,
    isCritical: true,
    incidentIds: ["cyber-job"],
    actions: ["discharge_battery", "import_energy"],
  },
  {
    id: "interconnect-paris",
    label: "Interconnexion Nord -> Paris",
    fromNodeId: "interconnect-north",
    toNodeId: "paris-saclay-ai",
    voltageKv: 400,
    capacityMw: 90,
    baseFlowMw: 22,
    isControllable: true,
    isCritical: false,
    incidentIds: [],
    actions: ["import_energy"],
  },
  {
    id: "normandy-interconnect",
    label: "Normandie -> Interconnexion Nord",
    fromNodeId: "normandy-production",
    toNodeId: "interconnect-north",
    voltageKv: 400,
    capacityMw: 100,
    baseFlowMw: 36,
    isControllable: true,
    isCritical: false,
    incidentIds: [],
    actions: ["import_energy"],
  },
  {
    id: "paris-lyon",
    label: "Paris -> Lyon",
    fromNodeId: "paris-saclay-ai",
    toNodeId: "lyon-industry",
    voltageKv: 400,
    capacityMw: 130,
    baseFlowMw: 72,
    isControllable: true,
    isCritical: true,
    incidentIds: ["solar-drop"],
    actions: ["discharge_battery", "defer_ai", "thermal_backup"],
  },
  {
    id: "atlantic-bordeaux",
    label: "Atlantique -> Bordeaux EV",
    fromNodeId: "atlantic-wind",
    toNodeId: "bordeaux-ev",
    voltageKv: 225,
    capacityMw: 78,
    baseFlowMw: 43,
    isControllable: true,
    isCritical: false,
    incidentIds: ["ev-surge"],
    actions: ["smart_ev", "discharge_battery"],
  },
  {
    id: "bordeaux-toulouse",
    label: "Bordeaux -> Sud-Ouest Solaire",
    fromNodeId: "bordeaux-ev",
    toNodeId: "southwest-solar",
    voltageKv: 225,
    capacityMw: 82,
    baseFlowMw: 41,
    isControllable: true,
    isCritical: false,
    incidentIds: ["ev-surge", "solar-drop"],
    actions: ["smart_ev", "discharge_battery"],
  },
  {
    id: "bordeaux-centre",
    label: "Bordeaux -> Batterie Centre",
    fromNodeId: "bordeaux-ev",
    toNodeId: "centre-battery",
    voltageKv: 400,
    capacityMw: 105,
    baseFlowMw: 48,
    isControllable: true,
    isCritical: false,
    incidentIds: ["ev-surge"],
    actions: ["smart_ev", "discharge_battery"],
  },
  {
    id: "atlantic-centre",
    label: "Atlantique -> Centre",
    fromNodeId: "atlantic-wind",
    toNodeId: "centre-battery",
    voltageKv: 225,
    capacityMw: 86,
    baseFlowMw: 35,
    isControllable: true,
    isCritical: false,
    incidentIds: [],
    actions: ["discharge_battery"],
  },
  {
    id: "paris-centre-battery",
    label: "Batterie Centre -> Paris",
    fromNodeId: "centre-battery",
    toNodeId: "paris-saclay-ai",
    voltageKv: 400,
    capacityMw: 118,
    baseFlowMw: 50,
    isControllable: true,
    isCritical: true,
    incidentIds: ["video-job", "solar-drop"],
    actions: ["discharge_battery", "defer_ai", "activate_cache"],
  },
  {
    id: "centre-lyon",
    label: "Centre -> Lyon",
    fromNodeId: "centre-battery",
    toNodeId: "lyon-industry",
    voltageKv: 400,
    capacityMw: 108,
    baseFlowMw: 54,
    isControllable: true,
    isCritical: false,
    incidentIds: ["solar-drop"],
    actions: ["discharge_battery", "thermal_backup"],
  },
  {
    id: "solar-rhone",
    label: "Sud-Ouest -> Rhone",
    fromNodeId: "southwest-solar",
    toNodeId: "rhone-production",
    voltageKv: 225,
    capacityMw: 82,
    baseFlowMw: 30,
    isControllable: true,
    isCritical: false,
    incidentIds: ["solar-drop"],
    actions: ["thermal_backup"],
  },
  {
    id: "lyon-marseille",
    label: "Lyon -> Marseille",
    fromNodeId: "lyon-industry",
    toNodeId: "marseille-load",
    voltageKv: 400,
    capacityMw: 120,
    baseFlowMw: 66,
    isControllable: true,
    isCritical: true,
    incidentIds: ["solar-drop"],
    actions: ["thermal_backup", "discharge_battery"],
  },
];

function hasEffect(state: GameState, action: PlayerActionType) {
  return state.activeEffects.some((effect) => effect.action === action && effect.expiresAt > state.minute);
}

function lineStatus(utilizationRatio: number): TransmissionLineStatus {
  if (utilizationRatio >= 1.1) return "critical";
  if (utilizationRatio >= 0.94) return "overloaded";
  if (utilizationRatio >= 0.72) return "loaded";
  return "stable";
}

function nodeStatus(loadRatio: number): GridNodeStatus {
  if (loadRatio >= 1.08) return "critical";
  if (loadRatio >= 0.9) return "overloaded";
  if (loadRatio >= 0.72) return "loaded";
  return "stable";
}

function selectedLinePressure(state: GameState, lineId: string) {
  let pressure = 0;

  if (state.flags.evSurge) pressure += lineId.includes("bordeaux") || lineId.includes("atlantic") ? 20 : 10;
  if (state.flags.solarDrop) pressure += lineId.includes("paris") || lineId.includes("lyon") || lineId.includes("solar") ? 20 : 8;
  if (state.flags.cyberPriority) pressure += lineId.includes("paris") ? 10 : 3;
  if (state.flags.agentLoop) pressure += lineId.includes("paris") ? 16 : 4;

  const videoActive = state.aiJobs.some((job) => job.id === "video-demo" && (job.status === "active" || job.status === "throttled"));
  if (videoActive) pressure += lineId === "normandy-paris" || lineId === "paris-centre-battery" ? 24 : 6;

  if (hasEffect(state, "smart_ev")) pressure -= lineId.includes("bordeaux") || lineId.includes("atlantic") ? 28 : 9;
  if (hasEffect(state, "defer_ai") || state.aiJobs.some((job) => job.id === "video-demo" && job.status === "deferred")) {
    pressure -= lineId.includes("paris") ? 24 : 7;
  }
  if (hasEffect(state, "discharge_battery")) pressure -= lineId.includes("centre") || lineId.includes("paris") ? 25 : 12;
  if (hasEffect(state, "import_energy")) pressure -= lineId === "normandy-paris" || lineId === "paris-lyon" ? 18 : 4;
  if (hasEffect(state, "thermal_backup")) pressure -= lineId.includes("lyon") || lineId.includes("marseille") ? 20 : 5;
  if (state.aiJobs.some((job) => job.cached)) pressure -= lineId.includes("paris") ? 7 : 2;

  pressure += Math.max(0, -state.metrics.reserveMw) * 0.45;

  return pressure;
}

function causesForLine(state: GameState, lineId: string) {
  const causes: string[] = [];
  if (state.flags.evSurge && (lineId.includes("bordeaux") || lineId.includes("atlantic") || lineId.includes("paris"))) {
    causes.push("Recharge EV massive");
  }
  if (state.aiJobs.some((job) => job.id === "video-demo" && job.status === "active") && lineId.includes("paris")) {
    causes.push("Job video IA non critique");
  }
  if (state.flags.solarDrop) causes.push("Chute solaire");
  if (state.flags.cyberPriority && lineId.includes("paris")) causes.push("Job cyber prioritaire");
  if (state.flags.agentLoop && lineId.includes("paris")) causes.push("Agent IA en boucle");
  if (causes.length === 0) causes.push("Flux de transit regional");
  return causes;
}

export function getFranceGridSnapshot(state: GameState): FranceGridSnapshot {
  const aiLoad = state.metrics.aiLoadMw;
  const evDemand = state.assets.find((asset) => asset.id === "ev")?.powerMw ?? 20;
  const solarProduction = state.assets.find((asset) => asset.id === "solar")?.powerMw ?? 20;
  const batteryOutput = state.assets.find((asset) => asset.id === "battery")?.powerMw ?? 0;

  const nodes = baseNodes.map((node) => {
    let productionMw = node.productionMw;
    let demandMw = node.demandMw;

    if (node.id === "paris-saclay-ai") demandMw = round(18 + aiLoad, 1);
    if (node.id === "grenoble-ai-edge") demandMw = round(14 + aiLoad * 0.12, 1);
    if (node.id === "bordeaux-ev") demandMw = round(22 + evDemand, 1);
    if (node.id === "southwest-solar") productionMw = round(solarProduction * 1.6, 1);
    if (node.id === "centre-battery") productionMw = round(batteryOutput, 1);
    if (node.id === "interconnect-north") productionMw = hasEffect(state, "import_energy") ? 42 : 0;
    if (node.id === "rhone-production") productionMw = hasEffect(state, "thermal_backup") ? 108 : 76;

    const loadRatio = demandMw / Math.max(1, node.maxDemandMw);
    return {
      ...node,
      position: nodeWorldPosition(node),
      productionMw,
      demandMw,
      status: nodeStatus(loadRatio),
    };
  });

  const lines = lineSeeds.map((line) => {
    const pressure = selectedLinePressure(state, line.id);
    const currentFlowMw = clamp(round(line.baseFlowMw + pressure, 1), 8, line.capacityMw * 1.38);
    const utilizationRatio = round(currentFlowMw / line.capacityMw, 2);
    const status = lineStatus(utilizationRatio);

    return {
      ...line,
      currentFlowMw,
      utilizationRatio,
      status,
      overloadDuration: utilizationRatio > 0.94 ? Math.max(5, state.tick * 2) : 0,
      causes: causesForLine(state, line.id),
    };
  });

  return { nodes, lines };
}

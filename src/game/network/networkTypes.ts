import type { PlayerActionType } from "@/game/types";

export type GridNodeKind =
  | "nuclear"
  | "solar"
  | "wind"
  | "battery"
  | "datacenter"
  | "city"
  | "industry"
  | "hospital"
  | "interconnect"
  | "ev";

export type GridNodeStatus = "stable" | "loaded" | "overloaded" | "critical" | "offline";

export type TransmissionLineStatus = "stable" | "loaded" | "overloaded" | "critical" | "offline";
export type TransmissionProtectionState = "closed" | "armed" | "open" | "tripped" | "repairing";

export type GridNodeRole = "producer" | "consumer" | "storage" | "connector";
export type GridNodeLabelMode = "always" | "auto" | "hover";
export type RuntimeFlag = "evSurge" | "solarDrop" | "residentialPeak" | "cyberPriority" | "agentLoop";

export interface RuntimeProductionProfile {
  baseMw?: number;
  floorMw?: number;
  solarCapacityMw?: number;
  solarDropFactor?: number;
  waveMw?: number;
  wavePeriodMinutes?: number;
  flagPenalties?: Array<{ flag: RuntimeFlag; mw: number }>;
  effectAction?: PlayerActionType;
  stabilityBoost?: { below: number; mw: number };
}

export interface RuntimeDemandProfile {
  baseMw?: number;
  floorMw?: number;
  assignedAi?: boolean;
  progressionMw?: number;
  flagAdditions?: Array<{ flag: RuntimeFlag; mw: number }>;
  minuteAdditions?: Array<{ fromMinute: number; mw: number }>;
  effectReductionAction?: PlayerActionType;
  effectTargetId?: string;
}

export interface GridNodeRuntimeProfile {
  production?: RuntimeProductionProfile;
  demand?: RuntimeDemandProfile;
  storageLevel?: boolean;
}

export type SelectedEntity =
  | { kind: "node"; id: string }
  | { kind: "line"; id: string }
  | { kind: "workload"; id: string }
  | { kind: "incident"; id: string };

export interface GridNode {
  id: string;
  label: string;
  kind: GridNodeKind;
  role: GridNodeRole;
  labelMode?: GridNodeLabelMode;
  region: string;
  lat: number;
  lon: number;
  position: [number, number, number];
  productionMw: number;
  demandMw: number;
  /** Production actually injected after dispatch/curtailment this tick. */
  servedProductionMw: number;
  /** Demand actually served after curtailment this tick. */
  servedDemandMw: number;
  maxProductionMw: number;
  maxDemandMw: number;
  flexibilityMw: number;
  /** Optional state-of-charge for storage visuals, expressed as 0..100. */
  storageLevelPct?: number;
  criticality: "low" | "medium" | "high" | "critical";
  status: GridNodeStatus;
  connectedLineIds: string[];
  aiWorkloadIds: string[];
  organization?: {
    name: string;
    contract: "critical" | "flexible" | "market" | "public";
    minCurtailmentMinutes: number;
    maxCurtailmentMinutes: number;
    reductionCost: number;
    reputationRisk: number;
    satisfaction: number;
  };
  runtime?: GridNodeRuntimeProfile;
  description: string;
}

export interface TransmissionLine {
  id: string;
  label: string;
  fromNodeId: string;
  toNodeId: string;
  voltageKv: number;
  nominalCapacityMw: number;
  capacityMw: number;
  /** Signed flow magnitude on the line (always reported positive for display). */
  signedFlowMw: number;
  /** Absolute flow displayed to the player. */
  currentFlowMw: number;
  utilizationRatio: number;
  status: TransmissionLineStatus;
  path?: [number, number, number][];
  /** Visual lateral bend used by the 3D renderer to separate overlapping routes. */
  visualBend?: number;
  isControllable: boolean;
  isCritical: boolean;
  /** Electrical weight for the DC load-flow solve (proportional to capacity). */
  susceptance: number;
  /** Persisted conductor heat (°C). Rises under overload, cools below it. */
  temperatureC: number;
  /** Persisted minutes spent above the overload threshold. */
  overloadDuration: number;
  /** Bounded live history of final utilization ratios, one entry per simulation tick. */
  utilizationHistory: number[];
  /** Whether protection has tripped this line offline. */
  tripped: boolean;
  /** Protection/runtime state for operator feedback and delayed repair flows. */
  protectionState: TransmissionProtectionState;
  /** Emergency rating is allowed until this minute, then nominal capacity returns. */
  emergencyCapacityUntil?: number;
  /** Repair command reconnects this line when the mission clock reaches this minute. */
  repairUntil?: number;
  /** How many times this line has tripped during the mission. */
  tripCount: number;
  incidentIds: string[];
  causes: string[];
  actions: PlayerActionType[];
}

export interface FranceGridSnapshot {
  nodes: GridNode[];
  lines: TransmissionLine[];
}

/** Live grid state owned by the engine and rendered by the 3D scene. */
export interface GridRuntime {
  nodes: GridNode[];
  lines: TransmissionLine[];
  /** Demand that could not be served this tick (MW). */
  unservedMw: number;
  /** Total flow above line capacity this tick (MW), summed over lines. */
  overloadMw: number;
  /** Ids of lines currently tripped offline. */
  trippedLineIds: string[];
  /** Highest line utilization ratio this tick. */
  maxUtilization: number;
}

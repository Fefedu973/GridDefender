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

export type GridNodeRole = "producer" | "consumer" | "storage" | "connector";
export type GridNodeLabelMode = "always" | "auto" | "hover";

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
  maxProductionMw: number;
  maxDemandMw: number;
  flexibilityMw: number;
  criticality: "low" | "medium" | "high" | "critical";
  status: GridNodeStatus;
  connectedLineIds: string[];
  aiWorkloadIds: string[];
  description: string;
}

export interface TransmissionLine {
  id: string;
  label: string;
  fromNodeId: string;
  toNodeId: string;
  voltageKv: number;
  capacityMw: number;
  currentFlowMw: number;
  utilizationRatio: number;
  status: TransmissionLineStatus;
  path?: [number, number, number][];
  isControllable: boolean;
  isCritical: boolean;
  overloadDuration: number;
  incidentIds: string[];
  causes: string[];
  actions: PlayerActionType[];
}

export interface FranceGridSnapshot {
  nodes: GridNode[];
  lines: TransmissionLine[];
}

export type GamePhase = "ready" | "running" | "paused" | "ended";

export type AssetKind = "production" | "load" | "storage" | "datacenter";

export type AssetStatus = "stable" | "watch" | "critical" | "offline";

export type AssetCategory =
  | "nuclear"
  | "solar"
  | "wind"
  | "hydro"
  | "battery"
  | "import"
  | "thermal"
  | "hospital"
  | "residential"
  | "industry"
  | "ev"
  | "event"
  | "ai";

export type AIJobKind = "text" | "code" | "video" | "science" | "cyber" | "agent";

export type AIJobStatus =
  | "queued"
  | "active"
  | "deferred"
  | "completed"
  | "failed"
  | "throttled";

export type Criticality = "low" | "medium" | "high" | "critical";

export type IncidentSeverity = "info" | "warning" | "critical";

export type PlayerActionType =
  | "smart_ev"
  | "defer_ai"
  | "reduce_model"
  | "activate_cache"
  | "agent_timeout"
  | "discharge_battery"
  | "import_energy"
  | "thermal_backup";

export interface GridPosition {
  x: number;
  y: number;
}

export interface EnergyAsset {
  id: string;
  name: string;
  kind: AssetKind;
  category: AssetCategory;
  position: GridPosition;
  powerMw: number;
  maxPowerMw: number;
  status: AssetStatus;
  critical: boolean;
  flexible: boolean;
  description: string;
}

export interface AIJob {
  id: string;
  name: string;
  kind: AIJobKind;
  criticality: Criticality;
  status: AIJobStatus;
  basePowerMw: number;
  currentPowerMw: number;
  progress: number;
  value: number;
  startMinute: number;
  deadlineMinute: number;
  deferredUntil?: number;
  cached: boolean;
  modelScale: 1 | 0.75 | 0.55;
  timeoutApplied: boolean;
  loopRisk: number;
  redundantCalls: number;
  sovereign: boolean;
  narrative: string;
}

export interface ScenarioEvent {
  id: string;
  minute: number;
  title: string;
  description: string;
  severity: IncidentSeverity;
}

export interface ActiveEffect {
  id: string;
  label: string;
  action: PlayerActionType;
  startedAt: number;
  expiresAt: number;
  magnitude: number;
}

export interface ActiveIncident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  openedAt: number;
  resolvedAt?: number;
  source: "grid" | "ai" | "public" | "weather";
}

export interface GameMetrics {
  stability: number;
  carbon: number;
  cost: number;
  sovereignty: number;
  aiProductivity: number;
  publicSatisfaction: number;
  criticalContinuity: number;
  batteryLevel: number;
  productionMw: number;
  demandMw: number;
  aiLoadMw: number;
  reserveMw: number;
  co2Intensity: number;
  score: number;
}

export interface ActionRecord {
  id: string;
  minute: number;
  type: PlayerActionType;
  label: string;
  result: string;
  impact: "positive" | "mixed" | "negative";
}

export interface AssistantMessage {
  id: string;
  minute: number;
  title: string;
  body: string;
  tone: IncidentSeverity;
  suggestedAction?: PlayerActionType;
}

export interface TimelineSnapshot {
  minute: number;
  label: string;
  productionMw: number;
  demandMw: number;
  stability: number;
  batteryLevel: number;
  aiLoadMw: number;
  carbon: number;
  score: number;
}

export interface Scenario {
  id: string;
  name: string;
  subtitle: string;
  startMinute: number;
  endMinute: number;
  tickMinutes: number;
  objectives: string[];
  initialMetrics: GameMetrics;
  assets: EnergyAsset[];
  aiJobs: AIJob[];
  events: ScenarioEvent[];
}

export interface ScenarioFlags {
  evSurge: boolean;
  solarDrop: boolean;
  residentialPeak: boolean;
  cyberPriority: boolean;
  agentLoop: boolean;
}

export interface GameState {
  scenario: Scenario;
  phase: GamePhase;
  minute: number;
  tick: number;
  triggeredEventIds: string[];
  flags: ScenarioFlags;
  metrics: GameMetrics;
  assets: EnergyAsset[];
  aiJobs: AIJob[];
  activeEffects: ActiveEffect[];
  incidents: ActiveIncident[];
  actionHistory: ActionRecord[];
  assistantMessages: AssistantMessage[];
  timeline: TimelineSnapshot[];
  outcome?: {
    result: "victory" | "failure";
    score: number;
    badge: string;
    summary: string;
  };
}

export interface ActionDefinition {
  type: PlayerActionType;
  label: string;
  shortLabel: string;
  description: string;
  target: string;
  expectedImpact: string;
}

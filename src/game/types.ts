import type { GridRuntime } from "@/game/network/networkTypes";

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
export type IncidentSource = "grid" | "ai" | "public" | "weather";

export type PlayerActionType =
  | "smart_ev"
  | "defer_ai"
  | "migrate_ai"
  | "externalize_ai"
  | "reduce_model"
  | "activate_cache"
  | "agent_timeout"
  | "discharge_battery"
  | "import_energy"
  | "thermal_backup"
  | "curtail_industry"
  | "reroute_line"
  | "repair_line"
  | "authorize_overload";

export type CommandTargetKind = "node" | "line" | "workload" | "grid";

export interface CommandTarget {
  kind: CommandTargetKind;
  id: string;
}

export interface PlayerCommand {
  action: PlayerActionType;
  target?: CommandTarget;
  destinationNodeId?: string;
  intensityMw?: number;
  durationMinutes?: number;
  scheduledMinute?: number;
  source?: "player" | "athena" | "demo";
}

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
  assignedNodeId: string;
  preferredNodeIds: string[];
  externalized: boolean;
  narrative: string;
}

export interface ScenarioEvent {
  id: string;
  minute: number;
  title: string;
  description: string;
  severity: IncidentSeverity;
  source?: IncidentSource;
  effects?: ScenarioEventEffect[];
  resolvesWhen?: ScenarioEventResolution[];
}

export interface ScenarioEventEffect {
  type: "trip_line" | "activate_ai_job" | "set_flag";
  lineId?: string;
  jobId?: string;
  flag?: keyof ScenarioFlags;
  value?: boolean;
}

export type ScenarioEventResolution =
  | { type: "effect_active"; action: PlayerActionType }
  | { type: "job_status"; jobId: string; statuses: AIJobStatus[] }
  | { type: "flag_false"; flag: keyof ScenarioFlags }
  | { type: "stability_above"; threshold: number; flag?: keyof ScenarioFlags };

export interface ActiveEffect {
  id: string;
  label: string;
  action: PlayerActionType;
  target?: CommandTarget;
  startedAt: number;
  expiresAt: number;
  magnitude: number;
}

export interface ActiveCommand {
  id: string;
  label: string;
  command: PlayerCommand;
  startedAt: number;
  expiresAt: number;
  cost: number;
}

export interface ActiveIncident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  openedAt: number;
  resolvedAt?: number;
  source: IncidentSource;
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

export interface CumulativeMetrics {
  overloadMinutes: number;
  criticalLineMinutes: number;
  unservedEnergyMwh: number;
  criticalUnservedEnergyMwh: number;
  co2Tons: number;
  operatingCost: number;
  aiValueDelivered: number;
  wastedAiEnergyMwh: number;
  commandCapacitySpent: number;
  athenaAutopilotUses: number;
  emergencyActions: number;
  lineTrips: number;
}

export interface ActionRecord {
  id: string;
  minute: number;
  type: PlayerActionType;
  label: string;
  result: string;
  impact: "positive" | "mixed" | "negative";
  targetLabel?: string;
  cost?: number;
  commandCapacityAfter?: number;
  feedback?: ActionFeedback;
}

export interface ActionFeedback {
  comboLabel: string;
  comboLevel: number;
  maxUtilizationDeltaPct: number;
  relievedLineIds: string[];
  reserveDeltaMw: number;
  resolvedIncidentCount: number;
  scoreDelta: number;
  stabilityDelta: number;
  tacticalScore: number;
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

export interface CriticalMoment {
  id: string;
  minute: number;
  label: string;
  severity: IncidentSeverity;
  kind: "line" | "node" | "ai" | "grid";
  title: string;
  description: string;
  entityId?: string;
  entityLabel?: string;
  stability: number;
  maxUtilization: number;
  reserveMw: number;
}

export type ObjectiveMetric =
  | "stability"
  | "criticalContinuity"
  | "carbon"
  | "cost"
  | "sovereignty"
  | "aiProductivity"
  | "score"
  | "commandCapacitySpent"
  | "lineTrips"
  | "unservedEnergyMwh"
  | "athenaAutopilotUses"
  | "completedAiJobs"
  | "failedCriticalJobs";

export interface ScenarioObjectiveCheck {
  id: string;
  label: string;
  metric: ObjectiveMetric;
  operator: ">=" | "<=" | "=";
  target: number;
  required?: boolean;
}

export interface ObjectiveResult extends ScenarioObjectiveCheck {
  value: number;
  passed: boolean;
}

export interface ScenarioTelemetryProfile {
  mode: "nominal" | "degraded" | "blackout";
  label: string;
  metricNoisePct?: number;
  forecastHorizonMinutes?: number;
  hiddenLineIds?: string[];
  hiddenNodeIds?: string[];
  phantomLineIds?: string[];
}

export type ScenarioRunMode = "campaign" | "crisis-run" | "daily-challenge" | "sandbox" | "scenario-builder";

export interface Scenario {
  id: string;
  mapId: string;
  runMode?: ScenarioRunMode;
  seed?: string;
  difficulty: "tutorial" | "standard" | "hard" | "expert";
  name: string;
  subtitle: string;
  startMinute: number;
  endMinute: number;
  tickMinutes: number;
  objectives: string[];
  objectiveChecks: ScenarioObjectiveCheck[];
  commandCapacity: number;
  availableActions?: PlayerActionType[];
  commandCostAdjustments?: Partial<Record<PlayerActionType, number>>;
  knownEventIds: string[];
  forecastEventIds?: string[];
  telemetry?: ScenarioTelemetryProfile;
  rewards: string[];
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
  grid: GridRuntime;
  commandCapacity: number;
  commandCapacityMax: number;
  actionCooldowns: Partial<Record<PlayerActionType, number>>;
  athenaTokens: number;
  activeCommands: ActiveCommand[];
  cumulative: CumulativeMetrics;
  activeEffects: ActiveEffect[];
  incidents: ActiveIncident[];
  actionHistory: ActionRecord[];
  assistantMessages: AssistantMessage[];
  timeline: TimelineSnapshot[];
  criticalMoments: CriticalMoment[];
  outcome?: {
    result: "victory" | "failure";
    score: number;
    badge: string;
    summary: string;
    replayMoment?: CriticalMoment;
    objectiveResults: ObjectiveResult[];
  };
}

export interface ActionDefinition {
  type: PlayerActionType;
  label: string;
  shortLabel: string;
  description: string;
  target: string;
  expectedImpact: string;
  commandCost: number;
  cooldownMinutes: number;
  defaultDurationMinutes: number;
  defaultIntensityMw?: number;
}

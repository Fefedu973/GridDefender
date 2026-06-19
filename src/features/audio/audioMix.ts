import type { ActionRecord, AssistantMessage, GameMetrics, PlayerActionType } from "@/game/types";
import type { GridRuntime, SelectedEntity } from "@/game/network/networkTypes";
import { restoreFrenchSpeechAccents } from "@/features/audio/speechText";

export interface AdaptiveAudioInput {
  metrics: Pick<GameMetrics, "aiProductivity" | "criticalContinuity" | "demandMw" | "stability">;
  grid: Pick<GridRuntime, "maxUtilization" | "overloadMw" | "unservedMw">;
}

export interface AdaptiveAudioMix {
  alarmFrequency: number;
  alarmGain: number;
  datacenterAlarmFrequency: number;
  datacenterAlarmGain: number;
  flowFrequency: number;
  flowGain: number;
  humFrequency: number;
  humGain: number;
  musicFrequency: number;
  musicGain: number;
  pressure: number;
  serviceAlarmFrequency: number;
  serviceAlarmGain: number;
  stress: number;
}

export interface AudioPulse {
  duration: number;
  frequency: number;
  gain: number;
  type: OscillatorType;
}

export interface AthenaVoiceCue {
  id: string;
  pitch: number;
  pulse: AudioPulse;
  rate: number;
  text: string;
  volume: number;
}

export interface SelectionAudioCue {
  key: string;
  pulse: AudioPulse;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function compactSpeechText(text: string, maxLength: number) {
  const firstSentence = text.split(/[.!?]/)[0]?.trim() || text.trim();
  if (firstSentence.length <= maxLength) return firstSentence;
  return `${firstSentence.slice(0, maxLength - 1).trim()}...`;
}

function actionFamily(action: PlayerActionType) {
  if (action === "reroute_line" || action === "repair_line" || action === "authorize_overload") return "grid";
  if (action === "discharge_battery" || action === "import_energy" || action === "thermal_backup") return "supply";
  if (
    action === "defer_ai" ||
    action === "migrate_ai" ||
    action === "externalize_ai" ||
    action === "reduce_model" ||
    action === "activate_cache" ||
    action === "agent_timeout"
  ) return "ai";
  return "demand";
}

export function getAdaptiveAudioMix({ metrics, grid }: AdaptiveAudioInput): AdaptiveAudioMix {
  const pressure = clamp01(metrics.demandMw / 260);
  const stabilityStress = clamp01((45 - metrics.stability) / 45);
  const utilizationStress = clamp01((grid.maxUtilization - 0.92) / 0.5);
  const overloadStress = clamp01(grid.overloadMw / 55);
  const unservedStress = clamp01(grid.unservedMw / 42);
  const serviceStress = clamp01((92 - metrics.criticalContinuity) / 34);
  const datacenterStress = clamp01((84 - metrics.aiProductivity) / 34);
  const stress = Math.max(stabilityStress, utilizationStress, overloadStress, unservedStress);
  const flowPressure = clamp01((grid.maxUtilization - 0.62) / 0.65);
  const musicalTension = clamp01((82 - metrics.stability) / 58);

  return {
    alarmFrequency: 170 + stress * 310,
    alarmGain: stress > 0.02 ? 0.008 + stress * 0.06 : 0,
    datacenterAlarmFrequency: 510 + datacenterStress * 170,
    datacenterAlarmGain: datacenterStress > 0.04 ? 0.004 + datacenterStress * 0.038 : 0,
    flowFrequency: 68 + flowPressure * 74,
    flowGain: 0.002 + flowPressure * 0.022 + overloadStress * 0.018,
    humFrequency: 48 + pressure * 30,
    humGain: 0.012 + pressure * 0.046,
    musicFrequency: 118 - musicalTension * 34,
    musicGain: 0.006 + musicalTension * 0.024,
    pressure,
    serviceAlarmFrequency: 780 + serviceStress * 260,
    serviceAlarmGain: serviceStress > 0.04 ? 0.004 + serviceStress * 0.042 : 0,
    stress,
  };
}

export function getActionAudioPulse(action?: Pick<ActionRecord, "impact" | "type">): AudioPulse | undefined {
  if (!action) return undefined;
  const penaltyGain = action.impact === "negative" ? 0.012 : 0;

  switch (actionFamily(action.type)) {
    case "grid":
      return { duration: 0.24, frequency: 360, gain: 0.052 + penaltyGain, type: "sawtooth" };
    case "supply":
      return { duration: 0.2, frequency: 260, gain: 0.046 + penaltyGain, type: "triangle" };
    case "ai":
      return { duration: 0.14, frequency: 640, gain: 0.034 + penaltyGain, type: "square" };
    case "demand":
      return { duration: 0.16, frequency: 430, gain: 0.038 + penaltyGain, type: "sine" };
    default:
      return undefined;
  }
}

export function getLineTripAudioPulse(previousTripCount: number, nextTripCount: number): AudioPulse | undefined {
  if (nextTripCount <= previousTripCount) return undefined;
  const addedTrips = Math.min(3, nextTripCount - previousTripCount);
  return {
    duration: 0.26 + addedTrips * 0.06,
    frequency: 92,
    gain: 0.07 + addedTrips * 0.018,
    type: "sawtooth",
  };
}

export function getSelectionAudioCue(
  selected?: SelectedEntity,
  previousSelectionKey?: string,
): SelectionAudioCue | undefined {
  if (!selected) return undefined;
  const key = `${selected.kind}:${selected.id}`;
  if (key === previousSelectionKey) return undefined;

  switch (selected.kind) {
    case "line":
      return { key, pulse: { duration: 0.07, frequency: 520, gain: 0.026, type: "triangle" } };
    case "node":
      return { key, pulse: { duration: 0.06, frequency: 690, gain: 0.022, type: "sine" } };
    case "workload":
      return { key, pulse: { duration: 0.08, frequency: 780, gain: 0.018, type: "square" } };
    case "incident":
      return { key, pulse: { duration: 0.09, frequency: 430, gain: 0.03, type: "sawtooth" } };
    default:
      return undefined;
  }
}

export function getAthenaVoiceCue(
  message?: Pick<AssistantMessage, "body" | "id" | "title" | "tone">,
  previousMessageId?: string,
): AthenaVoiceCue | undefined {
  if (!message || message.id === previousMessageId) return undefined;

  const title = restoreFrenchSpeechAccents(compactSpeechText(message.title, 52));
  const body = restoreFrenchSpeechAccents(compactSpeechText(message.body, 118));

  if (message.tone === "critical") {
    return {
      id: message.id,
      pitch: 0.86,
      pulse: { duration: 0.18, frequency: 760, gain: 0.04, type: "square" },
      rate: 0.88,
      text: `Athéna critique. ${title}. ${body}`,
      volume: 0.62,
    };
  }

  if (message.tone === "warning") {
    return {
      id: message.id,
      pitch: 0.94,
      pulse: { duration: 0.14, frequency: 620, gain: 0.03, type: "triangle" },
      rate: 0.95,
      text: `Athéna alerte. ${title}. ${body}`,
      volume: 0.52,
    };
  }

  return {
    id: message.id,
    pitch: 1.02,
    pulse: { duration: 0.1, frequency: 540, gain: 0.018, type: "sine" },
    rate: 1,
    text: `Athéna. ${title}. ${body}`,
    volume: 0.38,
  };
}

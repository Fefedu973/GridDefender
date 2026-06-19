import type { ActionRecord, CriticalMoment, TimelineSnapshot } from "@/game/types";
import { formatClock } from "@/lib/format";

export interface MissionReplayFrame {
  minute: number;
  label: string;
  stability: number;
  reserveMw: number;
  demandMw: number;
  productionMw: number;
  score: number;
  role: "before" | "incident" | "after";
}

export interface MissionReplayAction {
  minute: number;
  label: string;
  actionLabel: string;
  comboLabel?: string;
  comboLevel?: number;
  impact: ActionRecord["impact"];
  targetLabel?: string;
  cost?: number;
  tacticalScore?: number;
}

export interface MissionReplay {
  moment: CriticalMoment;
  frames: MissionReplayFrame[];
  actions: MissionReplayAction[];
  stabilityRecovery: number;
  reserveRecoveryMw: number;
  peakDemandMw: number;
}

interface MissionReplayInput {
  moment?: CriticalMoment;
  timeline: TimelineSnapshot[];
  actions: ActionRecord[];
  beforeMinutes?: number;
  afterMinutes?: number;
}

function nearestFrame(timeline: TimelineSnapshot[], minute: number) {
  return timeline.reduce<TimelineSnapshot | undefined>((best, point) => {
    if (!best) return point;
    return Math.abs(point.minute - minute) < Math.abs(best.minute - minute) ? point : best;
  }, undefined);
}

function roleForFrame(frame: TimelineSnapshot, momentMinute: number, incidentMinute: number): MissionReplayFrame["role"] {
  if (frame.minute === incidentMinute) return "incident";
  return frame.minute < momentMinute ? "before" : "after";
}

export function createMissionReplay({
  moment,
  timeline,
  actions,
  beforeMinutes = 20,
  afterMinutes = 25,
}: MissionReplayInput): MissionReplay | undefined {
  if (!moment || timeline.length === 0) return undefined;

  const startMinute = moment.minute - beforeMinutes;
  const endMinute = moment.minute + afterMinutes;
  const windowFrames = timeline
    .filter((point) => point.minute >= startMinute && point.minute <= endMinute)
    .sort((a, b) => a.minute - b.minute);

  const incidentPoint = nearestFrame(windowFrames.length > 0 ? windowFrames : timeline, moment.minute);
  if (!incidentPoint) return undefined;

  const uniqueFrames = new Map<number, TimelineSnapshot>();
  for (const frame of windowFrames) uniqueFrames.set(frame.minute, frame);
  uniqueFrames.set(incidentPoint.minute, incidentPoint);

  const frames = [...uniqueFrames.values()]
    .sort((a, b) => a.minute - b.minute)
    .map<MissionReplayFrame>((frame) => ({
      minute: frame.minute,
      label: frame.label || formatClock(frame.minute),
      stability: frame.stability,
      reserveMw: frame.productionMw - frame.demandMw,
      demandMw: frame.demandMw,
      productionMw: frame.productionMw,
      score: frame.score,
      role: roleForFrame(frame, moment.minute, incidentPoint.minute),
    }));

  const incidentFrame = frames.find((frame) => frame.role === "incident") ?? frames[0];
  const finalFrame = frames.at(-1) ?? incidentFrame;
  const replayActions = actions
    .filter((action) => action.minute >= moment.minute && action.minute <= endMinute)
    .sort((a, b) => a.minute - b.minute)
    .slice(0, 5)
    .map<MissionReplayAction>((action) => ({
      minute: action.minute,
      label: formatClock(action.minute),
      actionLabel: action.label,
      comboLabel: action.feedback?.comboLabel,
      comboLevel: action.feedback?.comboLevel,
      impact: action.impact,
      targetLabel: action.targetLabel,
      cost: action.cost,
      tacticalScore: action.feedback?.tacticalScore,
    }));

  return {
    moment,
    frames,
    actions: replayActions,
    stabilityRecovery: Math.round(finalFrame.stability - incidentFrame.stability),
    reserveRecoveryMw: Math.round(finalFrame.reserveMw - incidentFrame.reserveMw),
    peakDemandMw: Math.max(...frames.map((frame) => frame.demandMw)),
  };
}

import type { ActionFeedback, ActionRecord, GameState } from "@/game/types";
import { round } from "@/lib/math";

type FeedbackState = Pick<GameState, "grid" | "incidents" | "metrics">;

export function captureActionFeedbackState(state: FeedbackState) {
  return {
    lineUtilization: new Map(state.grid.lines.map((line) => [line.id, line.utilizationRatio])),
    maxUtilization: state.grid.maxUtilization,
    openIncidentIds: new Set(state.incidents.filter((incident) => !incident.resolvedAt).map((incident) => incident.id)),
    reserveMw: state.metrics.reserveMw,
    score: state.metrics.score,
    stability: state.metrics.stability,
  };
}

export function createActionFeedback({
  after,
  applied,
  before,
  impact,
}: {
  after: FeedbackState;
  applied: boolean;
  before: ReturnType<typeof captureActionFeedbackState>;
  impact: ActionRecord["impact"];
}): ActionFeedback | undefined {
  if (!applied) return undefined;

  const relievedLineIds = after.grid.lines
    .filter((line) => {
      const previous = before.lineUtilization.get(line.id) ?? line.utilizationRatio;
      return previous - line.utilizationRatio >= 0.06;
    })
    .sort((a, b) => {
      const aRelief = (before.lineUtilization.get(a.id) ?? a.utilizationRatio) - a.utilizationRatio;
      const bRelief = (before.lineUtilization.get(b.id) ?? b.utilizationRatio) - b.utilizationRatio;
      return bRelief - aRelief;
    })
    .map((line) => line.id)
    .slice(0, 3);

  const resolvedIncidentCount = [...before.openIncidentIds].filter((id) =>
    after.incidents.some((incident) => incident.id === id && incident.resolvedAt !== undefined),
  ).length;
  const maxUtilizationDeltaPct = round((after.grid.maxUtilization - before.maxUtilization) * 100, 1);
  const reserveDeltaMw = round(after.metrics.reserveMw - before.reserveMw, 1);
  const stabilityDelta = round(after.metrics.stability - before.stability, 1);
  const scoreDelta = round(after.metrics.score - before.score);

  const reliefScore =
    Math.max(0, -maxUtilizationDeltaPct) * 0.9 +
    Math.max(0, reserveDeltaMw) * 0.35 +
    Math.max(0, stabilityDelta) * 1.2 +
    resolvedIncidentCount * 14 +
    relievedLineIds.length * 5;
  const comboLevel =
    (impact === "positive" ? 1 : 0) +
    (relievedLineIds.length > 0 ? 1 : 0) +
    (resolvedIncidentCount > 0 ? 1 : 0) +
    (reserveDeltaMw >= 8 || stabilityDelta >= 2 ? 1 : 0);

  return {
    comboLabel: comboLevel >= 4 ? "Combo critique" : comboLevel >= 3 ? "Combo stabilisation" : comboLevel >= 2 ? "Réponse coordonnée" : "Impact local",
    comboLevel: Math.max(1, comboLevel),
    maxUtilizationDeltaPct,
    relievedLineIds,
    reserveDeltaMw,
    resolvedIncidentCount,
    scoreDelta,
    tacticalScore: Math.max(0, round(reliefScore)),
    stabilityDelta,
  };
}

import type { ObjectiveMetric, ObjectiveResult } from "@/game/types";

export const objectiveMetricLabels: Record<ObjectiveMetric, string> = {
  stability: "Stabilité",
  criticalContinuity: "Continuité critique",
  carbon: "Score CO₂",
  cost: "Coût",
  sovereignty: "Souveraineté",
  aiProductivity: "Productivité IA",
  score: "Score",
  commandCapacitySpent: "Capacité dépensée",
  lineTrips: "Trips de lignes",
  unservedEnergyMwh: "Énergie non servie",
  athenaAutopilotUses: "Autopilot ATHENA",
  completedAiJobs: "Jobs IA terminés",
  failedCriticalJobs: "Jobs critiques échoués",
};

const percentageMetrics = new Set<ObjectiveMetric>([
  "stability",
  "criticalContinuity",
  "carbon",
  "cost",
  "sovereignty",
  "aiProductivity",
]);

export function formatObjectiveValue(objective: Pick<ObjectiveResult, "metric">, value: number): string {
  if (percentageMetrics.has(objective.metric)) return `${Math.round(value)}%`;
  if (objective.metric === "unservedEnergyMwh") return `${value.toFixed(1)} MWh`;
  if (objective.metric === "commandCapacitySpent") return `${Math.round(value)} CP`;
  return `${Math.round(value)}`;
}

export function formatObjectiveRule(objective: Pick<ObjectiveResult, "metric" | "operator" | "target">): string {
  const label = objectiveMetricLabels[objective.metric];
  const target = formatObjectiveValue(objective, objective.target);
  if (objective.operator === ">=") return `${label} au moins ${target}`;
  if (objective.operator === "<=") return `${label} max ${target}`;
  return `${label} = ${target}`;
}

export function objectiveProgress(objective: ObjectiveResult): number {
  const { operator, target, value } = objective;
  if (objective.passed) return 1;
  if (target === 0) return objective.passed ? 1 : 0;
  if (operator === ">=") return Math.min(1, Math.max(0, value / target));
  if (operator === "<=") return Math.min(1, Math.max(0, 1 - value / Math.max(1, target * 1.4)));
  return objective.passed ? 1 : 0;
}

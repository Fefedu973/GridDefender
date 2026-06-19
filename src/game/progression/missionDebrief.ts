import type { ActionRecord, CumulativeMetrics, GameMetrics } from "@/game/types";

export type DebriefDoctrineId = "sobriety" | "sovereignty" | "economy" | "resilience";

export type MissionDebrief = {
  doctrineId: DebriefDoctrineId;
  doctrineLabel: string;
  doctrineDescription: string;
  recommendation: string;
  strengths: string[];
  watchItems: string[];
  styleScores: Record<DebriefDoctrineId, number>;
};

type MissionDebriefInput = {
  metrics: GameMetrics;
  cumulative: CumulativeMetrics;
  actions?: ActionRecord[];
};

const DOCTRINES: Record<DebriefDoctrineId, { label: string; description: string }> = {
  sobriety: {
    label: "sobriété pilotée",
    description: "Peu d'ordres, peu d'assistance ATHENA et une trajectoire carbone propre.",
  },
  sovereignty: {
    label: "résilience souveraine",
    description: "La charge critique reste locale et les dépendances extérieures restent faibles.",
  },
  economy: {
    label: "efficacité économique",
    description: "La mission limite les coûts et évite les réponses opérationnelles excessives.",
  },
  resilience: {
    label: "stabilisation résiliente",
    description: "La continuité critique et la stabilité priment sur le coût immédiat.",
  },
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function countActions(actions: ActionRecord[] | undefined, types: string[]) {
  if (!actions) return 0;
  return actions.filter((action) => types.includes(action.type)).length;
}

function topDoctrine(styleScores: Record<DebriefDoctrineId, number>): DebriefDoctrineId {
  const order: DebriefDoctrineId[] = ["resilience", "sovereignty", "sobriety", "economy"];
  return order.reduce((best, current) => (styleScores[current] > styleScores[best] ? current : best), order[0]);
}

export function createMissionDebrief({ metrics, cumulative, actions }: MissionDebriefInput): MissionDebrief {
  const externalActions = countActions(actions, ["externalize_ai", "import_energy"]);
  const emergencyGridActions = countActions(actions, ["thermal_backup", "authorize_overload", "repair_line"]);
  const aiOptimizationActions = countActions(actions, ["migrate_ai", "defer_ai", "reduce_model", "activate_cache", "agent_timeout"]);

  const gridDebt =
    cumulative.overloadMinutes * 0.25 +
    cumulative.criticalLineMinutes * 0.55 +
    cumulative.lineTrips * 16 +
    cumulative.unservedEnergyMwh * 2.5 +
    cumulative.criticalUnservedEnergyMwh * 24;

  const styleScores: Record<DebriefDoctrineId, number> = {
    sobriety: clampScore(metrics.carbon * 0.34 + metrics.cost * 0.24 + (100 - cumulative.commandCapacitySpent) * 0.26 - cumulative.athenaAutopilotUses * 12 - cumulative.wastedAiEnergyMwh * 5),
    sovereignty: clampScore(metrics.sovereignty * 0.52 + metrics.criticalContinuity * 0.24 + metrics.aiProductivity * 0.12 - externalActions * 9 - cumulative.criticalUnservedEnergyMwh * 26),
    economy: clampScore(metrics.cost * 0.56 + (100 - cumulative.commandCapacitySpent) * 0.22 + metrics.publicSatisfaction * 0.14 - emergencyGridActions * 7 - cumulative.operatingCost * 0.02),
    resilience: clampScore(metrics.stability * 0.25 + metrics.criticalContinuity * 0.34 + Math.max(0, 100 - gridDebt) * 0.31 + Math.max(0, metrics.reserveMw) * 0.1),
  };
  const doctrineId = topDoctrine(styleScores);
  const doctrine = DOCTRINES[doctrineId];

  const strengths: string[] = [];
  if (cumulative.lineTrips === 0 && cumulative.criticalLineMinutes < 10) strengths.push("Protections de lignes évitées");
  if (cumulative.criticalUnservedEnergyMwh === 0 && metrics.criticalContinuity >= 92) strengths.push("Services critiques protégés");
  if (metrics.aiProductivity >= 86 && cumulative.wastedAiEnergyMwh < 2) strengths.push("Calcul IA bien priorisé");
  if (metrics.sovereignty >= 86 && externalActions === 0) strengths.push("Souveraineté numérique préservée");
  if (cumulative.athenaAutopilotUses === 0) strengths.push("Pilotage sans autopilot ATHENA");
  if (strengths.length === 0) strengths.push("Réseau stabilisé malgré une dette opérationnelle visible");

  const watchItems: string[] = [];
  if (cumulative.lineTrips > 0) watchItems.push("Cascade de protections");
  if (cumulative.unservedEnergyMwh > 0 || cumulative.criticalUnservedEnergyMwh > 0) watchItems.push("Énergie non servie");
  if (cumulative.overloadMinutes > 20 || cumulative.criticalLineMinutes > 8) watchItems.push("Congestion prolongée");
  if (cumulative.commandCapacitySpent > 90) watchItems.push("Capacité de commandement presque épuisée");
  if (cumulative.athenaAutopilotUses > 0) watchItems.push("Dépendance à l'autopilot ATHENA");
  if (metrics.carbon < 72) watchItems.push("Mix carbone dégradé");
  if (watchItems.length === 0) watchItems.push("Garder une réserve pour l'incident suivant");

  const recommendation =
    cumulative.criticalUnservedEnergyMwh > 0
      ? "Priorité prochaine : protéger les nœuds critiques avant tout arbitrage coût ou souveraineté."
      : cumulative.lineTrips > 0
        ? "Priorité prochaine : refroidir les corridors critiques plus tôt et conserver une équipe réparation pour les lignes déclenchées."
        : cumulative.unservedEnergyMwh > 0
          ? "Priorité prochaine : commander batterie ou effacement avant que le solveur ne déleste la demande."
          : cumulative.overloadMinutes > 20
            ? "Priorité prochaine : agir avant le rouge prolongé, même si la ligne finit par tenir."
            : cumulative.wastedAiEnergyMwh > 2 || aiOptimizationActions === 0
              ? "Priorité prochaine : déplacer, réduire ou mettre en cache les workloads IA avant le pic réseau."
              : cumulative.athenaAutopilotUses > 0
                ? "Priorité prochaine : garder ATHENA au diagnostic et appliquer vous-même les ordres pour préserver la maîtrise."
                : "Votre trajectoire est propre : continuer à combiner planification EV, migration IA et réserve batterie sans sur-réagir.";

  return {
    doctrineId,
    doctrineLabel: doctrine.label,
    doctrineDescription: doctrine.description,
    recommendation,
    strengths,
    watchItems,
    styleScores,
  };
}

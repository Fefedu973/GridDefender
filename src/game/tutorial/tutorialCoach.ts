import type { CommandTarget, GameState, PlayerActionType } from "@/game/types";
import type { SelectedEntity } from "@/game/network/networkTypes";
import { defaultNodeTargetForAction } from "@/game/network/gridSelectors";

export interface TutorialCoachStep {
  id: string;
  title: string;
  body: string;
  progress: number;
  total: number;
  target?: CommandTarget;
  action?: PlayerActionType;
  complete: boolean;
}

function hasAction(state: GameState, action: PlayerActionType) {
  return state.actionHistory.some((record) => record.type === action && record.impact !== "negative");
}

function selectedTarget(selectedEntity: SelectedEntity | undefined): CommandTarget | undefined {
  if (!selectedEntity) return undefined;
  if (selectedEntity.kind === "incident") return undefined;
  return { kind: selectedEntity.kind, id: selectedEntity.id };
}

function hottestLineTarget(state: GameState): CommandTarget {
  const line = [...state.grid.lines]
    .filter((item) => !item.tripped)
    .sort((a, b) => b.utilizationRatio - a.utilizationRatio)[0];
  return { kind: "line", id: line?.id ?? state.grid.lines[0]?.id ?? "grid" };
}

export function getTutorialCoachStep(
  state: GameState,
  selectedEntity?: SelectedEntity,
): TutorialCoachStep | undefined {
  if (state.scenario.difficulty !== "tutorial" || state.phase === "ended") return undefined;

  const total = 4;
  const selection = selectedTarget(selectedEntity);
  const selectedLine = selection?.kind === "line";
  const batteryUsed = hasAction(state, "discharge_battery");
  const videoJob = state.aiJobs.find((job) => job.id === "video-demo");
  const videoHandled =
    videoJob?.status === "deferred" ||
    videoJob?.status === "completed" ||
    hasAction(state, "defer_ai") ||
    hasAction(state, "migrate_ai") ||
    hasAction(state, "reduce_model");

  if (!selectedLine) {
    return {
      id: "inspect-line",
      title: "Identifier la ligne chaude",
      body: "Sélectionnez le corridor qui porte le plus de charge pour lire ses causes et ses actions locales.",
      progress: 1,
      total,
      target: hottestLineTarget(state),
      complete: false,
    };
  }

  if (!batteryUsed) {
    return {
      id: "use-battery",
      title: "Injecter la batterie",
      body: "Engagez une décharge courte pour créer une marge immédiate sans toucher aux services critiques.",
      progress: 2,
      total,
      target: defaultNodeTargetForAction(state, "discharge_battery"),
      action: "discharge_battery",
      complete: false,
    };
  }

  if (videoJob && !videoHandled && state.minute >= videoJob.startMinute) {
    return {
      id: "schedule-ai",
      title: "Reporter le job IA flexible",
      body: "Le job vidéo n'est pas critique. Décalez-le sur la timeline ou appliquez une commande ciblée.",
      progress: 3,
      total,
      target: { kind: "workload", id: videoJob.id },
      action: "defer_ai",
      complete: false,
    };
  }

  return {
    id: "hold-grid",
    title: "Tenir jusqu'au débrief",
    body: "Conservez la continuité critique, évitez les déclenchements de ligne et gardez un peu de capacité opérationnelle.",
    progress: videoHandled ? 4 : 3,
    total,
    complete: videoHandled,
  };
}

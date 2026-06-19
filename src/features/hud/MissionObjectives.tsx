"use client";

import { CheckCircle2, CircleDashed, Target } from "lucide-react";
import { HudPanel } from "@/features/hud/hudKit";
import { evaluateObjectiveChecks } from "@/game/engine/simulation";
import { formatObjectiveRule, formatObjectiveValue, objectiveProgress } from "@/game/progression/objectivePresentation";
import type { ObjectiveResult } from "@/game/types";
import { useGameStore } from "@/store/gameStore";

function ObjectiveRow({ objective }: { objective: ObjectiveResult }) {
  const progress = objectiveProgress(objective);
  const color = objective.passed ? "#34f5b0" : objective.required ? "#ffd447" : "#7dd3fc";
  const Icon = objective.passed ? CheckCircle2 : CircleDashed;

  return (
    <div className="rounded border border-[var(--glass-border-soft)] bg-white/[0.025] p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-zinc-100">{objective.label}</p>
          <p className="mono mt-0.5 text-[9.5px] text-[var(--c-muted)]">{formatObjectiveRule(objective)}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 mono text-[10px]" style={{ color }}>
          <Icon className="h-3 w-3" />
          {formatObjectiveValue(objective, objective.value)}
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${Math.round(progress * 100)}%`,
            background: color,
            boxShadow: objective.passed ? `0 0 8px ${color}` : undefined,
          }}
        />
      </div>
    </div>
  );
}

export function MissionObjectives() {
  const game = useGameStore((state) => state.game);
  const objectives = evaluateObjectiveChecks(game);

  if (objectives.length === 0) return null;

  const requiredPassed = objectives.filter((objective) => objective.required).every((objective) => objective.passed);

  return (
    <HudPanel
      eyebrow="Objectifs"
      title={requiredPassed ? "Trajectoire OK" : "Mission en cours"}
      icon={<Target className="h-4 w-4" />}
    >
      <div className="grid gap-2 p-3">
        {objectives.slice(0, 4).map((objective) => (
          <ObjectiveRow key={objective.id} objective={objective} />
        ))}
      </div>
    </HudPanel>
  );
}

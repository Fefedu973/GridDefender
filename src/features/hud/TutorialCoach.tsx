"use client";

import { Crosshair, GraduationCap } from "lucide-react";
import { HudPanel } from "@/features/hud/hudKit";
import type { CommandTarget } from "@/game/types";
import type { SelectedEntity } from "@/game/network/networkTypes";
import { getTutorialCoachStep } from "@/game/tutorial/tutorialCoach";
import { useGameStore } from "@/store/gameStore";

function toSelectedEntity(target?: CommandTarget): SelectedEntity | undefined {
  if (!target || target.kind === "grid") return undefined;
  return { kind: target.kind, id: target.id };
}

export function TutorialCoach() {
  const game = useGameStore((state) => state.game);
  const selectedEntity = useGameStore((state) => state.selectedEntity);
  const selectEntity = useGameStore((state) => state.selectEntity);
  const step = getTutorialCoachStep(game, selectedEntity);
  const focusTarget = toSelectedEntity(step?.target);

  if (!step) return null;

  return (
    <HudPanel
      eyebrow={`Tutoriel · ${step.progress}/${step.total}`}
      title={step.title}
      icon={<GraduationCap className="h-4 w-4" />}
      className="w-[380px] max-w-[80vw]"
      action={
        focusTarget ? (
          <button
            type="button"
            onClick={() => selectEntity(focusTarget)}
            className="grid h-8 w-8 place-items-center rounded border border-[var(--glass-border-soft)] bg-white/[0.03] text-[var(--c-cyan-bright)] transition hover:border-[var(--c-cyan)]/50 hover:bg-[var(--c-cyan)]/10"
            title="Cibler"
          >
            <Crosshair className="h-4 w-4" />
          </button>
        ) : undefined
      }
    >
      <div className="space-y-3 p-3.5">
        <p className="text-[12.5px] leading-5 text-zinc-300">{step.body}</p>
        <div className="h-1.5 rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-[var(--c-cyan)] transition-[width] duration-500"
            style={{ width: `${Math.round((step.progress / step.total) * 100)}%`, boxShadow: "0 0 10px var(--c-cyan)" }}
          />
        </div>
      </div>
    </HudPanel>
  );
}

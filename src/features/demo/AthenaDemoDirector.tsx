"use client";

import { useEffect, useRef } from "react";
import { getAthenaDemoDecisions, type AthenaDemoDecision } from "@/game/advisor/demoAutopilot";
import type { CommandTarget } from "@/game/types";
import type { SelectedEntity } from "@/game/network/networkTypes";
import { useGameStore } from "@/store/gameStore";

function focusEntityForTarget(
  target: CommandTarget | undefined,
  game: ReturnType<typeof useGameStore.getState>["game"],
): SelectedEntity | undefined {
  if (!target || target.kind === "grid") return undefined;
  if (target.kind === "node") return { kind: "node", id: target.id };
  if (target.kind === "line") return { kind: "line", id: target.id };
  const job = game.aiJobs.find((item) => item.id === target.id);
  return job ? { kind: "node", id: job.assignedNodeId } : { kind: "workload", id: target.id };
}

export function AthenaDemoDirector() {
  const demoMode = useGameStore((state) => state.demoMode);
  const phase = useGameStore((state) => state.phase);
  const game = useGameStore((state) => state.game);
  const applyAction = useGameStore((state) => state.applyAction);
  const selectEntity = useGameStore((state) => state.selectEntity);
  const noteDemoAction = useGameStore((state) => state.noteDemoAction);
  const lastCommandMinuteRef = useRef<number | undefined>(undefined);
  const batchInFlightRef = useRef(false);
  const timeoutIdsRef = useRef<number[]>([]);

  const clearScheduledActions = () => {
    for (const timeoutId of timeoutIdsRef.current) window.clearTimeout(timeoutId);
    timeoutIdsRef.current = [];
    batchInFlightRef.current = false;
  };

  useEffect(() => {
    lastCommandMinuteRef.current = undefined;
    clearScheduledActions();
  }, [demoMode, game.scenario.id]);

  useEffect(() => clearScheduledActions, []);

  useEffect(() => {
    if (!demoMode || phase !== "running") {
      clearScheduledActions();
      return;
    }
    if (batchInFlightRef.current) return;

    const decisions = getAthenaDemoDecisions(game, lastCommandMinuteRef.current);
    if (decisions.length === 0) return;

    lastCommandMinuteRef.current = game.minute;
    batchInFlightRef.current = true;

    const runDecision = (decision: AthenaDemoDecision, index: number) => {
      const timeoutId = window.setTimeout(() => {
        const current = useGameStore.getState();
        if (!current.demoMode || current.phase !== "running") {
          batchInFlightRef.current = false;
          return;
        }

        const focusEntity = focusEntityForTarget(decision.target, current.game);
        if (focusEntity) selectEntity(focusEntity);
        noteDemoAction({
          action: decision.action,
          minute: current.game.minute,
          target: decision.target,
          targetLabel: decision.targetLabel,
        });
        applyAction(decision.command);

        if (index === decisions.length - 1) {
          batchInFlightRef.current = false;
        }
      }, index * 900);
      timeoutIdsRef.current.push(timeoutId);
    };

    decisions.forEach(runDecision);
  }, [applyAction, demoMode, game, noteDemoAction, phase, selectEntity]);

  return null;
}

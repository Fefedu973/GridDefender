"use client";

import { useEffect } from "react";
import { Cockpit } from "@/components/game/Cockpit";
import { ResultsScreen } from "@/components/game/ResultsScreen";
import { StartScreen } from "@/components/game/StartScreen";
import { useGameStore } from "@/store/gameStore";

export function GameShell() {
  const phase = useGameStore((state) => state.phase);
  const speed = useGameStore((state) => state.speed);
  const tick = useGameStore((state) => state.tick);
  const hydrateLeaderboard = useGameStore((state) => state.hydrateLeaderboard);

  useEffect(() => {
    hydrateLeaderboard();
  }, [hydrateLeaderboard]);

  useEffect(() => {
    if (phase !== "running") return;

    const interval = window.setInterval(() => {
      tick();
    }, Math.round(1350 / speed));

    return () => window.clearInterval(interval);
  }, [phase, speed, tick]);

  if (phase === "ready") return <StartScreen />;
  if (phase === "ended") return <ResultsScreen />;
  return <Cockpit />;
}

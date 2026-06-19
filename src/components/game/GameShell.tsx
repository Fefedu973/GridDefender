"use client";

import { useEffect, useState } from "react";
import { Cockpit } from "@/components/game/Cockpit";
import { ResultsScreen } from "@/components/game/ResultsScreen";
import { StartScreen } from "@/components/game/StartScreen";
import { Onboarding } from "@/features/onboarding/Onboarding";
import { DEFAULT_TICK_INTERVAL_MS } from "@/game/simulation/timing";
import { useGameStore } from "@/store/gameStore";

export function GameShell() {
  const phase = useGameStore((state) => state.phase);
  const speed = useGameStore((state) => state.speed);
  const tick = useGameStore((state) => state.tick);
  const introOpen = useGameStore((state) => state.introOpen);
  const hydratePreferences = useGameStore((state) => state.hydratePreferences);
  const hydrateLeaderboard = useGameStore((state) => state.hydrateLeaderboard);
  const hydrateTutorial = useGameStore((state) => state.hydrateTutorial);
  const hydrateProgress = useGameStore((state) => state.hydrateProgress);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hydratePreferences();
    hydrateLeaderboard();
    hydrateTutorial();
    hydrateProgress();

    const timeoutId = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timeoutId);
  }, [hydrateLeaderboard, hydratePreferences, hydrateProgress, hydrateTutorial]);

  useEffect(() => {
    if (phase !== "running") return;

    const interval = window.setInterval(() => {
      tick();
    }, Math.round(DEFAULT_TICK_INTERVAL_MS / speed));

    return () => window.clearInterval(interval);
  }, [phase, speed, tick]);

  // Avoid a tutorial flash before localStorage is read on the client.
  if (!mounted) return <div className="h-screen w-screen bg-[#030a10]" />;

  if (phase === "ended") return <ResultsScreen />;
  if (phase === "ready") return introOpen ? <Onboarding /> : <StartScreen />;
  return <Cockpit />;
}

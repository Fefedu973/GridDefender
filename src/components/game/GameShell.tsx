"use client";

import { useEffect, useState } from "react";
import { Cockpit } from "@/components/game/Cockpit";
import { ResultsScreen } from "@/components/game/ResultsScreen";
import { StartScreen } from "@/components/game/StartScreen";
import { Onboarding } from "@/features/onboarding/Onboarding";
import { useGameStore } from "@/store/gameStore";

export function GameShell() {
  const phase = useGameStore((state) => state.phase);
  const speed = useGameStore((state) => state.speed);
  const tick = useGameStore((state) => state.tick);
  const tutorialSeen = useGameStore((state) => state.tutorialSeen);
  const hydrateLeaderboard = useGameStore((state) => state.hydrateLeaderboard);
  const hydrateTutorial = useGameStore((state) => state.hydrateTutorial);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hydrateLeaderboard();
    hydrateTutorial();

    const timeoutId = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timeoutId);
  }, [hydrateLeaderboard, hydrateTutorial]);

  useEffect(() => {
    if (phase !== "running") return;

    const interval = window.setInterval(() => {
      tick();
    }, Math.round(1350 / speed));

    return () => window.clearInterval(interval);
  }, [phase, speed, tick]);

  // Avoid a tutorial flash before localStorage is read on the client.
  if (!mounted) return <div className="h-screen w-screen bg-[#030a10]" />;

  if (phase === "ended") return <ResultsScreen />;
  if (phase === "ready") return tutorialSeen ? <StartScreen /> : <Onboarding />;
  return <Cockpit />;
}

"use client";

import { create } from "zustand";
import { eveningPeakScenario } from "@/game/scenarios/eveningPeak";
import {
  advanceSimulation,
  applyPlayerAction,
  createInitialGameState,
} from "@/game/engine/simulation";
import type { GamePhase, GameState, PlayerActionType } from "@/game/types";

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  badge: string;
  stability: number;
  aiProductivity: number;
  carbon: number;
  createdAt: string;
}

interface GameStore {
  game: GameState;
  phase: GamePhase;
  speed: 1 | 2 | 4;
  selectedAssetId?: string;
  selectedJobId?: string;
  leaderboard: LeaderboardEntry[];
  startMission: () => void;
  resetMission: (autostart?: boolean) => void;
  tick: () => void;
  pause: () => void;
  resume: () => void;
  togglePause: () => void;
  setSpeed: (speed: 1 | 2 | 4) => void;
  applyAction: (action: PlayerActionType) => void;
  selectAsset: (assetId?: string) => void;
  selectJob: (jobId?: string) => void;
  hydrateLeaderboard: () => void;
  clearLeaderboard: () => void;
}

const leaderboardKey = "grid-defender-leaderboard";

function loadLeaderboard(): LeaderboardEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(leaderboardKey);
    return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : [];
  } catch {
    return [];
  }
}

function persistLeaderboard(entries: LeaderboardEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(leaderboardKey, JSON.stringify(entries.slice(0, 8)));
}

function createLeaderboardEntry(game: GameState): LeaderboardEntry | undefined {
  if (!game.outcome) return undefined;

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "Demo run",
    score: game.outcome.score,
    badge: game.outcome.badge,
    stability: game.metrics.stability,
    aiProductivity: game.metrics.aiProductivity,
    carbon: game.metrics.carbon,
    createdAt: new Date().toISOString(),
  };
}

function saveEndedRun(game: GameState, leaderboard: LeaderboardEntry[]) {
  const entry = createLeaderboardEntry(game);
  if (!entry) return leaderboard;

  const duplicateRecent = leaderboard.some(
    (item) => item.score === entry.score && item.createdAt === entry.createdAt,
  );

  if (duplicateRecent) return leaderboard;

  const next = [entry, ...leaderboard]
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  persistLeaderboard(next);
  return next;
}

const initialGame = createInitialGameState(eveningPeakScenario);

export const useGameStore = create<GameStore>((set, get) => ({
  game: initialGame,
  phase: initialGame.phase,
  speed: 1,
  leaderboard: [],
  startMission: () => {
    const game = createInitialGameState(eveningPeakScenario);
    game.phase = "running";
    set({
      game,
      phase: "running",
      selectedAssetId: "datacenter",
      selectedJobId: "assistant-public",
    });
  },
  resetMission: (autostart = false) => {
    const game = createInitialGameState(eveningPeakScenario);
    game.phase = autostart ? "running" : "ready";
    set({
      game,
      phase: game.phase,
      selectedAssetId: autostart ? "datacenter" : undefined,
      selectedJobId: autostart ? "assistant-public" : undefined,
    });
  },
  tick: () => {
    const { game, phase, leaderboard } = get();
    if (phase !== "running") return;

    const next = advanceSimulation(game);
    const nextLeaderboard =
      next.phase === "ended" && game.phase !== "ended"
        ? saveEndedRun(next, leaderboard)
        : leaderboard;

    set({
      game: next,
      phase: next.phase,
      leaderboard: nextLeaderboard,
    });
  },
  pause: () => {
    const game = { ...get().game, phase: "paused" as const };
    set({ game, phase: "paused" });
  },
  resume: () => {
    const game = { ...get().game, phase: "running" as const };
    set({ game, phase: "running" });
  },
  togglePause: () => {
    const { phase } = get();
    if (phase === "running") get().pause();
    if (phase === "paused") get().resume();
  },
  setSpeed: (speed) => set({ speed }),
  applyAction: (action) => {
    const { game } = get();
    const next = applyPlayerAction(game, action);
    set({ game: next, phase: next.phase });
  },
  selectAsset: (assetId) => set({ selectedAssetId: assetId }),
  selectJob: (jobId) => set({ selectedJobId: jobId }),
  hydrateLeaderboard: () => set({ leaderboard: loadLeaderboard() }),
  clearLeaderboard: () => {
    persistLeaderboard([]);
    set({ leaderboard: [] });
  },
}));

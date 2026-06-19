"use client";

import { create } from "zustand";
import { getMapDefinition } from "@/content/maps/mapRegistry";
import { defaultMissionId, getMissionDefinition, isCampaignMissionId } from "@/content/missions/missionRegistry";
import {
  advanceSimulation,
  applyPlayerAction,
  createInitialGameState,
} from "@/game/engine/simulation";
import { advanceSimulationAsync } from "@/game/worker/simulationWorkerClient";
import type { CampaignProgress, MissionProgress } from "@/game/progression/campaignProgress";
import { betterMedal, emptyCampaignProgress, normalizeCampaignProgress } from "@/game/progression/campaignProgress";
import { medalForMissionRun } from "@/game/progression/missionRating";
import type {
  CommandTarget,
  GamePhase,
  GameState,
  PlayerActionType,
  PlayerCommand,
  Scenario,
  ScenarioRunMode,
} from "@/game/types";
import type { SelectedEntity } from "@/game/network/networkTypes";
import {
  coerceViewLayer,
  defaultGamePreferences,
  loadGamePreferences,
  persistGamePreferences,
  type GamePreferences,
  type RenderQuality,
  type SimulationSpeed,
  type ViewLayer,
} from "@/store/gamePreferences";

export type { RenderQuality, SimulationSpeed, ViewLayer } from "@/store/gamePreferences";

export interface LeaderboardEntry {
  id: string;
  name: string;
  mode: ScenarioRunMode;
  scenarioId: string;
  scenarioName: string;
  seed?: string;
  score: number;
  badge: string;
  stability: number;
  aiProductivity: number;
  carbon: number;
  createdAt: string;
}

export interface DemoActionCue {
  action: PlayerActionType;
  target?: CommandTarget;
  targetLabel?: string;
  minute: number;
  serial: number;
}

export interface SpeechLogEntry {
  id: string;
  minute: number;
  serial: number;
  text: string;
  voiceLang: string;
  voiceName?: string;
}

interface GameStore {
  game: GameState;
  phase: GamePhase;
  demoMode: boolean;
  lastDemoAction?: DemoActionCue;
  speechLog: SpeechLogEntry[];
  speed: SimulationSpeed;
  selectedEntity?: SelectedEntity;
  selectedMissionId: string;
  viewLayer: ViewLayer;
  renderQuality: RenderQuality;
  audioEnabled: boolean;
  progress: CampaignProgress;
  leaderboard: LeaderboardEntry[];
  tutorialSeen: boolean;
  introOpen: boolean;
  startMission: (missionId?: string) => void;
  startDemoMission: (missionId?: string) => void;
  startScenario: (scenario: Scenario) => void;
  resetMission: (autostart?: boolean) => void;
  tick: () => void;
  pause: () => void;
  resume: () => void;
  togglePause: () => void;
  setSpeed: (speed: SimulationSpeed) => void;
  applyAction: (action: PlayerActionType | PlayerCommand, target?: CommandTarget) => void;
  noteDemoAction: (cue: Omit<DemoActionCue, "serial">) => void;
  recordSpeechCue: (cue: Omit<SpeechLogEntry, "serial">) => void;
  selectEntity: (entity?: SelectedEntity) => void;
  selectMission: (missionId: string) => void;
  setViewLayer: (layer: ViewLayer) => void;
  setRenderQuality: (quality: RenderQuality) => void;
  toggleAudio: () => void;
  hydratePreferences: () => void;
  hydrateProgress: () => void;
  hydrateLeaderboard: () => void;
  clearLeaderboard: () => void;
  hydrateTutorial: () => void;
  markTutorialSeen: () => void;
  replayTutorial: () => void;
}

const leaderboardKey = "grid-defender-leaderboard";
const tutorialKey = "grid-defender-tutorial-seen";
const progressKey = "grid-defender-campaign-progress";

function loadTutorialSeen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(tutorialKey) === "1";
  } catch {
    return false;
  }
}

function persistTutorialSeen(seen: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(tutorialKey, seen ? "1" : "0");
}

function loadLeaderboard(): LeaderboardEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(leaderboardKey);
    const values = raw ? (JSON.parse(raw) as unknown[]) : [];
    return values.map(normalizeLeaderboardEntry).filter((entry): entry is LeaderboardEntry => Boolean(entry));
  } catch {
    return [];
  }
}

function persistLeaderboard(entries: LeaderboardEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(leaderboardKey, JSON.stringify(entries.slice(0, 8)));
}

function loadProgress(): CampaignProgress {
  if (typeof window === "undefined") return emptyCampaignProgress;
  try {
    const raw = window.localStorage.getItem(progressKey);
    return raw ? normalizeCampaignProgress(JSON.parse(raw) as Partial<CampaignProgress>) : emptyCampaignProgress;
  } catch {
    return emptyCampaignProgress;
  }
}

function persistProgress(progress: CampaignProgress) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(progressKey, JSON.stringify(progress));
}

function normalizeLeaderboardEntry(value: unknown): LeaderboardEntry | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Partial<LeaderboardEntry>;
  if (typeof candidate.score !== "number" || typeof candidate.badge !== "string") return undefined;
  return {
    id: typeof candidate.id === "string" ? candidate.id : `${Date.now()}-legacy`,
    name: typeof candidate.name === "string" ? candidate.name : "Demo run",
    mode: candidate.mode ?? "campaign",
    scenarioId: typeof candidate.scenarioId === "string" ? candidate.scenarioId : "legacy",
    scenarioName: typeof candidate.scenarioName === "string" ? candidate.scenarioName : "Ancien run",
    seed: typeof candidate.seed === "string" ? candidate.seed : undefined,
    score: candidate.score,
    badge: candidate.badge,
    stability: typeof candidate.stability === "number" ? candidate.stability : 0,
    aiProductivity: typeof candidate.aiProductivity === "number" ? candidate.aiProductivity : 0,
    carbon: typeof candidate.carbon === "number" ? candidate.carbon : 0,
    createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : new Date(0).toISOString(),
  };
}

export function leaderboardModeForScenario(scenario: Pick<Scenario, "id" | "runMode">): ScenarioRunMode {
  if (scenario.runMode) return scenario.runMode;
  return isCampaignMissionId(scenario.id) ? "campaign" : "scenario-builder";
}

export function createLeaderboardEntry(game: GameState): LeaderboardEntry | undefined {
  if (!game.outcome) return undefined;

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "Demo run",
    mode: leaderboardModeForScenario(game.scenario),
    scenarioId: game.scenario.id,
    scenarioName: game.scenario.name,
    seed: game.scenario.seed,
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

function updateMissionProgress(game: GameState, progress: CampaignProgress): CampaignProgress {
  if (!game.outcome) return progress;
  const missionId = game.scenario.id;
  if (!isCampaignMissionId(missionId)) return progress;
  const previous: MissionProgress = progress.missions[missionId] ?? {
    bestScore: 0,
    bestMedal: "none",
  };
  const next: CampaignProgress = {
    unlockedRewards: [...new Set([...progress.unlockedRewards, ...game.scenario.rewards])],
    missions: {
      ...progress.missions,
      [missionId]: {
        bestScore: Math.max(previous.bestScore, game.outcome.score),
        bestMedal: betterMedal(
          previous.bestMedal,
          medalForMissionRun(game, getMissionDefinition(missionId).medalThresholds),
        ),
        completedAt: new Date().toISOString(),
      },
    },
  };
  persistProgress(next);
  return next;
}

function tacticalFocus(game: GameState): SelectedEntity | undefined {
  const tripped = game.grid.lines.find((line) => line.tripped && line.isCritical) ?? game.grid.lines.find((line) => line.tripped);
  if (tripped) return { kind: "line", id: tripped.id };

  const stressedLine = [...game.grid.lines]
    .filter((line) => !line.tripped)
    .sort((a, b) => b.utilizationRatio - a.utilizationRatio)[0];
  if (stressedLine && stressedLine.utilizationRatio >= 0.94) {
    return { kind: "line", id: stressedLine.id };
  }

  const criticalNode = game.grid.nodes.find((node) => node.criticality === "critical" && node.demandMw - node.servedDemandMw > 1);
  return criticalNode ? { kind: "node", id: criticalNode.id } : undefined;
}

const initialMission = getMissionDefinition(defaultMissionId);
const initialGame = createInitialGameState(initialMission.scenario);
let workerTickInFlight = false;

function preferencesFromState(state: Pick<GameStore, "audioEnabled" | "renderQuality" | "speed" | "viewLayer">): GamePreferences {
  return {
    audioEnabled: state.audioEnabled,
    renderQuality: state.renderQuality,
    speed: state.speed,
    viewLayer: state.viewLayer,
  };
}

function viewLayerForScenario(scenario: Pick<Scenario, "mapId">, requested: ViewLayer): ViewLayer {
  return coerceViewLayer(requested, getMapDefinition(scenario.mapId));
}

function demoScenarioForMission(missionId: string): Scenario {
  const mission = getMissionDefinition(missionId);
  return {
    ...mission.scenario,
    id: `demo-${mission.scenario.id}`,
    name: `Démo ATHENA · ${mission.scenario.name}`,
    rewards: [],
    runMode: "sandbox",
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: initialGame,
  phase: initialGame.phase,
  demoMode: false,
  speechLog: [],
  speed: defaultGamePreferences.speed,
  selectedMissionId: initialMission.id,
  viewLayer: defaultGamePreferences.viewLayer,
  renderQuality: defaultGamePreferences.renderQuality,
  audioEnabled: defaultGamePreferences.audioEnabled,
  progress: emptyCampaignProgress,
  leaderboard: [],
  tutorialSeen: false,
  introOpen: false,
  startMission: (missionId) => {
    const selectedMissionId = missionId ?? get().selectedMissionId;
    const mission = getMissionDefinition(selectedMissionId);
    const game = createInitialGameState(mission.scenario);
    const viewLayer = viewLayerForScenario(mission.scenario, get().viewLayer);
    game.phase = "running";
    set({
      game,
      phase: "running",
      demoMode: false,
      lastDemoAction: undefined,
      speechLog: [],
      selectedMissionId: mission.id,
      selectedEntity: undefined,
      viewLayer,
    });
  },
  startDemoMission: (missionId = "paris-peak") => {
    const mission = getMissionDefinition(missionId);
    const scenario = demoScenarioForMission(mission.id);
    const game = createInitialGameState(scenario);
    const viewLayer = viewLayerForScenario(scenario, get().viewLayer);
    game.phase = "running";
    set({
      game,
      phase: "running",
      demoMode: true,
      lastDemoAction: undefined,
      speechLog: [],
      selectedMissionId: mission.id,
      selectedEntity: undefined,
      viewLayer,
    });
  },
  startScenario: (scenario) => {
    const game = createInitialGameState(scenario);
    const viewLayer = viewLayerForScenario(scenario, get().viewLayer);
    game.phase = "running";
    set({
      game,
      phase: "running",
      demoMode: false,
      lastDemoAction: undefined,
      speechLog: [],
      selectedEntity: undefined,
      viewLayer,
    });
  },
  resetMission: (autostart = false) => {
    const activeScenario = get().game.scenario;
    const game = createInitialGameState(activeScenario);
    const viewLayer = viewLayerForScenario(activeScenario, get().viewLayer);
    game.phase = autostart ? "running" : "ready";
    set({
      game,
      phase: game.phase,
      lastDemoAction: undefined,
      speechLog: [],
      selectedEntity: undefined,
      viewLayer,
    });
  },
  tick: () => {
    const { game, phase } = get();
    if (phase !== "running") return;
    if (workerTickInFlight) return;

    workerTickInFlight = true;
    advanceSimulationAsync(game)
      .catch(() => {
        const current = get();
        if (current.game !== game || current.phase !== "running") return undefined;
        try {
          return advanceSimulation(current.game);
        } catch {
          return undefined;
        }
      })
      .then((next) => {
        workerTickInFlight = false;
        if (!next) return;
        const current = get();
        if (current.game !== game || current.phase !== "running") return;

        const nextLeaderboard =
          next.phase === "ended" && game.phase !== "ended"
            ? saveEndedRun(next, current.leaderboard)
            : current.leaderboard;
        const nextProgress =
          next.phase === "ended" && game.phase !== "ended"
            ? updateMissionProgress(next, current.progress)
            : current.progress;

        set({
          game: next,
          phase: next.phase,
          selectedEntity: next.phase === "paused" ? tacticalFocus(next) ?? current.selectedEntity : current.selectedEntity,
          leaderboard: nextLeaderboard,
          progress: nextProgress,
        });
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
  setSpeed: (speed) =>
    set((state) => {
      persistGamePreferences({ ...preferencesFromState(state), speed });
      return { speed };
    }),
  applyAction: (action, target) => {
    const { game } = get();
    const command = typeof action === "string" ? { action, target } : { ...action, target: action.target ?? target };
    const next = applyPlayerAction(game, command);
    set({ game: next, phase: next.phase });
  },
  noteDemoAction: (cue) =>
    set((state) => ({
      lastDemoAction: {
        ...cue,
        serial: (state.lastDemoAction?.serial ?? 0) + 1,
      },
    })),
  recordSpeechCue: (cue) =>
    set((state) => ({
      speechLog: [
        {
          ...cue,
          serial: (state.speechLog[0]?.serial ?? 0) + 1,
        },
        ...state.speechLog,
      ].slice(0, 16),
    })),
  selectEntity: (entity) => set({ selectedEntity: entity }),
  selectMission: (missionId) => {
    const mission = getMissionDefinition(missionId);
    const game = createInitialGameState(mission.scenario);
    const viewLayer = viewLayerForScenario(mission.scenario, get().viewLayer);
    set({
      selectedMissionId: mission.id,
      game,
      phase: "ready",
      demoMode: false,
      lastDemoAction: undefined,
      speechLog: [],
      selectedEntity: undefined,
      viewLayer,
    });
  },
  setViewLayer: (viewLayer) =>
    set((state) => {
      const nextViewLayer = coerceViewLayer(viewLayer, getMapDefinition(state.game.scenario.mapId));
      persistGamePreferences({ ...preferencesFromState(state), viewLayer: nextViewLayer });
      return { viewLayer: nextViewLayer };
    }),
  setRenderQuality: (renderQuality) =>
    set((state) => {
      persistGamePreferences({ ...preferencesFromState(state), renderQuality });
      return { renderQuality };
    }),
  toggleAudio: () =>
    set((state) => {
      const audioEnabled = !state.audioEnabled;
      persistGamePreferences({ ...preferencesFromState(state), audioEnabled });
      return { audioEnabled };
    }),
  hydratePreferences: () => {
    const preferences = loadGamePreferences();
    set((state) => ({
      ...preferences,
      viewLayer: coerceViewLayer(preferences.viewLayer, getMapDefinition(state.game.scenario.mapId)),
    }));
  },
  hydrateProgress: () => set({ progress: loadProgress() }),
  hydrateLeaderboard: () => set({ leaderboard: loadLeaderboard() }),
  clearLeaderboard: () => {
    persistLeaderboard([]);
    set({ leaderboard: [] });
  },
  hydrateTutorial: () => {
    const tutorialSeen = loadTutorialSeen();
    set({ tutorialSeen, introOpen: !tutorialSeen });
  },
  markTutorialSeen: () => {
    persistTutorialSeen(true);
    set({ tutorialSeen: true, introOpen: false });
  },
  replayTutorial: () => {
    set({ introOpen: true });
  },
}));

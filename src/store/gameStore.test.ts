import assert from "node:assert/strict";
import test from "node:test";
import { getMissionDefinition } from "@/content/missions/missionRegistry";
import { buildCrisisRun } from "@/content/modes/crisisRun";
import { getDailyChallenge } from "@/content/modes/dailyChallenge";
import { buildSandboxScenario, defaultSandboxOptions } from "@/content/modes/sandbox";
import { createInitialGameState } from "@/game/engine/simulation";
import { createLeaderboardEntry, leaderboardModeForScenario, useGameStore } from "@/store/gameStore";

test("resetMission replays the active generated scenario instead of the selected campaign mission", () => {
  const sandbox = buildSandboxScenario({
    ...defaultSandboxOptions,
    mapId: "rhone-corridor",
    difficulty: "expert",
    seed: "store-reset-sandbox",
  });

  useGameStore.getState().selectMission("paris-peak");
  useGameStore.getState().startScenario(sandbox);

  assert.equal(useGameStore.getState().selectedMissionId, "paris-peak");
  assert.equal(useGameStore.getState().game.scenario.id, sandbox.id);

  useGameStore.getState().resetMission(true);

  const state = useGameStore.getState();
  assert.equal(state.phase, "running");
  assert.equal(state.game.phase, "running");
  assert.equal(state.game.scenario.id, sandbox.id);
  assert.equal(state.game.scenario.mapId, "rhone-corridor");
  assert.equal(state.game.scenario.difficulty, "expert");
  assert.equal(state.game.minute, sandbox.startMinute);
});

test("leaderboard metadata keeps generated modes comparable", () => {
  const campaign = getMissionDefinition("paris-peak").scenario;
  const daily = getDailyChallenge(new Date("2026-06-19T12:00:00.000Z")).scenario;
  const crisis = buildCrisisRun("leaderboard-seed")[0].scenario;
  const sandbox = buildSandboxScenario({
    ...defaultSandboxOptions,
    seed: "leaderboard-sandbox",
  });

  assert.equal(leaderboardModeForScenario(campaign), "campaign");
  assert.equal(leaderboardModeForScenario(daily), "daily-challenge");
  assert.equal(leaderboardModeForScenario(crisis), "crisis-run");
  assert.equal(leaderboardModeForScenario(sandbox), "sandbox");

  const game = createInitialGameState(daily);
  game.outcome = {
    result: "victory",
    score: 640,
    badge: "Daily test",
    summary: "ok",
    objectiveResults: [],
  };

  const entry = createLeaderboardEntry(game);
  assert.equal(entry?.mode, "daily-challenge");
  assert.equal(entry?.scenarioId, daily.id);
  assert.equal(entry?.scenarioName, daily.name);
  assert.equal(entry?.seed, "2026-06-19");
});

test("demo mission starts an isolated ATHENA-controlled run", () => {
  useGameStore.getState().startDemoMission();

  let state = useGameStore.getState();
  assert.equal(state.demoMode, true);
  assert.equal(state.phase, "running");
  assert.equal(state.game.scenario.id, "demo-paris-peak");
  assert.equal(state.game.scenario.runMode, "sandbox");
  assert.equal(state.selectedMissionId, "paris-peak");

  useGameStore.getState().startMission("tutorial-microgrid");
  state = useGameStore.getState();
  assert.equal(state.demoMode, false);
  assert.equal(state.lastDemoAction, undefined);
  assert.equal(state.game.scenario.id, "tutorial-microgrid");
});

test("speech cue log stores the exact text sent to TTS", () => {
  useGameStore.setState({ speechLog: [] });

  useGameStore.getState().recordSpeechCue({
    id: "tts-1",
    minute: 18 * 60 + 15,
    text: "ATHENA alerte. Réseau sécurisé.",
    voiceLang: "fr-FR",
    voiceName: "Thomas",
  });

  const [entry] = useGameStore.getState().speechLog;
  assert.equal(entry.text, "ATHENA alerte. Réseau sécurisé.");
  assert.equal(entry.voiceLang, "fr-FR");
  assert.equal(entry.voiceName, "Thomas");
  assert.equal(entry.serial, 1);
});

test("tutorial hydration opens intro only for first-time visitors", () => {
  const storage = new Map<string, string>();
  const previousWindow = globalThis.window;
  const hadWindow = "window" in globalThis;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    },
  });

  try {
    useGameStore.setState({ introOpen: false, tutorialSeen: true });
    useGameStore.getState().hydrateTutorial();

    assert.equal(useGameStore.getState().tutorialSeen, false);
    assert.equal(useGameStore.getState().introOpen, true);

    useGameStore.getState().markTutorialSeen();
    useGameStore.setState({ introOpen: true, tutorialSeen: false });
    useGameStore.getState().hydrateTutorial();

    assert.equal(useGameStore.getState().tutorialSeen, true);
    assert.equal(useGameStore.getState().introOpen, false);
  } finally {
    if (hadWindow) {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: previousWindow,
      });
    } else {
      delete (globalThis as { window?: unknown }).window;
    }
  }
});

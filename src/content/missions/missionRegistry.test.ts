import assert from "node:assert/strict";
import test from "node:test";
import { defaultMissionId, getMissionDefinition, getNextCampaignMissionDefinition, missionRegistry } from "@/content/missions/missionRegistry";
import { applyPlayerAction, advanceSimulation, createInitialGameState } from "@/game/engine/simulation";
import { hasUnlockedReward, isMissionUnlocked, normalizeCampaignProgress } from "@/game/progression/campaignProgress";
import type { CampaignProgress } from "@/game/progression/campaignProgress";
import type { GameState, PlayerCommand, Scenario } from "@/game/types";

test("campaign exposes the full eight-mission arc across distinct maps including Europe 2030", () => {
  const mapIds = new Set(missionRegistry.map((mission) => mission.mapId));
  assert.equal(missionRegistry.length, 8);
  assert.equal(mapIds.size >= 5, true);
  assert.equal(getMissionDefinition(defaultMissionId).id, defaultMissionId);
  assert.equal(getMissionDefinition("black-grid").scenario.telemetry?.mode, "blackout");
  assert.equal(getMissionDefinition("rhone-corridor").unlockAfter, "atlantic-storm");
  assert.equal(getMissionDefinition("sovereign-ai").unlockAfter, "rhone-corridor");
  assert.equal(getMissionDefinition("europe-2030").scenario.mapId, "europe-2030");
  for (const mission of missionRegistry) {
    assert.ok(mission.scenario.objectiveChecks.length >= 3, mission.id);
  }
});

test("initial mission metrics match the solved grid totals", () => {
  for (const mission of missionRegistry) {
    const state = createInitialGameState(mission.scenario);
    const production = state.grid.nodes.reduce((total, node) => total + node.productionMw, 0);
    const demand = state.grid.nodes.reduce((total, node) => total + node.demandMw, 0);

    assert.ok(Math.abs(production - state.metrics.productionMw) < 0.2, `${mission.id} production`);
    assert.ok(Math.abs(demand - state.metrics.demandMw) < 0.2, `${mission.id} demand`);
    assert.equal(state.timeline.length, 1, `${mission.id} initial timeline`);
    assert.equal(state.timeline[0]?.minute, state.minute, `${mission.id} initial timeline minute`);
  }
});

test("campaign exposes the next mission in ordered progression", () => {
  assert.equal(getNextCampaignMissionDefinition("tutorial-microgrid")?.id, "paris-peak");
  assert.equal(getNextCampaignMissionDefinition("black-grid")?.id, "europe-2030");
  assert.equal(getNextCampaignMissionDefinition("europe-2030"), undefined);
  assert.equal(getNextCampaignMissionDefinition("custom-sandbox"), undefined);
});

test("campaign standard events carry declarative runtime effects", () => {
  const standardEventIds = new Set(["ev-surge", "video-job", "solar-drop", "cyber-job", "agent-loop"]);

  for (const mission of missionRegistry) {
    for (const event of mission.scenario.events) {
      if (!standardEventIds.has(event.id)) continue;

      assert.ok(event.source, `${mission.id}:${event.id} should declare an incident source`);
      assert.ok(event.effects?.length, `${mission.id}:${event.id} should declare runtime effects`);
      assert.ok(event.resolvesWhen?.length, `${mission.id}:${event.id} should declare resolution rules`);

      if (event.id === "ev-surge") {
        assert.ok(event.effects.some((effect) => effect.type === "set_flag" && effect.flag === "evSurge"));
      }
      if (event.id === "solar-drop") {
        assert.ok(event.effects.some((effect) => effect.type === "set_flag" && effect.flag === "solarDrop"));
        assert.ok(event.effects.some((effect) => effect.type === "set_flag" && effect.flag === "residentialPeak"));
      }
      if (event.id === "video-job") {
        assert.ok(event.effects.some((effect) => effect.type === "activate_ai_job" && effect.jobId === "video-demo"));
      }
      if (event.id === "cyber-job") {
        assert.ok(event.effects.some((effect) => effect.type === "set_flag" && effect.flag === "cyberPriority"));
        assert.ok(event.effects.some((effect) => effect.type === "activate_ai_job" && effect.jobId === "cyber-critical"));
      }
      if (event.id === "agent-loop") {
        assert.ok(event.effects.some((effect) => effect.type === "set_flag" && effect.flag === "agentLoop"));
        assert.ok(event.effects.some((effect) => effect.type === "activate_ai_job" && effect.jobId === "looping-agent"));
      }
    }
  }
});

test("campaign missions introduce command tools progressively", () => {
  const tutorial = getMissionDefinition("tutorial-microgrid").scenario.availableActions ?? [];
  const paris = getMissionDefinition("paris-peak").scenario.availableActions ?? [];
  const atlantic = getMissionDefinition("atlantic-storm").scenario.availableActions ?? [];
  const rhone = getMissionDefinition("rhone-corridor").scenario.availableActions ?? [];
  const sovereign = getMissionDefinition("sovereign-ai").scenario.availableActions ?? [];

  assert.deepEqual(tutorial, ["discharge_battery", "smart_ev", "defer_ai"]);
  assert.equal(tutorial.includes("repair_line"), false);
  assert.equal(tutorial.includes("externalize_ai"), false);
  assert.equal(paris.includes("migrate_ai"), true);
  assert.equal(paris.includes("activate_cache"), true);
  assert.equal(paris.includes("repair_line"), false);
  assert.equal(atlantic.includes("repair_line"), true);
  assert.equal(rhone.includes("curtail_industry"), true);
  assert.equal(sovereign.includes("externalize_ai"), true);
});

test("mission unlocks follow previous medal progression", () => {
  const paris = getMissionDefinition("paris-peak");
  assert.equal(isMissionUnlocked({ missions: {}, unlockedRewards: [] }, paris.id, paris.unlockAfter), false);

  const progress: CampaignProgress = {
    unlockedRewards: [],
    missions: {
      "tutorial-microgrid": {
        bestScore: 700,
        bestMedal: "silver",
      },
    },
  };

  assert.equal(isMissionUnlocked(progress, paris.id, paris.unlockAfter), true);
});

test("campaign progress normalizes legacy saves and reward unlocks", () => {
  const progress = normalizeCampaignProgress({ missions: {} });
  assert.deepEqual(progress.unlockedRewards, []);
  assert.equal(hasUnlockedReward(progress, "mode-daily-challenge"), false);
  assert.equal(hasUnlockedReward({ ...progress, unlockedRewards: ["mode-daily-challenge"] }, "mode-daily-challenge"), true);
});

function scriptedCommands(state: GameState): PlayerCommand[] {
  const actionIsAvailable = (action: PlayerCommand["action"]) =>
    !state.scenario.availableActions || state.scenario.availableActions.includes(action);

  if (state.scenario.id === "tutorial-microgrid") {
    const tutorialSchedule: Record<number, PlayerCommand[]> = {
      [state.scenario.startMinute]: [
        { action: "discharge_battery", intensityMw: 35 },
        { action: "smart_ev", intensityMw: 25 },
      ],
      [18 * 60 + 25]: [{ action: "defer_ai" }],
      [18 * 60 + 45]: [{ action: "discharge_battery", intensityMw: 20 }],
    };
    return [...(tutorialSchedule[state.minute] ?? [])];
  }
  if (state.scenario.id === "black-grid") {
    const schedule: Record<number, PlayerCommand[]> = {
      [18 * 60]: [
        { action: "smart_ev", intensityMw: 30 },
        { action: "import_energy", intensityMw: 45 },
      ],
      [18 * 60 + 30]: [{ action: "migrate_ai" }, { action: "activate_cache" }],
      [18 * 60 + 50]: [
        { action: "discharge_battery", intensityMw: 45 },
        { action: "thermal_backup", intensityMw: 45 },
      ],
      [19 * 60 + 10]: [
        { action: "reduce_model" },
        { action: "curtail_industry", intensityMw: 20 },
      ],
      [19 * 60 + 30]: [
        { action: "agent_timeout" },
        { action: "import_energy", intensityMw: 45 },
        { action: "thermal_backup", intensityMw: 45 },
      ],
      [20 * 60]: [
        { action: "discharge_battery", intensityMw: 30 },
        { action: "import_energy", intensityMw: 35 },
        { action: "thermal_backup", intensityMw: 35 },
      ],
    };
    const commands = [...(schedule[state.minute] ?? [])];
    const phantomLine = state.grid.lines.find((line) => line.id === "paris-lyon");
    if (state.minute === 18 * 60 + 45 && phantomLine?.tripped) {
      commands.push({ action: "repair_line", target: { kind: "line", id: phantomLine.id } });
    }
    return commands;
  }
  if (state.scenario.id === "rhone-corridor") {
    const schedule: Record<number, PlayerCommand[]> = {
      [17 * 60 + 30]: [
        { action: "smart_ev", intensityMw: 30 },
        { action: "import_energy", intensityMw: 45 },
      ],
      [18 * 60]: [{ action: "discharge_battery", intensityMw: 38 }],
      [18 * 60 + 30]: [
        { action: "curtail_industry", intensityMw: 26 },
        { action: "activate_cache" },
      ],
      [18 * 60 + 50]: [
        { action: "authorize_overload", target: { kind: "line", id: "centre-lyon" }, durationMinutes: 20 },
      ],
      [19 * 60 + 15]: [
        { action: "repair_line", target: { kind: "line", id: "centre-lyon" } },
        { action: "import_energy", intensityMw: 40 },
        { action: "thermal_backup", intensityMw: 30 },
      ],
      [19 * 60 + 50]: [
        { action: "agent_timeout" },
        { action: "import_energy", intensityMw: 35 },
        { action: "thermal_backup", intensityMw: 30 },
      ],
    };
    return [...(schedule[state.minute] ?? [])];
  }
  if (state.scenario.id === "europe-2030") {
    const schedule: Record<number, PlayerCommand[]> = {
      [18 * 60]: [
        { action: "smart_ev", intensityMw: 35 },
        { action: "import_energy", intensityMw: 45 },
      ],
      [18 * 60 + 20]: [{ action: "migrate_ai" }, { action: "activate_cache" }],
      [18 * 60 + 45]: [{ action: "authorize_overload", target: { kind: "line", id: "normandy-interconnect" } }],
      [18 * 60 + 50]: [
        { action: "discharge_battery", intensityMw: 45 },
        { action: "thermal_backup", intensityMw: 45 },
      ],
      [19 * 60 + 10]: [{ action: "curtail_industry", intensityMw: 30 }],
      [19 * 60 + 30]: [{ action: "import_energy", intensityMw: 45 }],
      [19 * 60 + 45]: [{ action: "agent_timeout" }, { action: "reduce_model" }],
      [20 * 60]: [
        { action: "thermal_backup", intensityMw: 45 },
        { action: "discharge_battery", intensityMw: 35 },
      ],
      [20 * 60 + 20]: [{ action: "import_energy", intensityMw: 35 }],
    };
    const commands = [...(schedule[state.minute] ?? [])];
    const interconnect = state.grid.lines.find((line) => line.id === "normandy-interconnect");
    if (state.minute === 19 * 60 + 15 && interconnect?.tripped) {
      commands.push({ action: "repair_line", target: { kind: "line", id: interconnect.id } });
    }
    return commands;
  }

  const schedule: Record<number, PlayerCommand[]> = {
    [Math.max(state.scenario.startMinute, 18 * 60)]: [
      { action: "smart_ev", intensityMw: 30 },
      { action: "import_energy", intensityMw: 45 },
    ],
    [18 * 60 + 30]: [{ action: "migrate_ai" }, { action: "activate_cache" }],
    [18 * 60 + 50]: [
      { action: "discharge_battery", intensityMw: 45 },
      { action: "thermal_backup", intensityMw: 45 },
    ],
    [19 * 60 + 10]: [
      { action: "reduce_model" },
    ],
    [19 * 60 + 30]: [{ action: "agent_timeout" }],
    [19 * 60 + 50]: [
      { action: "import_energy", intensityMw: 35 },
      { action: "thermal_backup", intensityMw: 35 },
    ],
    [20 * 60 + 20]: [{ action: "discharge_battery", intensityMw: 30 }],
  };
  const commands = [...(schedule[state.minute] ?? [])];
  if (state.minute === 19 * 60 + 10) {
    commands.push(
      actionIsAvailable("curtail_industry")
        ? { action: "curtail_industry", intensityMw: 20 }
        : { action: "import_energy", intensityMw: 25 },
    );
  }
  const phantomLine = state.grid.lines.find((line) => line.id === "paris-lyon");
  if (state.minute === 18 * 60 + 45 && phantomLine?.tripped) {
    commands.push({ action: "repair_line", target: { kind: "line", id: phantomLine.id } });
  }
  return commands;
}

function runMission(scenario: Scenario, commandsForState: (state: GameState) => PlayerCommand[] = () => []) {
  let state = createInitialGameState(scenario);
  state.phase = "running";

  while (state.phase !== "ended") {
    for (const command of commandsForState(state)) {
      state = applyPlayerAction(state, command);
    }
    state = advanceSimulation(state);
  }

  return state;
}

function runScriptedMission(scenario: Scenario) {
  return runMission(scenario, scriptedCommands);
}

test("every campaign mission is winnable with a non-perfect stabilization script", () => {
  for (const mission of missionRegistry) {
    const state = runScriptedMission(mission.scenario);
    assert.equal(state.outcome?.result, "victory", mission.id);
    assert.equal(Number.isFinite(state.metrics.score), true, mission.id);
    assert.equal(Number.isFinite(state.cumulative.unservedEnergyMwh), true, mission.id);
    assert.ok(state.metrics.criticalContinuity >= 75, mission.id);
    assert.ok(state.cumulative.commandCapacitySpent > 0, mission.id);
    assert.equal(state.outcome?.objectiveResults.length, mission.scenario.objectiveChecks.length, mission.id);
    assert.equal(
      state.outcome?.objectiveResults.every((objective) => Number.isFinite(objective.value)),
      true,
      mission.id,
    );
  }
});

test("campaign is not cleared by idling or brute force imports", () => {
  for (const mission of missionRegistry) {
    const idle = runMission(mission.scenario);
    assert.equal(idle.outcome?.result, "failure", `${mission.id} should fail without player actions`);

    const brute = runMission(mission.scenario, (state) => {
      const bruteMinutes = [
        state.scenario.startMinute,
        state.scenario.startMinute + 35,
        state.scenario.startMinute + 70,
      ];
      if (!bruteMinutes.includes(state.minute)) return [];
      return [
        { action: "import_energy", intensityMw: 45 },
        { action: "thermal_backup", intensityMw: 45 },
      ];
    });

    if (mission.scenario.difficulty === "tutorial") {
      assert.ok(
        (brute.outcome?.score ?? 0) < mission.medalThresholds.bronze,
        `${mission.id} brute force should not earn a medal`,
      );
    } else {
      assert.equal(brute.outcome?.result, "failure", `${mission.id} should reject brute force imports`);
    }
  }
});

test("mission map ids produce distinct runtime layouts", () => {
  const tutorial = createInitialGameState(getMissionDefinition("tutorial-microgrid").scenario);
  const paris = createInitialGameState(getMissionDefinition("paris-peak").scenario);
  const corsica = createInitialGameState(getMissionDefinition("corsica-islanding").scenario);
  const nodeId = "paris-saclay-ai";

  assert.notDeepEqual(
    tutorial.grid.nodes.find((node) => node.id === nodeId)?.position,
    paris.grid.nodes.find((node) => node.id === nodeId)?.position,
  );
  assert.notDeepEqual(
    corsica.grid.nodes.find((node) => node.id === nodeId)?.position,
    paris.grid.nodes.find((node) => node.id === nodeId)?.position,
  );
});

test("mission map ids produce distinct electrical constraints", () => {
  const tutorial = createInitialGameState(getMissionDefinition("tutorial-microgrid").scenario);
  const paris = createInitialGameState(getMissionDefinition("paris-peak").scenario);
  const corsica = createInitialGameState(getMissionDefinition("corsica-islanding").scenario);

  assert.notEqual(
    tutorial.grid.lines.find((line) => line.id === "normandy-paris")?.nominalCapacityMw,
    paris.grid.lines.find((line) => line.id === "normandy-paris")?.nominalCapacityMw,
  );
  assert.notEqual(
    corsica.grid.lines.find((line) => line.id === "interconnect-paris")?.nominalCapacityMw,
    paris.grid.lines.find((line) => line.id === "interconnect-paris")?.nominalCapacityMw,
  );
  assert.notEqual(
    tutorial.grid.nodes.find((node) => node.id === "centre-battery")?.label,
    paris.grid.nodes.find((node) => node.id === "centre-battery")?.label,
  );
});

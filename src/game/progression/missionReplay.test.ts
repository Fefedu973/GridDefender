import assert from "node:assert/strict";
import test from "node:test";
import type { ActionRecord, CriticalMoment, TimelineSnapshot } from "@/game/types";
import { createMissionReplay } from "@/game/progression/missionReplay";

function point(minute: number, stability: number, productionMw: number, demandMw: number): TimelineSnapshot {
  return {
    minute,
    label: `${minute}`,
    productionMw,
    demandMw,
    stability,
    batteryLevel: 50,
    aiLoadMw: 20,
    carbon: 80,
    score: stability * 8,
  };
}

const moment: CriticalMoment = {
  id: "moment-1",
  minute: 19 * 60,
  label: "19:00",
  severity: "critical",
  kind: "line",
  title: "Surcharge Paris-Lyon",
  description: "Le couloir a depasse sa limite thermique.",
  entityId: "paris-lyon",
  entityLabel: "Paris-Lyon",
  stability: 31,
  maxUtilization: 1.22,
  reserveMw: -18,
};

test("mission replay builds a bounded window around the critical moment", () => {
  const replay = createMissionReplay({
    moment,
    timeline: [
      point(18 * 60 + 30, 74, 170, 150),
      point(18 * 60 + 45, 54, 172, 180),
      point(19 * 60, 31, 174, 204),
      point(19 * 60 + 10, 48, 190, 196),
      point(19 * 60 + 25, 65, 204, 184),
      point(19 * 60 + 45, 82, 220, 176),
    ],
    actions: [],
    beforeMinutes: 20,
    afterMinutes: 25,
  });

  assert.ok(replay);
  assert.deepEqual(
    replay.frames.map((frame) => frame.minute),
    [18 * 60 + 45, 19 * 60, 19 * 60 + 10, 19 * 60 + 25],
  );
  assert.equal(replay.frames.find((frame) => frame.role === "incident")?.minute, 19 * 60);
  assert.equal(replay.stabilityRecovery, 34);
  assert.equal(replay.reserveRecoveryMw, 50);
  assert.equal(replay.peakDemandMw, 204);
});

test("mission replay keeps only post-incident player responses in chronological order", () => {
  const actions: ActionRecord[] = [
    {
      id: "late",
      minute: 19 * 60 + 40,
      type: "thermal_backup",
      label: "Thermique",
      result: "Too late",
      impact: "mixed",
    },
    {
      id: "before",
      minute: 18 * 60 + 50,
      type: "smart_ev",
      label: "EV smart",
      result: "Before incident",
      impact: "positive",
    },
    {
      id: "after",
      minute: 19 * 60 + 5,
      type: "discharge_battery",
      label: "Decharger batterie",
      result: "Response",
      impact: "positive",
      targetLabel: "Batterie Est",
      cost: 20,
      feedback: {
        comboLabel: "Réponse coordonnée",
        comboLevel: 2,
        maxUtilizationDeltaPct: -12,
        relievedLineIds: ["line-a"],
        reserveDeltaMw: 20,
        resolvedIncidentCount: 0,
        scoreDelta: 0,
        stabilityDelta: 0,
        tacticalScore: 31,
      },
    },
  ];

  const replay = createMissionReplay({
    moment,
    timeline: [point(18 * 60 + 55, 38, 170, 198), point(19 * 60 + 5, 47, 190, 184), point(19 * 60 + 20, 63, 202, 178)],
    actions,
    afterMinutes: 25,
  });

  assert.ok(replay);
  assert.deepEqual(
    replay.actions.map((action) => action.actionLabel),
    ["Decharger batterie"],
  );
  assert.equal(replay.actions[0]?.targetLabel, "Batterie Est");
  assert.equal(replay.actions[0]?.cost, 20);
  assert.equal(replay.actions[0]?.comboLabel, "Réponse coordonnée");
  assert.equal(replay.actions[0]?.tacticalScore, 31);
});

import assert from "node:assert/strict";
import test from "node:test";
import { captureActionFeedbackState, createActionFeedback } from "@/game/commands/actionFeedback";
import type { GameState } from "@/game/types";

function state(overrides: Partial<GameState>): GameState {
  return {
    grid: {
      lines: [
        {
          id: "line-a",
          utilizationRatio: 1.12,
        },
        {
          id: "line-b",
          utilizationRatio: 0.91,
        },
      ],
      maxUtilization: 1.12,
    },
    incidents: [
      {
        id: "incident-a",
      },
    ],
    metrics: {
      reserveMw: -18,
      score: 420,
      stability: 38,
    },
    ...overrides,
  } as GameState;
}

test("action feedback detects line relief, resolved incidents and combo level", () => {
  const before = captureActionFeedbackState(state({}));
  const feedback = createActionFeedback({
    after: state({
      grid: {
        lines: [
          { id: "line-a", utilizationRatio: 0.88 },
          { id: "line-b", utilizationRatio: 0.8 },
        ],
        maxUtilization: 0.88,
      } as GameState["grid"],
      incidents: [{ id: "incident-a", resolvedAt: 19 * 60 } as GameState["incidents"][number]],
      metrics: { reserveMw: 6, score: 455, stability: 42 } as GameState["metrics"],
    }),
    applied: true,
    before,
    impact: "positive",
  });

  assert.equal(feedback?.comboLevel, 4);
  assert.equal(feedback?.comboLabel, "Combo critique");
  assert.deepEqual(feedback?.relievedLineIds, ["line-a", "line-b"]);
  assert.equal(feedback?.resolvedIncidentCount, 1);
  assert.equal(feedback?.reserveDeltaMw, 24);
  assert.ok((feedback?.tacticalScore ?? 0) > 40);
});

test("action feedback is absent for unapplied commands", () => {
  const before = captureActionFeedbackState(state({}));

  assert.equal(
    createActionFeedback({
      after: state({}),
      applied: false,
      before,
      impact: "negative",
    }),
    undefined,
  );
});

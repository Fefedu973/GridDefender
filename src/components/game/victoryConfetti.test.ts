import assert from "node:assert/strict";
import { test } from "node:test";
import {
  VICTORY_CONFETTI_MAX_FINISH_MS,
  VICTORY_CONFETTI_MIN_DURATION_MS,
  VICTORY_CONFETTI_PIECE_COUNT,
  createVictoryConfettiPieces,
} from "@/components/game/victoryConfetti";

test("victory confetti field is deterministic per mission seed", () => {
  const first = createVictoryConfettiPieces("black-grid:932:gold");
  const second = createVictoryConfettiPieces("black-grid:932:gold");
  const other = createVictoryConfettiPieces("corsica:714:silver");

  assert.deepEqual(first, second);
  assert.notDeepEqual(first.slice(0, 12), other.slice(0, 12));
});

test("victory confetti covers the whole viewport instead of a corner burst", () => {
  const pieces = createVictoryConfettiPieces("coverage-check");
  const xs = pieces.map((piece) => piece.xPct);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const buckets = new Set(xs.map((x) => Math.min(9, Math.floor(x / 10))));

  assert.equal(pieces.length, VICTORY_CONFETTI_PIECE_COUNT);
  assert.ok(minX < 2, `left edge starts at ${minX}`);
  assert.ok(maxX > 98, `right edge ends at ${maxX}`);
  assert.equal(buckets.size, 10);
});

test("victory confetti persists long enough and uses real 3d depth", () => {
  const pieces = createVictoryConfettiPieces("duration-depth-check");
  const finishTimes = pieces.map((piece) => piece.delayMs + piece.durationMs);
  const depths = pieces.map((piece) => piece.depthPx);
  const shapes = new Set(pieces.map((piece) => piece.shape));

  assert.ok(pieces.every((piece) => piece.durationMs >= VICTORY_CONFETTI_MIN_DURATION_MS));
  assert.ok(Math.max(...finishTimes) > 12500);
  assert.ok(Math.max(...finishTimes) <= VICTORY_CONFETTI_MAX_FINISH_MS);
  assert.ok(Math.min(...depths) < -180);
  assert.ok(Math.max(...depths) > 180);
  assert.deepEqual([...shapes].sort(), ["plate", "ribbon", "ring", "spark"].sort());
});


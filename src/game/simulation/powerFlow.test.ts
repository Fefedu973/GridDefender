import assert from "node:assert/strict";
import test from "node:test";
import { solveDcFlow, solveLinear } from "@/game/simulation/powerFlow";

test("linear solver resolves a small system", () => {
  const result = solveLinear(
    [
      [2, 1],
      [1, 3],
    ],
    [5, 6],
  );
  assert.ok(Math.abs(result[0] - 1.8) < 1e-9);
  assert.ok(Math.abs(result[1] - 1.4) < 1e-9);
});

test("DC flow conserves power on a simple chain", () => {
  const flows = solveDcFlow(
    ["a", "b", "c"],
    { a: 10, b: 0, c: -10 },
    [
      { id: "ab", from: "a", to: "b", b: 1, active: true },
      { id: "bc", from: "b", to: "c", b: 1, active: true },
    ],
    "a",
  );

  assert.ok(Math.abs(flows.ab - 10) < 0.01);
  assert.ok(Math.abs(flows.bc - 10) < 0.01);
});

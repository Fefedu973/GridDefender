import assert from "node:assert/strict";
import test from "node:test";
import {
  lineLayerColor,
  lineLayerEmphasis,
  nodeLayerColor,
  nodeLayerEmphasis,
  nodeLayerLabelValue,
} from "@/features/map3d/scene/visuals";

const stableLine = { status: "stable" as const };

function node(overrides = {}) {
  return {
    aiWorkloadIds: [],
    demandMw: 0,
    kind: "city" as const,
    productionMw: 0,
    role: "consumer" as const,
    status: "stable" as const,
    ...overrides,
  };
}

test("AI layer highlights datacenters and dims unrelated nodes", () => {
  const datacenter = node({
    aiWorkloadIds: ["assistant-public", "video-demo"],
    demandMw: 44,
    kind: "datacenter" as const,
  });
  const city = node({ demandMw: 28 });

  assert.equal(nodeLayerColor(datacenter, "ai"), "#22d3ee");
  assert.equal(nodeLayerLabelValue(datacenter, "ai"), "2 jobs");
  assert.ok(nodeLayerEmphasis(datacenter, "ai") > nodeLayerEmphasis(city, "ai"));
  assert.equal(lineLayerColor(stableLine, datacenter, city, "ai"), "#22d3ee");
  assert.ok(lineLayerEmphasis(stableLine, city, node({ kind: "hospital" as const }), "ai") < 0.5);
});

test("carbon layer separates low-carbon supply from import and flexible demand", () => {
  const solar = node({ kind: "solar" as const, productionMw: 40, role: "producer" as const });
  const interconnect = node({ kind: "interconnect" as const, productionMw: 16, role: "connector" as const });
  const ev = node({ demandMw: 30, kind: "ev" as const, role: "consumer" as const });

  assert.equal(nodeLayerColor(solar, "carbon"), "#34f5b0");
  assert.equal(nodeLayerColor(interconnect, "carbon"), "#f59e0b");
  assert.equal(nodeLayerColor(ev, "carbon"), "#ff7a1a");
  assert.equal(lineLayerColor(stableLine, solar, ev, "carbon"), "#34f5b0");
  assert.equal(lineLayerColor(stableLine, interconnect, ev, "carbon"), "#f59e0b");
});

test("critical status still overrides thematic layer colors", () => {
  const criticalDatacenter = node({
    aiWorkloadIds: ["cyber-critical"],
    kind: "datacenter" as const,
    status: "critical" as const,
  });
  const criticalLine = { status: "critical" as const };

  assert.equal(nodeLayerColor(criticalDatacenter, "ai"), "#ff2f5f");
  assert.equal(lineLayerColor(criticalLine, criticalDatacenter, node(), "carbon"), "#ff2f5f");
});

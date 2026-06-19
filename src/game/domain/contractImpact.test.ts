import assert from "node:assert/strict";
import test from "node:test";
import { getContractCurtailmentImpact, getOrganizationFlexOffer } from "@/game/domain/contractImpact";

const baseNode = {
  flexibilityMw: 20,
  maxDemandMw: 60,
};

test("contract curtailment impact is zero without an organization or magnitude", () => {
  assert.deepEqual(getContractCurtailmentImpact(undefined, 20), {
    costPenalty: 0,
    durationPenalty: 0,
    reputationPenalty: 0,
    satisfaction: 0,
  });
  assert.deepEqual(getContractCurtailmentImpact(baseNode, 0), {
    costPenalty: 0,
    durationPenalty: 0,
    reputationPenalty: 0,
    satisfaction: 0,
  });
});

test("critical contracts penalize curtailment more than flexible contracts", () => {
  const flexible = getContractCurtailmentImpact({
    ...baseNode,
    organization: {
      contract: "flexible",
      minCurtailmentMinutes: 20,
      maxCurtailmentMinutes: 60,
      name: "FlexCo",
      reductionCost: 6,
      reputationRisk: 40,
      satisfaction: 80,
    },
  }, 18, 30);
  const critical = getContractCurtailmentImpact({
    ...baseNode,
    organization: {
      contract: "critical",
      minCurtailmentMinutes: 20,
      maxCurtailmentMinutes: 60,
      name: "CriticalCo",
      reductionCost: 6,
      reputationRisk: 40,
      satisfaction: 70,
    },
  }, 18, 30);

  assert.ok(critical.costPenalty > flexible.costPenalty);
  assert.ok(critical.reputationPenalty > flexible.reputationPenalty);
  assert.equal(critical.organizationName, "CriticalCo");
});

test("contract curtailment impact penalizes durations outside the negotiated window", () => {
  const node = {
    ...baseNode,
    organization: {
      contract: "market" as const,
      minCurtailmentMinutes: 20,
      maxCurtailmentMinutes: 45,
      name: "MarketCo",
      reductionCost: 6,
      reputationRisk: 40,
      satisfaction: 62,
    },
  };

  const normal = getContractCurtailmentImpact(node, 18, 30);
  const tooShort = getContractCurtailmentImpact(node, 18, 5);
  const tooLong = getContractCurtailmentImpact(node, 18, 80);

  assert.equal(normal.durationPenalty, 0);
  assert.ok(tooShort.durationPenalty > normal.durationPenalty);
  assert.ok(tooShort.reputationPenalty > normal.reputationPenalty);
  assert.ok(tooLong.costPenalty > normal.costPenalty);
  assert.equal(normal.satisfaction, 62);
});

test("organization flex offers appear only under grid pressure and prefer flexible contracts", () => {
  const flexibleNode = {
    criticality: "medium" as const,
    demandMw: 42,
    flexibilityMw: 18,
    id: "industry-flex",
    label: "Industrie flexible",
    maxDemandMw: 60,
    organization: {
      contract: "flexible" as const,
      minCurtailmentMinutes: 25,
      maxCurtailmentMinutes: 75,
      name: "FlexCo",
      reductionCost: 6,
      reputationRisk: 25,
      satisfaction: 78,
    },
    servedDemandMw: 42,
  };
  const criticalNode = {
    criticality: "critical" as const,
    demandMw: 35,
    flexibilityMw: 35,
    id: "hospital-critical",
    label: "Hopital critique",
    maxDemandMw: 45,
    organization: {
      contract: "critical" as const,
      minCurtailmentMinutes: 10,
      maxCurtailmentMinutes: 20,
      name: "CriticalCo",
      reductionCost: 4,
      reputationRisk: 80,
      satisfaction: 96,
    },
    servedDemandMw: 35,
  };

  assert.equal(
    getOrganizationFlexOffer({
      maxUtilization: 0.72,
      nodes: [criticalNode, flexibleNode],
      reserveMw: 20,
      unservedMw: 0,
    }),
    undefined,
  );

  const offer = getOrganizationFlexOffer({
    maxUtilization: 1.03,
    nodes: [criticalNode, flexibleNode],
    reserveMw: -4,
    unservedMw: 0,
  });

  assert.equal(offer?.organizationName, "FlexCo");
  assert.equal(offer?.durationMinutes, 25);
  assert.equal(offer?.nodeId, "industry-flex");
  assert.ok((offer?.actionMw ?? 0) > 5);

  const fallbackOffer = getOrganizationFlexOffer({
    announcedOrganizationNames: new Set(["FlexCo"]),
    maxUtilization: 1.03,
    nodes: [criticalNode, flexibleNode],
    reserveMw: -4,
    unservedMw: 0,
  });

  assert.equal(fallbackOffer?.organizationName, "CriticalCo");
});

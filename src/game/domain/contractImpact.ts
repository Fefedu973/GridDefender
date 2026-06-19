import type { GridNode } from "@/game/network/networkTypes";

export interface ContractCurtailmentImpact {
  costPenalty: number;
  durationPenalty: number;
  maxDurationMinutes?: number;
  minDurationMinutes?: number;
  organizationName?: string;
  reputationPenalty: number;
  satisfaction: number;
}

export interface OrganizationFlexOffer {
  actionMw: number;
  contract: NonNullable<GridNode["organization"]>["contract"];
  costPenalty: number;
  durationMinutes: number;
  nodeId: string;
  nodeLabel: string;
  organizationName: string;
  reputationPenalty: number;
}

type ContractNode = Pick<GridNode, "flexibilityMw" | "maxDemandMw" | "organization">;
type OfferNode = Pick<
  GridNode,
  "criticality" | "demandMw" | "flexibilityMw" | "id" | "label" | "maxDemandMw" | "organization" | "servedDemandMw"
>;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function contractMultiplier(contract: NonNullable<GridNode["organization"]>["contract"]) {
  if (contract === "critical") return 1.8;
  if (contract === "market") return 1.25;
  if (contract === "public") return 1.1;
  return 0.75;
}

function offerPriority(node: OfferNode) {
  const contract = node.organization?.contract;
  const contractRank = contract === "flexible" ? 0 : contract === "market" ? 1 : contract === "public" ? 2 : 4;
  const criticalityRank = node.criticality === "critical" ? 4 : node.criticality === "high" ? 2 : 0;
  return contractRank + criticalityRank;
}

export function getContractCurtailmentImpact(
  node: ContractNode | undefined,
  magnitudeMw: number,
  durationMinutes = node?.organization?.minCurtailmentMinutes ?? 30,
): ContractCurtailmentImpact {
  const organization = node?.organization;
  if (!node || !organization || magnitudeMw <= 0) {
    return { costPenalty: 0, durationPenalty: 0, reputationPenalty: 0, satisfaction: 0 };
  }

  const referenceFlexibility = Math.max(1, node.flexibilityMw, node.maxDemandMw * 0.25);
  const intensityRatio = clamp(magnitudeMw / referenceFlexibility, 0, 2);
  const shortRatio =
    organization.minCurtailmentMinutes > 0
      ? clamp((organization.minCurtailmentMinutes - durationMinutes) / organization.minCurtailmentMinutes, 0, 1)
      : 0;
  const overtimeRatio =
    organization.maxCurtailmentMinutes > 0
      ? clamp((durationMinutes - organization.maxCurtailmentMinutes) / organization.maxCurtailmentMinutes, 0, 2)
      : 0;
  const durationPenalty = round((shortRatio * 1.35 + overtimeRatio * 0.8) * (0.6 + intensityRatio) * 10);
  const multiplier = contractMultiplier(organization.contract);

  return {
    costPenalty: round(organization.reductionCost * intensityRatio * (0.22 + durationPenalty * 0.035) * multiplier),
    durationPenalty,
    maxDurationMinutes: organization.maxCurtailmentMinutes,
    minDurationMinutes: organization.minCurtailmentMinutes,
    organizationName: organization.name,
    reputationPenalty: round(
      organization.reputationRisk * intensityRatio * (0.035 + durationPenalty * 0.006) * multiplier,
    ),
    satisfaction: organization.satisfaction,
  };
}

export function getOrganizationFlexOffer({
  announcedOrganizationNames = new Set<string>(),
  maxUtilization,
  nodes,
  reserveMw,
  unservedMw,
}: {
  announcedOrganizationNames?: ReadonlySet<string>;
  maxUtilization: number;
  nodes: OfferNode[];
  reserveMw: number;
  unservedMw: number;
}): OrganizationFlexOffer | undefined {
  const pressure = Math.max(
    (maxUtilization - 0.94) / 0.18,
    Math.max(0, -reserveMw) / 18,
    unservedMw / 16,
  );
  if (pressure < 0.15) return undefined;

  const candidate = [...nodes]
    .filter((node) => node.organization && node.flexibilityMw > 0 && node.demandMw > 0 && node.servedDemandMw > 0)
    .filter((node) => !announcedOrganizationNames.has(node.organization?.name ?? ""))
    .sort(
      (a, b) =>
        offerPriority(a) - offerPriority(b) ||
        b.flexibilityMw - a.flexibilityMw ||
        (a.organization?.reputationRisk ?? 100) - (b.organization?.reputationRisk ?? 100),
    )[0];

  if (!candidate?.organization) return undefined;

  const durationMinutes = candidate.organization.minCurtailmentMinutes || 20;
  const actionMw = round(Math.min(candidate.flexibilityMw, Math.max(5, candidate.demandMw * 0.28)));
  const impact = getContractCurtailmentImpact(candidate, actionMw, durationMinutes);

  return {
    actionMw,
    contract: candidate.organization.contract,
    costPenalty: impact.costPenalty,
    durationMinutes,
    nodeId: candidate.id,
    nodeLabel: candidate.label,
    organizationName: candidate.organization.name,
    reputationPenalty: impact.reputationPenalty,
  };
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

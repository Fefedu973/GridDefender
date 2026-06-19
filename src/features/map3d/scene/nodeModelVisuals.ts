import type { GridNode } from "@/game/network/networkTypes";

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function nodeActivityRatio(
  node: Pick<GridNode, "demandMw" | "maxDemandMw" | "maxProductionMw" | "productionMw" | "servedDemandMw" | "servedProductionMw">,
): number {
  const activityBase = Math.max(node.servedProductionMw, node.servedDemandMw, node.productionMw, node.demandMw);
  const activityMax = Math.max(node.maxProductionMw, node.maxDemandMw, 1);
  return clamp01(activityBase / activityMax);
}

export function datacenterModelProfile(node: Pick<GridNode, "maxDemandMw">) {
  const compact = node.maxDemandMw > 0 && node.maxDemandMw <= 62;
  return {
    compact,
    scale: compact ? 0.86 : 0.9,
  };
}

export function solarPanelEmissiveScale(activity: number): number {
  return 0.18 + clamp01(activity) * 0.82;
}

export function evChargeFillLevel(activity: number): number {
  return clamp01(0.08 + clamp01(activity) * 0.9);
}

export function productionSteamVisualProfile(activity: number) {
  const normalized = clamp01(activity);
  return {
    opacity: 0.08 + normalized * 0.3,
    pulseMax: 0.32 + normalized * 0.58,
    speed: 0.08 + normalized * 0.24,
  };
}

export function factoryVisualProfile(activity: number) {
  const normalized = clamp01(activity);
  return {
    furnaceMax: 0.16 + normalized * 0.62,
    smokeOpacity: 0.05 + normalized * 0.28,
    smokeSpeed: 0.08 + normalized * 0.24,
  };
}

export function nodeRenderScale({
  activity,
  mapModelScale = 1,
  selected,
}: {
  activity: number;
  mapModelScale?: number;
  selected: boolean;
}) {
  const safeMapScale = Number.isFinite(mapModelScale) ? Math.max(0.65, Math.min(1.55, mapModelScale)) : 1;
  const selectionScale = selected ? 1.18 : 1;
  const activityScale = 0.96 + Math.min(0.12, clamp01(activity) * 0.08);
  return safeMapScale * selectionScale * activityScale;
}

"use client";

import { getMapDefinition } from "@/content/maps/mapRegistry";
import { FranceGridCanvas } from "@/features/map3d/FranceGridCanvas";
import type { GameState } from "@/game/types";
import { useGameStore } from "@/store/gameStore";

export function GridSceneCanvas({
  gameOverride,
  showHorizonRing = true,
}: {
  gameOverride?: GameState;
  showHorizonRing?: boolean;
}) {
  const storeMapId = useGameStore((state) => state.game.scenario.mapId);
  const mapId = gameOverride?.scenario.mapId ?? storeMapId;
  const map = getMapDefinition(mapId);

  return <FranceGridCanvas map={map} gameOverride={gameOverride} showHorizonRing={showHorizonRing} />;
}

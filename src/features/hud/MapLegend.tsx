"use client";

import { getMapDefinition } from "@/content/maps/mapRegistry";
import { nodeRoleColor } from "@/features/map3d/scene/visuals";
import type { GridNodeRole } from "@/game/network/networkTypes";
import type { ViewLayer } from "@/store/gameStore";
import { useGameStore } from "@/store/gameStore";

const gridItems: Array<{ role: GridNodeRole; label: string }> = [
  { role: "producer", label: "Production" },
  { role: "consumer", label: "Demande" },
  { role: "storage", label: "Stockage" },
  { role: "connector", label: "Réseau" },
];

const layerItems: Record<Exclude<ViewLayer, "grid">, Array<{ color: string; label: string }>> = {
  ai: [
    { color: "#22d3ee", label: "Datacenter IA" },
    { color: "#a78bfa", label: "Stockage utile" },
    { color: "#475569", label: "Hors couche" },
  ],
  carbon: [
    { color: "#34f5b0", label: "Bas CO₂" },
    { color: "#f59e0b", label: "Import / pression" },
    { color: "#ff7a1a", label: "Demande flexible" },
  ],
};

export function MapLegend() {
  const mapId = useGameStore((state) => state.game.scenario.mapId);
  const viewLayer = useGameStore((state) => state.viewLayer);
  const map = getMapDefinition(mapId);
  const items =
    viewLayer === "grid"
      ? gridItems.map((item) => ({ label: item.label, color: nodeRoleColor(item.role) }))
      : layerItems[viewLayer];

  return (
    <div className="glass pointer-events-none hidden items-center gap-3 rounded-md px-3 py-1.5 xl:flex">
      <span className="hud-eyebrow text-[9px] text-[var(--c-cyan-bright)]">
        {map.name} · {viewLayer}
      </span>
      <span className="h-4 w-px bg-white/10" />
      {items.map((item) => {
        const color = item.color;
        return (
          <span key={item.label} className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-300">
            <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
            {item.label}
          </span>
        );
      })}
    </div>
  );
}

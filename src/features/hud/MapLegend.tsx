"use client";

import { nodeRoleColor } from "@/features/map3d/scene/visuals";
import type { GridNodeRole } from "@/game/network/networkTypes";

const items: Array<{ role: GridNodeRole; label: string }> = [
  { role: "producer", label: "Production" },
  { role: "consumer", label: "Demande" },
  { role: "storage", label: "Stockage" },
  { role: "connector", label: "Réseau" },
];

export function MapLegend() {
  return (
    <div className="glass pointer-events-none hidden items-center gap-3 rounded-md px-3 py-1.5 xl:flex">
      {items.map((item) => {
        const color = nodeRoleColor(item.role);
        return (
          <span key={item.role} className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-300">
            <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
            {item.label}
          </span>
        );
      })}
    </div>
  );
}

"use client";

import { Battery, Building2, Factory, Hospital, Server, Sun, Wind, Zap } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { Panel } from "@/components/ui/Panel";
import type { AssetCategory, AssetStatus, EnergyAsset } from "@/game/types";
import { formatMw } from "@/lib/format";
import { useGameStore } from "@/store/gameStore";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const iconByCategory: Partial<Record<AssetCategory, IconComponent>> = {
  nuclear: Zap,
  solar: Sun,
  wind: Wind,
  hydro: Zap,
  battery: Battery,
  hospital: Hospital,
  residential: Building2,
  industry: Factory,
  ev: Zap,
  event: Building2,
  ai: Server,
};

const statusColor: Record<AssetStatus, string> = {
  stable: "#34d399",
  watch: "#fbbf24",
  critical: "#fb7185",
  offline: "#71717a",
};

const statusLabel: Record<AssetStatus, string> = {
  stable: "stable",
  watch: "attention",
  critical: "critique",
  offline: "hors ligne",
};

function lineColor(category: AssetCategory) {
  if (category === "ai") return "#22d3ee";
  if (category === "battery") return "#a78bfa";
  if (category === "solar" || category === "wind" || category === "hydro" || category === "nuclear") {
    return "#86efac";
  }
  if (category === "hospital") return "#fb7185";
  if (category === "ev") return "#fbbf24";
  if (category === "event") return "#c084fc";
  return "#60a5fa";
}

function shortName(asset: EnergyAsset) {
  const names: Record<string, string> = {
    nuclear: "Nucleaire",
    solar: "Solaire",
    wind: "Eolien",
    hydro: "Hydro",
    battery: "Batteries",
    datacenter: "IA souveraine",
    hospital: "Hopital",
    residential: "Residentiel",
    industry: "Industrie",
    ev: "EV",
    vivatech: "VivaGrid",
  };

  return names[asset.id] ?? asset.name;
}

function flowPath(asset: EnergyAsset, hub: { x: number; y: number }) {
  const midX = (asset.position.x + hub.x) / 2;
  const midY = (asset.position.y + hub.y) / 2;
  const dx = asset.position.x - hub.x;
  const dy = asset.position.y - hub.y;
  const curveX = midX + dy * 0.12;
  const curveY = midY - dx * 0.12;

  return `M ${asset.position.x} ${asset.position.y} Q ${curveX} ${curveY} ${hub.x} ${hub.y}`;
}

export function GridMap() {
  const assets = useGameStore((state) => state.game.assets);
  const metrics = useGameStore((state) => state.game.metrics);
  const selectedAssetId = useGameStore((state) => state.selectedAssetId);
  const selectAsset = useGameStore((state) => state.selectAsset);
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) ?? assets.find((asset) => asset.id === "datacenter") ?? assets[0];
  const hub = { x: 50, y: 52 };
  const networkCritical = metrics.stability < 42 || metrics.reserveMw < -22;

  return (
    <Panel
      title="Néo-Réseau Atlantique"
      eyebrow="Radar reseau"
      className="overflow-hidden"
      action={
        <div className="hidden items-center gap-4 font-mono text-xs text-zinc-300 md:flex">
          <span className="text-emerald-200">{formatMw(metrics.productionMw)} prod</span>
          <span className="text-amber-200">{formatMw(metrics.demandMw)} demande</span>
          <span className={metrics.reserveMw < 0 ? "text-red-200" : "text-cyan-100"}>
            {formatMw(metrics.reserveMw)} marge
          </span>
        </div>
      }
    >
      <div className="relative min-h-[560px] overflow-hidden bg-[#03070b]">
        <div className="absolute inset-0 grid-bg opacity-80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.16),transparent_42%),radial-gradient(circle_at_74%_30%,rgba(59,130,246,0.12),transparent_26%),linear-gradient(180deg,rgba(3,7,11,0),rgba(3,7,11,0.82))]" />
        <div className={`absolute inset-0 ${networkCritical ? "crisis-vignette" : ""}`} />
        <div className="radar-sweep" />

        <svg
          viewBox="0 0 100 100"
          role="img"
          aria-label="Carte du reseau energetique Grid Defender"
          className="relative z-10 h-full min-h-[560px] w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="mapGlow">
              <feGaussianBlur stdDeviation="1.25" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="hardGlow">
              <feGaussianBlur stdDeviation="2.1" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g opacity="0.42" stroke="#155e75" strokeWidth="0.18">
            {[17, 29, 41, 53, 65, 77, 89].map((x) => (
              <line key={`grid-v-${x}`} x1={x} y1="8" x2={x} y2="94" />
            ))}
            {[15, 27, 39, 51, 63, 75, 87].map((y) => (
              <line key={`grid-h-${y}`} x1="6" y1={y} x2="94" y2={y} />
            ))}
          </g>

          <g fill="none" stroke="#22d3ee" strokeOpacity="0.2">
            <circle cx={hub.x} cy={hub.y} r="15" strokeWidth="0.25" />
            <circle cx={hub.x} cy={hub.y} r="27" strokeWidth="0.2" />
            <circle cx={hub.x} cy={hub.y} r="39" strokeWidth="0.16" />
          </g>

          <g opacity="0.16">
            <path d="M 9 19 L 39 12 L 44 34 L 18 42 Z" fill="#22c55e" />
            <path d="M 56 13 L 92 20 L 91 49 L 62 42 Z" fill="#0891b2" />
            <path d="M 44 63 L 89 58 L 94 89 L 55 91 Z" fill="#f59e0b" />
            <path d="M 11 65 L 40 58 L 38 89 L 15 91 Z" fill="#38bdf8" />
          </g>

          {assets.map((asset) => {
            const color = lineColor(asset.category);
            const path = flowPath(asset, hub);
            const strokeWidth = Math.max(0.55, Math.min(2.6, asset.powerMw / 30));

            return (
              <g key={`line-${asset.id}`}>
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeOpacity={asset.powerMw > 0 ? 0.2 : 0.08}
                  strokeWidth={strokeWidth + 1.7}
                  filter="url(#mapGlow)"
                />
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeOpacity={asset.powerMw > 0 ? 0.85 : 0.18}
                  strokeWidth={strokeWidth}
                  strokeDasharray="2.5 5"
                  className="energy-flow"
                />
              </g>
            );
          })}

          <g filter="url(#hardGlow)">
            <circle
              cx={hub.x}
              cy={hub.y}
              r={networkCritical ? 10.5 : 9}
              fill={networkCritical ? "#450a0a" : "#042f2e"}
              stroke={networkCritical ? "#fb7185" : "#5eead4"}
              strokeWidth="1.2"
              className={networkCritical ? "critical-pulse" : ""}
            />
            <circle cx={hub.x} cy={hub.y} r="5.2" fill="#061016" stroke="#f8fafc" strokeOpacity="0.65" strokeWidth="0.45" />
            <text x={hub.x} y={hub.y + 1.1} textAnchor="middle" className="fill-white text-[3.4px] font-bold">
              GRID
            </text>
          </g>

          {assets.map((asset) => {
            const Icon = iconByCategory[asset.category] ?? Zap;
            const selected = asset.id === selectedAsset.id;
            const color = statusColor[asset.status];
              const radius = asset.kind === "datacenter" ? 6.1 : asset.kind === "storage" ? 5.3 : 4.8;

            return (
              <g
                key={asset.id}
                role="button"
                tabIndex={0}
                className="cursor-pointer outline-none"
                onClick={() => selectAsset(asset.id)}
              >
                <title>{`${asset.name}: ${formatMw(asset.powerMw)}`}</title>
                {(asset.status === "critical" || selected) && (
                  <circle
                    cx={asset.position.x}
                    cy={asset.position.y}
                    r={radius + (asset.status === "critical" ? 4.2 : 3)}
                    fill="none"
                    stroke={asset.status === "critical" ? "#fb7185" : "#67e8f9"}
                    strokeOpacity="0.85"
                    strokeWidth="0.75"
                    className={asset.status === "critical" ? "critical-pulse" : ""}
                  />
                )}
                <circle
                  cx={asset.position.x}
                  cy={asset.position.y}
                  r={radius}
                  fill={asset.kind === "datacenter" ? "#082f49" : "#061016"}
                  stroke={selected ? "#ffffff" : color}
                  strokeWidth={selected ? 1.35 : 0.95}
                  filter="url(#hardGlow)"
                />
                <foreignObject
                  x={asset.position.x - 2.45}
                  y={asset.position.y - 2.45}
                  width="4.9"
                  height="4.9"
                  className="pointer-events-none text-white"
                >
                  <Icon className="h-full w-full p-[2px]" aria-hidden="true" />
                </foreignObject>
                <text
                  x={asset.position.x}
                  y={asset.position.y + radius + 4.1}
                  textAnchor="middle"
                  className="pointer-events-none fill-zinc-100 text-[2.55px] font-semibold"
                >
                  {shortName(asset)}
                </text>
                <text
                  x={asset.position.x}
                  y={asset.position.y + radius + 7.1}
                  textAnchor="middle"
                  className="pointer-events-none fill-zinc-400 text-[2.2px] font-mono"
                >
                  {formatMw(asset.powerMw)}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="absolute left-4 top-4 z-20 grid gap-2 sm:grid-cols-3">
          <MapReadout label="Stabilite" value={`${Math.round(metrics.stability)}%`} alert={metrics.stability < 45} />
          <MapReadout label="Reserve" value={formatMw(metrics.reserveMw)} alert={metrics.reserveMw < -12} />
          <MapReadout label="CO2" value={`${Math.round(metrics.co2Intensity)}g`} alert={metrics.co2Intensity > 120} />
        </div>

        <aside className="absolute bottom-4 right-4 z-20 w-[min(390px,calc(100%-32px))] border border-white/10 bg-[#071016]/95 p-4 shadow-[0_18px_70px_rgba(0,0,0,0.48)] backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-cyan-200/80">Asset inspecteur</p>
              <h3 className="mt-1 text-2xl font-semibold leading-tight text-white">{selectedAsset.name}</h3>
            </div>
            <span
              className="shrink-0 border px-2 py-1 text-xs font-semibold uppercase"
              style={{ borderColor: statusColor[selectedAsset.status], color: statusColor[selectedAsset.status] }}
            >
              {statusLabel[selectedAsset.status]}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-300">{selectedAsset.description}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <MapReadout label="Puissance" value={formatMw(selectedAsset.powerMw)} />
            <MapReadout label="Max" value={formatMw(selectedAsset.maxPowerMw)} />
            <MapReadout label="Flex" value={selectedAsset.flexible ? "oui" : "non"} />
          </div>
        </aside>
      </div>
    </Panel>
  );
}

function MapReadout({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className={`border px-3 py-2 ${alert ? "border-red-400/40 bg-red-500/10" : "border-white/10 bg-black/35"}`}>
      <p className="text-[10px] font-semibold uppercase text-zinc-500">{label}</p>
      <p className={`mt-1 font-mono text-lg font-semibold ${alert ? "text-red-100" : "text-white"}`}>{value}</p>
    </div>
  );
}

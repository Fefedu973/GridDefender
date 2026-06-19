"use client";

import { Gauge } from "lucide-react";
import { BarGauge, HudPanel, RadialGauge } from "@/features/hud/hudKit";
import { getHudVisibilityProfile, type HudRailMetric } from "@/features/hud/hudVisibility";
import { useGameStore } from "@/store/gameStore";

const railMetricMeta: Record<HudRailMetric, { label: string; color?: string }> = {
  criticalContinuity: { label: "Services critiques" },
  aiProductivity: { label: "Productivité IA", color: "#22d3ee" },
  sovereignty: { label: "Souveraineté" },
  carbon: { label: "Score CO₂" },
  cost: { label: "Coût maîtrisé" },
  publicSatisfaction: { label: "Satisfaction" },
  batteryLevel: { label: "Batterie", color: "#a78bfa" },
};

export function MetricRail() {
  const game = useGameStore((state) => state.game);
  const m = game.metrics;
  const profile = getHudVisibilityProfile(game.scenario);

  return (
    <HudPanel eyebrow="Command center" title="État réseau" icon={<Gauge className="h-4 w-4" />}>
      <div className="flex items-center justify-center gap-4 border-b border-[var(--glass-border-soft)] px-3 py-3">
        <RadialGauge label="Stabilité" value={m.stability} />
        <div className="flex flex-col gap-2 text-right">
          <div>
            <p className="hud-eyebrow text-[var(--c-muted)]">Production</p>
            <p className="hud-num text-lg text-[var(--c-green)]">{Math.round(m.productionMw)} MW</p>
          </div>
          <div>
            <p className="hud-eyebrow text-[var(--c-muted)]">Demande</p>
            <p className="hud-num text-lg text-[var(--c-demand)]">{Math.round(m.demandMw)} MW</p>
          </div>
          {profile.railMetrics.includes("aiProductivity") && (
            <div>
              <p className="hud-eyebrow text-[var(--c-muted)]">Charge IA</p>
              <p className="hud-num text-lg text-[var(--c-cyan-bright)]">{Math.round(m.aiLoadMw)} MW</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3 p-3.5">
        {profile.railMetrics.map((metric) => {
          const meta = railMetricMeta[metric];
          return <BarGauge key={metric} label={meta.label} value={m[metric]} color={meta.color} />;
        })}
      </div>
    </HudPanel>
  );
}

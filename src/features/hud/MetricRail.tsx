"use client";

import { Gauge } from "lucide-react";
import { BarGauge, HudPanel, RadialGauge } from "@/features/hud/hudKit";
import { useGameStore } from "@/store/gameStore";

export function MetricRail() {
  const m = useGameStore((state) => state.game.metrics);

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
            <p className="hud-num text-lg text-[var(--c-amber)]">{Math.round(m.demandMw)} MW</p>
          </div>
          <div>
            <p className="hud-eyebrow text-[var(--c-muted)]">Charge IA</p>
            <p className="hud-num text-lg text-[var(--c-cyan-bright)]">{Math.round(m.aiLoadMw)} MW</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-3.5">
        <BarGauge label="Services critiques" value={m.criticalContinuity} />
        <BarGauge label="Productivité IA" value={m.aiProductivity} color="#22d3ee" />
        <BarGauge label="Souveraineté" value={m.sovereignty} />
        <BarGauge label="Score CO₂" value={m.carbon} />
        <BarGauge label="Coût maîtrisé" value={m.cost} />
        <BarGauge label="Satisfaction" value={m.publicSatisfaction} />
        <BarGauge label="Batterie" value={m.batteryLevel} color="#a78bfa" />
      </div>
    </HudPanel>
  );
}

"use client";

import { Panel } from "@/components/ui/Panel";
import { MetricGauge, metricTone } from "@/components/ui/MetricGauge";
import { useGameStore } from "@/store/gameStore";
import { formatMw } from "@/lib/format";

export function MetricPanel() {
  const metrics = useGameStore((state) => state.game.metrics);

  return (
    <Panel title="Indicateurs critiques" eyebrow="Control room" className="h-full">
      <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-1">
        <MetricGauge
          label="Stabilite reseau"
          value={metrics.stability}
          detail={`${formatMw(metrics.reserveMw)} de marge`}
        />
        <MetricGauge
          label="CO2 bas carbone"
          value={metrics.carbon}
          detail={`${Math.round(metrics.co2Intensity)} gCO2/kWh`}
          tone={metricTone(metrics.carbon)}
        />
        <MetricGauge
          label="Cout maitrise"
          value={metrics.cost}
          detail="Import et thermique penalises"
        />
        <MetricGauge
          label="Souverainete IA"
          value={metrics.sovereignty}
          detail="Calcul local prioritaire"
          tone="blue"
        />
        <MetricGauge
          label="Productivite IA"
          value={metrics.aiProductivity}
          detail={`${formatMw(metrics.aiLoadMw)} de charge IA`}
          tone="blue"
        />
        <MetricGauge
          label="Satisfaction publique"
          value={metrics.publicSatisfaction}
          detail="EV, salon et confort"
        />
        <MetricGauge
          label="Services critiques"
          value={metrics.criticalContinuity}
          detail="Hopital et cyber"
        />
        <MetricGauge
          label="Batteries"
          value={metrics.batteryLevel}
          detail="Reserve tactique"
          tone={metricTone(metrics.batteryLevel)}
        />
      </div>
    </Panel>
  );
}

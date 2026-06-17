"use client";

import {
  BatteryCharging,
  Car,
  Clock3,
  Cpu,
  DatabaseZap,
  Flame,
  TimerReset,
  Zap,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { actionDefinitions } from "@/game/actions";
import { getAdvisorRecommendation } from "@/game/advisor/rules";
import type { PlayerActionType } from "@/game/types";
import { Panel } from "@/components/ui/Panel";
import { useGameStore } from "@/store/gameStore";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const icons: Record<PlayerActionType, IconComponent> = {
  smart_ev: Car,
  defer_ai: Clock3,
  reduce_model: Cpu,
  activate_cache: DatabaseZap,
  agent_timeout: TimerReset,
  discharge_battery: BatteryCharging,
  import_energy: Zap,
  thermal_backup: Flame,
};

function actionDisabledReason(action: PlayerActionType) {
  if (action === "thermal_backup") return "Dernier recours carbone";
  if (action === "import_energy") return "Cout et souverainete";
  return undefined;
}

export function ActionPanel() {
  const game = useGameStore((state) => state.game);
  const applyAction = useGameStore((state) => state.applyAction);
  const phase = useGameStore((state) => state.phase);
  const recommendedAction = getAdvisorRecommendation(game).suggestedAction;

  return (
    <Panel title="Actions operateur" eyebrow="Load control">
      <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {actionDefinitions.map((action) => {
          const Icon = icons[action.type];
          const hint = actionDisabledReason(action.type);
          const recommended = action.type === recommendedAction;

          return (
            <button
              key={action.type}
              type="button"
              title={`${action.label}: ${action.description}`}
              disabled={phase === "ended" || phase === "ready"}
              onClick={() => applyAction(action.type)}
              className={`group min-h-20 border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                recommended
                  ? "border-cyan-300/70 bg-cyan-300/10 shadow-[0_0_28px_rgba(34,211,238,0.16)]"
                  : "border-white/10 bg-white/[0.04] hover:border-cyan-300/50 hover:bg-cyan-300/10"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="grid h-9 w-9 place-items-center border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                {(recommended || hint) && (
                  <span
                    className={`truncate text-[10px] font-semibold ${
                      recommended ? "text-cyan-100" : "text-amber-200/80"
                    }`}
                  >
                    {recommended ? "Recommande" : hint}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-zinc-100">{action.shortLabel}</p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-zinc-400">
                {action.expectedImpact}
              </p>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

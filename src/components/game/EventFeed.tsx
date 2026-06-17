"use client";

import { Activity, CircleCheck, Siren } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { useGameStore } from "@/store/gameStore";
import { formatClock } from "@/lib/format";

const severityClass = {
  info: "text-cyan-200",
  warning: "text-amber-200",
  critical: "text-red-200",
};

export function EventFeed() {
  const incidents = useGameStore((state) => state.game.incidents);
  const actions = useGameStore((state) => state.game.actionHistory);

  return (
    <Panel title="Journal mission" eyebrow="Events">
      <div className="grid gap-3 p-3 lg:grid-cols-2 xl:grid-cols-1">
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase text-zinc-400">
            <Siren className="h-4 w-4 text-red-300" aria-hidden="true" />
            Incidents
          </h3>
          <div className="space-y-2">
            {incidents.length === 0 && (
              <p className="rounded-[6px] border border-white/10 bg-white/[0.035] p-3 text-xs text-zinc-500">
                Aucun incident actif. Le pic arrive bientot.
              </p>
            )}
            {incidents.slice(0, 5).map((incident) => (
              <div
                key={incident.id}
                className="rounded-[6px] border border-white/10 bg-white/[0.04] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={`truncate text-xs font-semibold ${severityClass[incident.severity]}`}>
                    {incident.title}
                  </p>
                  {incident.resolvedAt ? (
                    <CircleCheck className="h-4 w-4 shrink-0 text-emerald-300" />
                  ) : (
                    <Activity className="h-4 w-4 shrink-0 text-amber-300" />
                  )}
                </div>
                <p className="mt-1 text-[11px] leading-4 text-zinc-500">
                  {formatClock(incident.openedAt)}
                  {incident.resolvedAt ? ` -> resolu ${formatClock(incident.resolvedAt)}` : " -> en cours"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase text-zinc-400">Actions recentes</h3>
          <div className="space-y-2">
            {actions.length === 0 && (
              <p className="rounded-[6px] border border-white/10 bg-white/[0.035] p-3 text-xs text-zinc-500">
                Aucune action. Analysez les jauges avant le premier evenement.
              </p>
            )}
            {actions.slice(0, 5).map((action) => (
              <div
                key={action.id}
                className="rounded-[6px] border border-white/10 bg-white/[0.04] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-zinc-200">
                    {action.label}
                  </p>
                  <span className="font-mono text-[11px] text-zinc-500">
                    {formatClock(action.minute)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-4 text-zinc-500">{action.result}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

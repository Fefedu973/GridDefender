"use client";

import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { formatClock } from "@/lib/format";

export function TimelineTrack() {
  const game = useGameStore((state) => state.game);
  const { startMinute, endMinute, events } = game.scenario;
  const span = Math.max(1, endMinute - startMinute);
  const ratio = (minute: number) => Math.max(0, Math.min(1, (minute - startMinute) / span));
  const playhead = ratio(game.minute);

  return (
    <div className="glass-strong pointer-events-auto rounded-md px-4 py-2.5">
      <div className="mb-2 flex items-center justify-between">
        <p className="hud-eyebrow text-[var(--c-cyan-bright)]">Timeline de crise</p>
        <p className="mono text-[11px] text-[var(--c-muted)]">
          {formatClock(startMinute)} — {formatClock(endMinute)}
        </p>
      </div>

      <div className="relative h-12">
        {/* Track */}
        <div className="absolute left-0 right-0 top-9 h-0.5 rounded-full bg-white/10" />
        <div
          className="absolute left-0 top-9 h-0.5 rounded-full bg-gradient-to-r from-[var(--c-cyan)] to-[var(--c-green)]"
          style={{ width: `${playhead * 100}%`, boxShadow: "0 0 10px var(--c-cyan)" }}
        />
        {/* Playhead */}
        <div className="absolute top-7 z-10 -translate-x-1/2" style={{ left: `${playhead * 100}%` }}>
          <div className="h-4 w-4 rounded-full border-2 border-[var(--c-cyan-bright)] bg-[#02151c] shadow-[0_0_12px_var(--c-cyan)]" />
        </div>

        {/* Events */}
        {events.map((event) => {
          const triggered = game.triggeredEventIds.includes(event.id);
          const active = triggered && game.incidents.some((i) => i.id === event.id && !i.resolvedAt);
          const left = ratio(event.minute) * 100;
          const color = active ? "var(--c-red)" : triggered ? "var(--c-green)" : "var(--c-muted)";
          return (
            <div
              key={event.id}
              className="absolute top-0 flex w-36 -translate-x-1/2 flex-col items-center"
              style={{ left: `${left}%` }}
              title={event.description}
            >
              <div className="flex items-center gap-1 rounded border px-1.5 py-0.5" style={{ borderColor: `${color}55`, background: `${color}12` }}>
                {active ? (
                  <AlertTriangle className="h-3 w-3" style={{ color }} />
                ) : triggered ? (
                  <CheckCircle2 className="h-3 w-3" style={{ color }} />
                ) : (
                  <Clock3 className="h-3 w-3" style={{ color }} />
                )}
                <span className="mono text-[10px]" style={{ color }}>
                  {formatClock(event.minute)}
                </span>
              </div>
              <span className="mt-0.5 line-clamp-2 text-center text-[10px] leading-3 text-zinc-400">{event.title}</span>
              <span className="mt-1 h-2 w-px" style={{ background: color }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

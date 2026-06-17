"use client";

import { Gauge, Pause, Play, RotateCcw } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { formatClock, formatMw } from "@/lib/format";

export function GameHeader() {
  const game = useGameStore((state) => state.game);
  const phase = useGameStore((state) => state.phase);
  const speed = useGameStore((state) => state.speed);
  const togglePause = useGameStore((state) => state.togglePause);
  const resetMission = useGameStore((state) => state.resetMission);
  const setSpeed = useGameStore((state) => state.setSpeed);

  return (
    <header className="border-b border-white/10 bg-black/35 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-[1760px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">Grid Defender</h1>
            <span className="rounded-[6px] border border-cyan-300/25 bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">
              AI Load Control
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Defendez le reseau. Gardez l&apos;IA en ligne. Evitez le blackout.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="grid min-w-24 rounded-[6px] border border-white/10 bg-white/[0.04] px-3 py-2">
            <span className="text-[10px] uppercase text-zinc-500">Heure</span>
            <span className="font-mono text-lg font-semibold text-white">
              {formatClock(game.minute)}
            </span>
          </div>
          <div className="grid min-w-28 rounded-[6px] border border-white/10 bg-white/[0.04] px-3 py-2">
            <span className="text-[10px] uppercase text-zinc-500">Score</span>
            <span className="font-mono text-lg font-semibold text-emerald-200">
              {Math.round(game.metrics.score)}
            </span>
          </div>
          <div className="hidden min-w-36 rounded-[6px] border border-white/10 bg-white/[0.04] px-3 py-2 md:grid">
            <span className="text-[10px] uppercase text-zinc-500">Marge</span>
            <span className="font-mono text-lg font-semibold text-cyan-100">
              {formatMw(game.metrics.reserveMw)}
            </span>
          </div>

          <div className="flex rounded-[6px] border border-white/10 bg-white/[0.04] p-1">
            {[1, 2, 4].map((value) => (
              <button
                key={value}
                type="button"
                title={`Vitesse x${value}`}
                onClick={() => setSpeed(value as 1 | 2 | 4)}
                className={`h-9 w-10 rounded-[5px] text-sm font-semibold transition ${
                  speed === value
                    ? "bg-cyan-300 text-black"
                    : "text-zinc-300 hover:bg-white/10"
                }`}
              >
                x{value}
              </button>
            ))}
          </div>

          <button
            type="button"
            title={phase === "running" ? "Mettre en pause" : "Reprendre"}
            onClick={togglePause}
            disabled={phase === "ended" || phase === "ready"}
            className="grid h-11 w-11 place-items-center rounded-[6px] border border-white/10 bg-white/[0.04] text-zinc-100 transition hover:border-cyan-300/50 hover:bg-cyan-300/10 disabled:opacity-40"
          >
            {phase === "running" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            type="button"
            title="Reinitialiser la mission"
            onClick={() => resetMission(true)}
            className="grid h-11 w-11 place-items-center rounded-[6px] border border-white/10 bg-white/[0.04] text-zinc-100 transition hover:border-amber-300/50 hover:bg-amber-300/10"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <div className="hidden h-11 items-center gap-2 rounded-[6px] border border-emerald-300/20 bg-emerald-300/10 px-3 text-sm text-emerald-100 xl:flex">
            <Gauge className="h-4 w-4" />
            {phase === "paused" ? "Pause" : phase === "ended" ? "Terminee" : "Mission active"}
          </div>
        </div>
      </div>
    </header>
  );
}

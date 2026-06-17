"use client";

import { BatteryCharging, Play, ShieldCheck, Zap } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { formatClock } from "@/lib/format";

export function StartScreen() {
  const game = useGameStore((state) => state.game);
  const startMission = useGameStore((state) => state.startMission);
  const hydrateLeaderboard = useGameStore((state) => state.hydrateLeaderboard);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070a] text-white">
      <div className="absolute inset-0 grid-bg opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(34,211,238,0.2),transparent_34%),linear-gradient(180deg,rgba(5,7,10,0.2),#05070a_82%)]" />

      <section className="relative z-10 mx-auto grid min-h-screen max-w-[1440px] items-center gap-8 px-5 py-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)]">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase text-cyan-200">Serious game energie x IA</p>
          <h1 className="text-5xl font-semibold leading-[1.02] text-white md:text-7xl">
            Grid Defender
          </h1>
          <p className="mt-4 max-w-xl text-xl leading-8 text-zinc-300">
            Defendez le reseau. Gardez l&apos;IA en ligne. Evitez le blackout.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onMouseEnter={hydrateLeaderboard}
              onClick={startMission}
              className="inline-flex h-12 items-center gap-2 rounded-[6px] bg-cyan-300 px-5 text-sm font-bold text-black transition hover:bg-cyan-200"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              Lancer demo 3 minutes
            </button>
            <div className="inline-flex h-12 items-center gap-2 rounded-[6px] border border-white/10 bg-white/[0.05] px-4 text-sm text-zinc-300">
              <ShieldCheck className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              Mission {formatClock(game.scenario.startMinute)}-{formatClock(game.scenario.endMinute)}
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[6px] border border-white/10 bg-white/[0.05] p-4">
              <Zap className="mb-3 h-5 w-5 text-emerald-300" aria-hidden="true" />
              <p className="text-sm font-semibold">Stabilite</p>
              <p className="mt-1 text-xs leading-5 text-zinc-400">Equilibrer production et demande a chaque tick.</p>
            </div>
            <div className="rounded-[6px] border border-white/10 bg-white/[0.05] p-4">
              <BatteryCharging className="mb-3 h-5 w-5 text-violet-300" aria-hidden="true" />
              <p className="text-sm font-semibold">Flexibilite</p>
              <p className="mt-1 text-xs leading-5 text-zinc-400">Utiliser batteries, EV smart et reports IA.</p>
            </div>
            <div className="rounded-[6px] border border-white/10 bg-white/[0.05] p-4">
              <ShieldCheck className="mb-3 h-5 w-5 text-cyan-300" aria-hidden="true" />
              <p className="text-sm font-semibold">Souverainete</p>
              <p className="mt-1 text-xs leading-5 text-zinc-400">Proteger les jobs IA critiques et locaux.</p>
            </div>
          </div>
        </div>

        <div className="relative min-h-[520px] overflow-hidden border border-cyan-300/20 bg-black/30 shadow-[0_0_80px_rgba(34,211,238,0.16)]">
          <svg viewBox="0 0 100 100" className="h-full min-h-[520px] w-full" role="img" aria-label="Apercu du reseau Grid Defender">
            <defs>
              <filter id="startGlow">
                <feGaussianBlur stdDeviation="1.4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <g stroke="#155e75" strokeWidth="0.25" opacity="0.5">
              {Array.from({ length: 12 }).map((_, index) => (
                <line key={`v-${index}`} x1={8 + index * 8} y1="8" x2={8 + index * 8} y2="92" />
              ))}
              {Array.from({ length: 9 }).map((_, index) => (
                <line key={`h-${index}`} x1="8" y1={12 + index * 9} x2="92" y2={12 + index * 9} />
              ))}
            </g>
            {[
              [20, 28, 50, 52, "#86efac"],
              [32, 78, 50, 52, "#86efac"],
              [72, 28, 50, 52, "#22d3ee"],
              [82, 66, 50, 52, "#fb7185"],
              [68, 82, 50, 52, "#fbbf24"],
            ].map(([x1, y1, x2, y2, color], index) => (
              <line
                key={index}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={String(color)}
                strokeWidth="1.1"
                strokeDasharray="3 5"
                className="energy-flow"
              />
            ))}
            <circle cx="50" cy="52" r="8" fill="#06232b" stroke="#67e8f9" strokeWidth="1.2" filter="url(#startGlow)" />
            <text x="50" y="53" textAnchor="middle" className="fill-white text-[4px] font-bold">
              GRID
            </text>
            {[
              [20, 28, "NUC", "#86efac"],
              [32, 78, "BAT", "#a78bfa"],
              [72, 28, "AI", "#22d3ee"],
              [82, 66, "H", "#fb7185"],
              [68, 82, "EV", "#fbbf24"],
            ].map(([x, y, label, color]) => (
              <g key={String(label)} filter="url(#startGlow)">
                <circle cx={Number(x)} cy={Number(y)} r="6" fill="#071016" stroke={String(color)} strokeWidth="1" />
                <text x={Number(x)} y={Number(y) + 1.3} textAnchor="middle" className="fill-white text-[4px] font-bold">
                  {label}
                </text>
              </g>
            ))}
            <text x="10" y="94" className="fill-cyan-100 text-[3.3px] font-semibold">
              Mission: orchestrer les charges IA pendant le pic du soir
            </text>
          </svg>
        </div>
      </section>
    </main>
  );
}

"use client";

import { Activity, BatteryCharging, BookOpen, Cpu, Play, ShieldCheck, Zap } from "lucide-react";
import { FranceGridCanvas } from "@/features/map3d/FranceGridCanvas";
import { useGameStore } from "@/store/gameStore";
import { formatClock } from "@/lib/format";

export function StartScreen() {
  const game = useGameStore((state) => state.game);
  const startMission = useGameStore((state) => state.startMission);
  const replayTutorial = useGameStore((state) => state.replayTutorial);
  const hydrateLeaderboard = useGameStore((state) => state.hydrateLeaderboard);
  const leaderboard = useGameStore((state) => state.leaderboard);
  const best = leaderboard[0];

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#030a10] text-white">
      {/* Live 3D backdrop */}
      <FranceGridCanvas />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(2,8,12,0.92)_0%,rgba(2,8,12,0.55)_45%,transparent_72%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(2,8,12,0.85)_100%)]" />

      <div className="pointer-events-none absolute inset-0 flex items-center">
        <section className="pointer-events-auto ml-[6vw] max-w-[560px]">
          <div className="hud-rise">
            <p className="flex items-center gap-2 hud-eyebrow text-[var(--c-cyan-bright)]">
              <span className="grid h-7 w-7 place-items-center rounded border border-[var(--c-cyan)]/40 bg-[var(--c-cyan)]/10">
                <Activity className="h-4 w-4" />
              </span>
              Serious game · Énergie × IA
            </p>
            <h1 className="hud-title mt-4 text-6xl leading-[0.95] text-white md:text-7xl">
              GRID
              <br />
              DEFENDER
            </h1>
            <p className="mt-3 hud-eyebrow text-base tracking-[0.3em] text-[var(--c-green)]">AI LOAD CONTROL</p>
            <p className="mt-5 max-w-md text-lg leading-7 text-zinc-300">
              Défendez le réseau électrique français pendant le pic du soir. Orchestrez les charges IA, gardez les
              services critiques en ligne, évitez le blackout.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onMouseEnter={hydrateLeaderboard}
                onClick={startMission}
                className="group inline-flex h-12 items-center gap-2.5 rounded-md bg-[var(--c-cyan)] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-[var(--c-cyan-bright)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]"
              >
                <Play className="h-4 w-4 transition group-hover:scale-110" />
                Lancer la mission
              </button>
              <div className="glass inline-flex h-12 items-center gap-2 rounded-md px-4 py-3 text-sm text-zinc-300">
                <ShieldCheck className="h-4 w-4 text-[var(--c-green)]" />
                {game.scenario.name} · {formatClock(game.scenario.startMinute)}–{formatClock(game.scenario.endMinute)}
              </div>
              <button
                type="button"
                onClick={replayTutorial}
                className="inline-flex h-12 items-center gap-2 rounded-md border border-[var(--glass-border-soft)] bg-white/[0.03] px-4 text-sm font-semibold text-[var(--c-muted)] transition hover:border-white/30 hover:text-white"
              >
                <BookOpen className="h-4 w-4" /> Revoir l’intro
              </button>
            </div>

            <div className="mt-7 grid max-w-md gap-2.5 sm:grid-cols-3">
              <Feature icon={<Zap className="h-4 w-4 text-[var(--c-green)]" />} title="Stabilité" body="Équilibrer offre et demande en temps réel." />
              <Feature icon={<BatteryCharging className="h-4 w-4 text-[var(--c-violet)]" />} title="Flexibilité" body="Batteries, EV smart, report des jobs IA." />
              <Feature icon={<Cpu className="h-4 w-4 text-[var(--c-cyan-bright)]" />} title="Souveraineté" body="Protéger l’IA critique et locale." />
            </div>

            {best && (
              <p className="mt-6 text-xs text-[var(--c-muted)]">
                Meilleur score local : <span className="hud-num text-[var(--c-cyan-bright)]">{Math.round(best.score)}</span> · {best.badge}
              </p>
            )}
          </div>
        </section>
      </div>

      <p className="pointer-events-none absolute bottom-4 right-5 hud-eyebrow text-[var(--c-muted)]/60">
        Faites glisser pour explorer la carte
      </p>
    </main>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="glass rounded-md p-3">
      <div className="mb-1.5">{icon}</div>
      <p className="hud-title text-sm text-white">{title}</p>
      <p className="mt-0.5 text-[11px] leading-4 text-[var(--c-muted)]">{body}</p>
    </div>
  );
}

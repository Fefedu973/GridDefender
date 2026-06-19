"use client";

import { Activity, Check, ChevronLeft, ChevronRight, Play, SkipForward } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ComponentType } from "react";
import {
  CompetitivenessIllustration,
  ContextIllustration,
  DecarbonationIllustration,
  HowToPlayIllustration,
  MissionIllustration,
  SovereigntyIllustration,
  StakeIllustration,
} from "@/features/onboarding/illustrations";
import { useGameStore } from "@/store/gameStore";

interface Step {
  nav: string;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  accent: string;
  Illustration: ComponentType;
}

const STEPS: Step[] = [
  {
    nav: "Contexte",
    eyebrow: "Le contexte",
    title: "VivaTech · Hackathon Defend Intelligence",
    body: "Une journée de forte attention médiatique au salon VivaTech. Le hackathon Defend Intelligence, organisé par l’ingénieur et YouTubeur du même nom, met l’énergie et l’IA au cœur du défi.",
    bullets: [
      "Thème : intégrer l’IA au réseau électrique sans le fragiliser.",
      "Contexte hackathon autour de l’IA, de l’énergie et de la résilience.",
      "Vous incarnez l’opérateur du réseau pendant la démo en direct.",
    ],
    accent: "#7df9ff",
    Illustration: ContextIllustration,
  },
  {
    nav: "L’enjeu",
    eyebrow: "Le vrai enjeu",
    title: "L’IA n’est pas le problème",
    body: "La bonne question n’est pas « faut-il freiner l’IA ? » mais « quand, où et comment l’intégrer au réseau ? ». Une charge IA peut être pilotée intelligemment.",
    bullets: [
      "Certaines charges sont urgentes, d’autres parfaitement flexibles.",
      "On peut décaler, alléger le modèle ou mettre en cache.",
      "L’IA peut même aider à défendre le réseau.",
    ],
    accent: "#34f5b0",
    Illustration: StakeIllustration,
  },
  {
    nav: "Souveraineté",
    eyebrow: "Enjeu 1",
    title: "Souveraineté numérique",
    body: "Garder la maîtrise des calculs IA stratégiques, c’est protéger les services essentiels du pays sans dépendre d’infrastructures étrangères.",
    bullets: [
      "Traiter les jobs critiques en local, sur le datacenter souverain.",
      "Éviter la dépendance à un cloud étranger.",
      "Protéger santé, cyberdéfense et services publics.",
    ],
    accent: "#34f5b0",
    Illustration: SovereigntyIllustration,
  },
  {
    nav: "Décarbonation",
    eyebrow: "Enjeu 2",
    title: "Décarbonation",
    body: "L’empreinte carbone d’une consommation ne dépend pas que de son volume : elle dépend du mix de production et du moment où elle a lieu.",
    bullets: [
      "Solaire, éolien, nucléaire et hydraulique sont bas carbone.",
      "Décaler une charge vers le solaire de midi réduit le CO₂.",
      "Le thermique de secours et l’import sont pénalisants.",
    ],
    accent: "#34f5b0",
    Illustration: DecarbonationIllustration,
  },
  {
    nav: "Compétitivité",
    eyebrow: "Enjeu 3",
    title: "Une énergie décarbonée ET compétitive",
    body: "La France dispose d’un socle nucléaire bas carbone, complété par les renouvelables et le stockage : une électricité décarbonée et compétitive — à condition de l’équilibrer en permanence.",
    bullets: [
      "Un socle stable mais peu flexible à court terme.",
      "Batteries, hydraulique et EV smart apportent la flexibilité.",
      "Tout est arbitrage : coût, CO₂, stabilité.",
    ],
    accent: "#ffd447",
    Illustration: CompetitivenessIllustration,
  },
  {
    nav: "Jouer",
    eyebrow: "Le gameplay",
    title: "Comment on joue",
    body: "À chaque tick de 5 minutes, le réseau évolue. Votre rôle : maintenir l’équilibre entre production et demande, et orchestrer les charges IA.",
    bullets: [
      "Surveillez les jauges : stabilité, CO₂, IA, souveraineté…",
      "Cliquez un nœud ou une ligne sur la carte pour agir localement.",
      "Orchestrez l’IA : décaler, cache, modèle léger, timeout d’agent.",
      "Batteries, EV smart, import et thermique en dernier recours.",
      "Suivez la timeline et les conseils d’ATHENA.",
    ],
    accent: "#22d3ee",
    Illustration: HowToPlayIllustration,
  },
  {
    nav: "Mission",
    eyebrow: "Votre mission",
    title: "Passer le pic du soir",
    body: "De 17h30 à 20h30, traversez le pic du soir sans blackout. Préservez l’hôpital et le job cyber critique, tout en gardant l’IA utile en ligne.",
    bullets: [
      "Score final sur 1000 points.",
      "Ne sacrifiez jamais les services critiques.",
      "L’IA n’est pas coupée : elle est priorisée selon sa valeur.",
    ],
    accent: "#7df9ff",
    Illustration: MissionIllustration,
  },
];

export function Onboarding() {
  const [step, setStep] = useState(0);
  const startMission = useGameStore((state) => state.startMission);
  const markTutorialSeen = useGameStore((state) => state.markTutorialSeen);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Illustration = current.Illustration;

  const next = useCallback(() => {
    if (isLast) {
      markTutorialSeen();
      startMission();
    } else {
      setStep((s) => Math.min(STEPS.length - 1, s + 1));
    }
  }, [isLast, markTutorialSeen, startMission]);

  const prev = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);
  const skip = useCallback(() => markTutorialSeen(), [markTutorialSeen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#030a10] text-white">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(34,211,238,0.14),transparent_50%)]" />

      <div className="relative z-10 mx-auto flex h-full max-w-[1200px] flex-col px-6 py-5">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded border border-[var(--c-cyan)]/40 bg-[var(--c-cyan)]/10">
              <Activity className="h-5 w-5 text-[var(--c-cyan-bright)]" />
            </div>
            <div className="leading-none">
              <p className="hud-title text-[16px] tracking-wide text-white">GRID DEFENDER</p>
              <p className="hud-eyebrow mt-0.5 text-[var(--c-muted)]">Briefing · {step + 1} / {STEPS.length}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={skip}
            className="flex items-center gap-1.5 rounded border border-[var(--glass-border-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--c-muted)] transition hover:border-white/30 hover:text-white"
          >
            Passer l’intro <SkipForward className="h-3.5 w-3.5" />
          </button>
        </header>

        {/* Content */}
        <div className="flex flex-1 items-center">
          <div key={step} className="hud-rise grid w-full items-center gap-8 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <p className="hud-eyebrow text-base" style={{ color: current.accent }}>
                {current.eyebrow}
              </p>
              <h1 className="hud-title mt-2 text-4xl leading-[1.05] text-white md:text-5xl">{current.title}</h1>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-zinc-300">{current.body}</p>
              <ul className="mt-5 grid gap-2.5">
                {current.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-[14px] leading-6 text-zinc-200">
                    <span
                      className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full"
                      style={{ background: `${current.accent}20`, border: `1px solid ${current.accent}66` }}
                    >
                      <Check className="h-3 w-3" style={{ color: current.accent }} />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className="order-1 lg:order-2">
              <div
                className="glass-strong brackets mx-auto aspect-[360/280] w-full max-w-[460px] rounded-md p-4"
                style={{ boxShadow: `0 0 60px ${current.accent}22, inset 0 1px 0 rgba(255,255,255,0.06)` }}
              >
                <Illustration />
              </div>
            </div>
          </div>
        </div>

        {/* Fil d'Ariane + nav */}
        <footer className="mt-2">
          <FilDAriane step={step} onJump={setStep} />

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={prev}
              disabled={step === 0}
              className="flex items-center gap-1.5 rounded-md border border-[var(--glass-border-soft)] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-white/30 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" /> Précédent
            </button>

            <button
              type="button"
              onClick={next}
              className={`flex items-center gap-2 rounded-md px-6 py-2.5 text-sm font-bold uppercase tracking-wide transition ${
                isLast
                  ? "bg-[var(--c-cyan)] text-black hover:bg-[var(--c-cyan-bright)] hover:shadow-[0_0_28px_rgba(34,211,238,0.5)]"
                  : "border border-[var(--c-cyan)]/40 bg-[var(--c-cyan)]/10 text-[var(--c-cyan-bright)] hover:bg-[var(--c-cyan)]/20"
              }`}
            >
              {isLast ? (
                <>
                  <Play className="h-4 w-4" /> Lancer la mission
                </>
              ) : (
                <>
                  Suivant <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}

function FilDAriane({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  const ratio = STEPS.length > 1 ? step / (STEPS.length - 1) : 0;
  return (
    <div className="relative pb-6">
      {/* connecting line: inset 12px each side (= half a 24px node) so it runs
          node-center to node-center. Labels are absolute so they don't widen nodes. */}
      <div className="absolute top-3 h-0.5 rounded-full bg-white/10" style={{ left: 12, right: 12 }} />
      <div
        className="absolute top-3 h-0.5 rounded-full bg-gradient-to-r from-[var(--c-cyan)] to-[var(--c-green)] transition-[width] duration-500"
        style={{ left: 12, width: `calc((100% - 24px) * ${ratio})`, boxShadow: "0 0 10px var(--c-cyan)" }}
      />
      <ol className="relative z-10 flex justify-between">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={s.nav} className="relative flex flex-col items-center">
              <button
                type="button"
                onClick={() => onJump(i)}
                className="grid h-6 w-6 place-items-center rounded-full border text-[11px] font-bold transition"
                style={{
                  background: active ? "var(--c-cyan)" : done ? "#0b211b" : "#06151c",
                  borderColor: active ? "var(--c-cyan-bright)" : done ? "var(--c-green)" : "rgba(125,249,255,0.2)",
                  color: active ? "#000" : done ? "var(--c-green)" : "var(--c-muted)",
                }}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </button>
              <span
                className="absolute left-1/2 top-8 hidden -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide sm:block"
                style={{ color: active ? "var(--c-cyan-bright)" : "var(--c-muted)" }}
              >
                {s.nav}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

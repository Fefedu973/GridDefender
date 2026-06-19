"use client";

import {
  Activity,
  ArrowLeft,
  BookOpen,
  Bot,
  ChevronRight,
  FlaskConical,
  Gauge,
  Layers,
  Play,
  Settings,
  ShieldCheck,
  Trophy,
  Volume2,
  VolumeX,
  Wrench,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { getCampaignMap, type CampaignMapEdge, type CampaignMapNode } from "@/content/campaign/campaignMap";
import { getMapDefinition, mapRegistry } from "@/content/maps/mapRegistry";
import { getMissionDefinition, missionRegistry } from "@/content/missions/missionRegistry";
import { buildCrisisRun, crisisRunDoctrines } from "@/content/modes/crisisRun";
import { getDailyChallenge } from "@/content/modes/dailyChallenge";
import { playModes } from "@/content/modes/playModes";
import { buildSandboxScenario, defaultSandboxOptions, getSandboxPresets } from "@/content/modes/sandbox";
import {
  buildScenarioFromTemplate,
  type DemandPreset,
  type IncidentPreset,
  scenarioTemplates,
  type ScenarioBuilderTemplate,
  type WeatherPreset,
} from "@/content/scenarioBuilder/scenarioBuilder";
import { buildScenarioRecipe } from "@/content/scenarioBuilder/scenarioRecipe";
import { CampaignMap3D } from "@/components/game/CampaignMap3D";
import { GridSceneCanvas } from "@/features/map3d/GridSceneCanvas";
import { createInitialGameState } from "@/game/engine/simulation";
import { hasUnlockedReward, isMissionUnlocked } from "@/game/progression/campaignProgress";
import { renderQualities, simulationSpeeds, type RenderQuality } from "@/store/gamePreferences";
import { useGameStore } from "@/store/gameStore";
import { formatClock } from "@/lib/format";

const weatherOptions: WeatherPreset[] = ["clear", "solar-drop", "storm"];
const demandOptions: DemandPreset[] = ["balanced", "ev-heavy", "ai-surge", "industry-peak"];
const incidentOptions: IncidentPreset[] = ["none", "west-line-trip", "rhone-congestion", "hidden-cyber"];
const revealOptions: ScenarioBuilderTemplate["revealPolicy"][] = ["known", "forecast", "hidden"];
const difficultyOptions: ScenarioBuilderTemplate["difficulty"][] = ["tutorial", "standard", "hard", "expert"];
const startMinuteOptions = [17 * 60 + 30, 17 * 60 + 45, 18 * 60, 18 * 60 + 15, 18 * 60 + 30];
const durationOptions = [120, 150, 180, 210];

const renderQualityLabels: Record<RenderQuality, string> = {
  safe: "Safe demo",
  standard: "Standard",
  high: "Élevé",
};

type MenuView = "home" | "campaign" | "sandbox" | "builder" | "modes" | "leaderboard" | "settings";

export function StartScreen() {
  const game = useGameStore((state) => state.game);
  const selectedMissionId = useGameStore((state) => state.selectedMissionId);
  const selectMission = useGameStore((state) => state.selectMission);
  const startMission = useGameStore((state) => state.startMission);
  const startDemoMission = useGameStore((state) => state.startDemoMission);
  const startScenario = useGameStore((state) => state.startScenario);
  const replayTutorial = useGameStore((state) => state.replayTutorial);
  const hydrateLeaderboard = useGameStore((state) => state.hydrateLeaderboard);
  const clearLeaderboard = useGameStore((state) => state.clearLeaderboard);
  const leaderboard = useGameStore((state) => state.leaderboard);
  const progress = useGameStore((state) => state.progress);
  const renderQuality = useGameStore((state) => state.renderQuality);
  const setRenderQuality = useGameStore((state) => state.setRenderQuality);
  const audioEnabled = useGameStore((state) => state.audioEnabled);
  const toggleAudio = useGameStore((state) => state.toggleAudio);
  const speed = useGameStore((state) => state.speed);
  const setSpeed = useGameStore((state) => state.setSpeed);

  const [view, setView] = useState<MenuView>("home");

  const initialBuilderTemplate = scenarioTemplates[0];
  const [builderTemplateId, setBuilderTemplateId] = useState(initialBuilderTemplate?.id ?? "");
  const [builderMapId, setBuilderMapId] = useState(initialBuilderTemplate?.mapId ?? "france-national");
  const [builderDifficulty, setBuilderDifficulty] = useState<ScenarioBuilderTemplate["difficulty"]>(initialBuilderTemplate?.difficulty ?? "standard");
  const [builderWeather, setBuilderWeather] = useState<WeatherPreset>(initialBuilderTemplate?.weather ?? "solar-drop");
  const [builderDemand, setBuilderDemand] = useState<DemandPreset>(initialBuilderTemplate?.demand ?? "balanced");
  const [builderIncident, setBuilderIncident] = useState<IncidentPreset>(initialBuilderTemplate?.incident ?? "hidden-cyber");
  const [builderRevealPolicy, setBuilderRevealPolicy] = useState<ScenarioBuilderTemplate["revealPolicy"]>(initialBuilderTemplate?.revealPolicy ?? "forecast");
  const [builderStartMinute, setBuilderStartMinute] = useState(initialBuilderTemplate?.startMinute ?? 18 * 60);
  const [builderDurationMinutes, setBuilderDurationMinutes] = useState(initialBuilderTemplate?.durationMinutes ?? 150);
  const [builderSeed, setBuilderSeed] = useState("builder-demo");
  const [sandboxMapId, setSandboxMapId] = useState(defaultSandboxOptions.mapId);
  const [sandboxDifficulty, setSandboxDifficulty] = useState<ScenarioBuilderTemplate["difficulty"]>(defaultSandboxOptions.difficulty);
  const [sandboxWeather, setSandboxWeather] = useState<WeatherPreset>(defaultSandboxOptions.weather);
  const [sandboxDemand, setSandboxDemand] = useState<DemandPreset>(defaultSandboxOptions.demand);
  const [sandboxIncident, setSandboxIncident] = useState<IncidentPreset>(defaultSandboxOptions.incident);
  const [sandboxStartMinute, setSandboxStartMinute] = useState(defaultSandboxOptions.startMinute);
  const [sandboxDurationMinutes, setSandboxDurationMinutes] = useState(defaultSandboxOptions.durationMinutes);
  const [sandboxSeed, setSandboxSeed] = useState(defaultSandboxOptions.seed);

  const best = leaderboard[0];
  const selectedMission = missionRegistry.find((mission) => mission.id === selectedMissionId) ?? missionRegistry[0];
  const selectedUnlocked = isMissionUnlocked(progress, selectedMission.id, selectedMission.unlockAfter);
  const dailyChallenge = useMemo(() => getDailyChallenge(), []);
  const crisisRun = useMemo(() => buildCrisisRun(dailyChallenge.seed), [dailyChallenge.seed]);
  const sandboxPresets = useMemo(() => getSandboxPresets(), []);
  const homePreviewGame = useMemo(() => createInitialGameState(getMissionDefinition("paris-peak").scenario), []);
  const sandboxScenario = useMemo(
    () =>
      buildSandboxScenario({
        mapId: sandboxMapId,
        difficulty: sandboxDifficulty,
        weather: sandboxWeather,
        demand: sandboxDemand,
        incident: sandboxIncident,
        startMinute: sandboxStartMinute,
        durationMinutes: sandboxDurationMinutes,
        seed: sandboxSeed,
      }),
    [
      sandboxDemand,
      sandboxDifficulty,
      sandboxDurationMinutes,
      sandboxIncident,
      sandboxMapId,
      sandboxSeed,
      sandboxStartMinute,
      sandboxWeather,
    ],
  );
  const builderTemplate = useMemo(
    () => scenarioTemplates.find((template) => template.id === builderTemplateId) ?? scenarioTemplates[0],
    [builderTemplateId],
  );
  const builderScenarioTemplate = useMemo<ScenarioBuilderTemplate>(
    () => ({
      ...builderTemplate,
      mapId: builderMapId,
      difficulty: builderDifficulty,
      weather: builderWeather,
      demand: builderDemand,
      incident: builderIncident,
      revealPolicy: builderRevealPolicy,
      startMinute: builderStartMinute,
      durationMinutes: builderDurationMinutes,
    }),
    [
      builderDemand,
      builderDifficulty,
      builderDurationMinutes,
      builderIncident,
      builderMapId,
      builderRevealPolicy,
      builderStartMinute,
      builderTemplate,
      builderWeather,
    ],
  );
  const builderScenario = useMemo(
    () =>
      buildScenarioFromTemplate(builderScenarioTemplate, {
        seed: builderSeed.trim() || "builder-demo",
        title: `Scenario Builder · ${builderScenarioTemplate.label}`,
        runMode: "scenario-builder",
      }),
    [builderScenarioTemplate, builderSeed],
  );
  const builderRecipe = useMemo(() => buildScenarioRecipe(builderScenario), [builderScenario]);
  const campaignMap = useMemo(() => getCampaignMap(missionRegistry, progress), [progress]);
  const modeReward = (id: string) => playModes.find((mode) => mode.id === id)?.unlockRewardId;
  const sandboxUnlocked = hasUnlockedReward(progress, modeReward("sandbox"));
  const builderUnlocked = hasUnlockedReward(progress, modeReward("scenario-builder"));
  const dailyUnlocked = hasUnlockedReward(progress, modeReward("daily-challenge"));
  const crisisUnlocked = hasUnlockedReward(progress, modeReward("crisis-run"));

  const applyBuilderTemplate = (templateId: string) => {
    const template = scenarioTemplates.find((item) => item.id === templateId);
    if (!template) return;
    setBuilderTemplateId(template.id);
    setBuilderMapId(template.mapId);
    setBuilderDifficulty(template.difficulty);
    setBuilderWeather(template.weather);
    setBuilderDemand(template.demand);
    setBuilderIncident(template.incident);
    setBuilderRevealPolicy(template.revealPolicy);
    setBuilderStartMinute(template.startMinute);
    setBuilderDurationMinutes(template.durationMinutes);
  };

  const openLeaderboard = () => {
    hydrateLeaderboard();
    setView("leaderboard");
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#030a10] text-white">
      {/* Live 3D backdrop */}
      <GridSceneCanvas gameOverride={homePreviewGame} showHorizonRing={false} />
      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(2,8,12,0.92)_0%,rgba(2,8,12,0.55)_45%,transparent_72%)]" />
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(2,8,12,0.85)_100%)]" />

      <div className="pointer-events-none absolute inset-0 z-20 flex items-center">
        <section className="pointer-events-auto ml-[6vw] flex max-h-[88vh] w-[min(560px,90vw)] flex-col">
          {view === "home" ? (
            <div className="hud-rise flex max-h-[88vh] flex-col overflow-y-auto pr-1">
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
              <p className="mt-4 max-w-md text-[15px] leading-7 text-zinc-300">
                Défendez le réseau électrique français pendant le pic du soir. Orchestrez les charges IA, gardez les
                services critiques en ligne, évitez le blackout.
              </p>

              <button
                type="button"
                onClick={() => startMission()}
                disabled={!selectedUnlocked}
                className="group mt-6 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-md bg-[var(--c-cyan)] px-6 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-[var(--c-cyan-bright)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Play className="h-4 w-4 transition group-hover:scale-110" />
                Lancer la mission
              </button>
              <button
                type="button"
                onClick={() => startDemoMission("paris-peak")}
                className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-md border border-[var(--c-green)]/40 bg-[var(--c-green)]/[0.08] px-6 text-sm font-bold uppercase tracking-wide text-[var(--c-green)] transition hover:border-[var(--c-green)]/70 hover:bg-[var(--c-green)]/[0.14] hover:shadow-[0_0_24px_rgba(52,245,176,0.22)]"
              >
                <Bot className="h-4 w-4" />
                Mode démo ATHENA
              </button>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--c-muted)]">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--c-green)]" />
                {selectedMission.title} · {formatClock(game.scenario.startMinute)}–{formatClock(game.scenario.endMinute)}
              </p>

              <nav className="mt-5 grid gap-2">
                <MenuButton icon={<Layers className="h-4 w-4" />} label="Campagne" hint={`${campaignMap.nodes.filter((n) => n.status === "completed").length}/${campaignMap.nodes.length} missions`} onClick={() => setView("campaign")} />
                <MenuButton icon={<FlaskConical className="h-4 w-4" />} label="Bac à sable" hint="Carte, météo, demande, incidents" onClick={() => setView("sandbox")} disabled={!sandboxUnlocked} />
                <MenuButton icon={<Wrench className="h-4 w-4" />} label="Éditeur de scénario" hint="Assembler une mission en données" onClick={() => setView("builder")} disabled={!builderUnlocked} />
                <MenuButton icon={<Zap className="h-4 w-4" />} label="Modes rapides" hint="Défi quotidien · Crisis Run" onClick={() => setView("modes")} />
                <MenuButton icon={<Trophy className="h-4 w-4" />} label="Classement" hint={best ? `Record ${Math.round(best.score)} · ${best.badge}` : "Aucun run enregistré"} onClick={openLeaderboard} />
                <MenuButton icon={<Settings className="h-4 w-4" />} label="Réglages" hint={`${renderQualityLabels[renderQuality]} · audio ${audioEnabled ? "on" : "off"} · ×${speed}`} onClick={() => setView("settings")} />
              </nav>

              <button
                type="button"
                onClick={replayTutorial}
                className="mt-3 inline-flex items-center gap-2 self-start text-[12px] font-semibold text-[var(--c-muted)] transition hover:text-white"
              >
                <BookOpen className="h-3.5 w-3.5" /> Revoir l’intro
              </button>
            </div>
          ) : (
            <PageShell
              eyebrow={pageMeta(view).eyebrow}
              title={pageMeta(view).title}
              onBack={() => setView("home")}
            >
              {view === "campaign" && (
                <div className="grid gap-3">
                  <CampaignMissionMap
                    edges={campaignMap.edges}
                    nodes={campaignMap.nodes}
                    selectedMissionId={selectedMissionId}
                    onSelect={selectMission}
                  />
                  <button
                    type="button"
                    onClick={() => startMission()}
                    disabled={!selectedUnlocked}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--c-cyan)] px-5 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-[var(--c-cyan-bright)] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Play className="h-4 w-4" /> Lancer {selectedMission.title}
                  </button>
                </div>
              )}

              {view === "sandbox" && (
                <div className="grid gap-2">
                  <p className="text-[12px] leading-5 text-[var(--c-muted)]">
                    Choisissez un preset ou réglez la carte, la météo, la demande et les incidents, puis lancez.
                  </p>
                  <div className="grid gap-1.5">
                    {sandboxPresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => startScenario(preset.scenario)}
                        className="rounded border border-[var(--c-cyan)]/25 bg-[var(--c-cyan)]/10 px-2.5 py-2 text-left transition hover:bg-[var(--c-cyan)]/15"
                      >
                        <span className="block hud-eyebrow text-[9px] text-[var(--c-cyan-bright)]">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 border-t border-[var(--glass-border-soft)]/70 pt-2">
                    <BuilderSelect label="Carte" value={sandboxMapId} onChange={setSandboxMapId}>
                      {mapRegistry.map((map) => (
                        <option key={map.id} value={map.id} className="bg-[#061018] text-zinc-100">{map.name}</option>
                      ))}
                    </BuilderSelect>
                    <BuilderSelect label="Difficulté" value={sandboxDifficulty} onChange={(value) => setSandboxDifficulty(value as ScenarioBuilderTemplate["difficulty"])}>
                      {difficultyOptions.map((difficulty) => (
                        <option key={difficulty} value={difficulty} className="bg-[#061018] text-zinc-100">{difficulty}</option>
                      ))}
                    </BuilderSelect>
                    <BuilderSelect label="Météo" value={sandboxWeather} onChange={(value) => setSandboxWeather(value as WeatherPreset)}>
                      {weatherOptions.map((weather) => (
                        <option key={weather} value={weather} className="bg-[#061018] text-zinc-100">{weather}</option>
                      ))}
                    </BuilderSelect>
                    <BuilderSelect label="Demande" value={sandboxDemand} onChange={(value) => setSandboxDemand(value as DemandPreset)}>
                      {demandOptions.map((demand) => (
                        <option key={demand} value={demand} className="bg-[#061018] text-zinc-100">{demand}</option>
                      ))}
                    </BuilderSelect>
                    <BuilderSelect label="Incident" value={sandboxIncident} onChange={(value) => setSandboxIncident(value as IncidentPreset)}>
                      {incidentOptions.map((incident) => (
                        <option key={incident} value={incident} className="bg-[#061018] text-zinc-100">{incident}</option>
                      ))}
                    </BuilderSelect>
                    <BuilderSelect label="Début" value={String(sandboxStartMinute)} onChange={(value) => setSandboxStartMinute(Number(value))}>
                      {startMinuteOptions.map((minute) => (
                        <option key={minute} value={minute} className="bg-[#061018] text-zinc-100">{formatClock(minute)}</option>
                      ))}
                    </BuilderSelect>
                    <BuilderSelect label="Durée" value={String(sandboxDurationMinutes)} onChange={(value) => setSandboxDurationMinutes(Number(value))}>
                      {durationOptions.map((duration) => (
                        <option key={duration} value={duration} className="bg-[#061018] text-zinc-100">{duration} min</option>
                      ))}
                    </BuilderSelect>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-1.5">
                    <input
                      value={sandboxSeed}
                      onChange={(event) => setSandboxSeed(event.target.value)}
                      className="h-9 min-w-0 rounded border border-[var(--glass-border-soft)] bg-black/45 px-2 font-mono text-[11px] text-zinc-100 outline-none transition focus:border-[var(--c-cyan)]/60"
                    />
                    <button
                      type="button"
                      onClick={() => startScenario(sandboxScenario)}
                      className="rounded border border-[var(--c-green)]/35 bg-[var(--c-green)]/10 px-4 hud-eyebrow text-[10px] text-[var(--c-green)] transition hover:bg-[var(--c-green)]/18"
                    >
                      Lancer
                    </button>
                  </div>
                </div>
              )}

              {view === "builder" && (
                <div className="grid gap-2">
                  <select
                    value={builderTemplateId}
                    onChange={(event) => applyBuilderTemplate(event.target.value)}
                    className="h-9 rounded border border-[var(--glass-border-soft)] bg-black/45 px-2 text-[12px] font-semibold text-zinc-100 outline-none transition focus:border-[var(--c-cyan)]/60"
                  >
                    {scenarioTemplates.map((template) => (
                      <option key={template.id} value={template.id} className="bg-[#061018] text-zinc-100">{template.label} · {template.difficulty}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-1.5">
                    <BuilderSelect label="Carte" value={builderMapId} onChange={setBuilderMapId}>
                      {mapRegistry.map((map) => (
                        <option key={map.id} value={map.id} className="bg-[#061018] text-zinc-100">{map.name}</option>
                      ))}
                    </BuilderSelect>
                    <BuilderSelect label="Difficulté" value={builderDifficulty} onChange={(value) => setBuilderDifficulty(value as ScenarioBuilderTemplate["difficulty"])}>
                      {difficultyOptions.map((difficulty) => (
                        <option key={difficulty} value={difficulty} className="bg-[#061018] text-zinc-100">{difficulty}</option>
                      ))}
                    </BuilderSelect>
                    <BuilderSelect label="Météo" value={builderWeather} onChange={(value) => setBuilderWeather(value as WeatherPreset)}>
                      {weatherOptions.map((weather) => (
                        <option key={weather} value={weather} className="bg-[#061018] text-zinc-100">{weather}</option>
                      ))}
                    </BuilderSelect>
                    <BuilderSelect label="Demande" value={builderDemand} onChange={(value) => setBuilderDemand(value as DemandPreset)}>
                      {demandOptions.map((demand) => (
                        <option key={demand} value={demand} className="bg-[#061018] text-zinc-100">{demand}</option>
                      ))}
                    </BuilderSelect>
                    <BuilderSelect label="Incident" value={builderIncident} onChange={(value) => setBuilderIncident(value as IncidentPreset)}>
                      {incidentOptions.map((incident) => (
                        <option key={incident} value={incident} className="bg-[#061018] text-zinc-100">{incident}</option>
                      ))}
                    </BuilderSelect>
                    <BuilderSelect label="Intel" value={builderRevealPolicy} onChange={(value) => setBuilderRevealPolicy(value as ScenarioBuilderTemplate["revealPolicy"])}>
                      {revealOptions.map((policy) => (
                        <option key={policy} value={policy} className="bg-[#061018] text-zinc-100">{policy}</option>
                      ))}
                    </BuilderSelect>
                    <BuilderSelect label="Début" value={String(builderStartMinute)} onChange={(value) => setBuilderStartMinute(Number(value))}>
                      {startMinuteOptions.map((minute) => (
                        <option key={minute} value={minute} className="bg-[#061018] text-zinc-100">{formatClock(minute)}</option>
                      ))}
                    </BuilderSelect>
                    <BuilderSelect label="Durée" value={String(builderDurationMinutes)} onChange={(value) => setBuilderDurationMinutes(Number(value))}>
                      {durationOptions.map((duration) => (
                        <option key={duration} value={duration} className="bg-[#061018] text-zinc-100">{duration} min</option>
                      ))}
                    </BuilderSelect>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-1.5">
                    <input
                      value={builderSeed}
                      onChange={(event) => setBuilderSeed(event.target.value)}
                      className="h-9 min-w-0 rounded border border-[var(--glass-border-soft)] bg-black/45 px-2 font-mono text-[11px] text-zinc-100 outline-none transition focus:border-[var(--c-cyan)]/60"
                    />
                    <button
                      type="button"
                      onClick={() => startScenario(builderScenario)}
                      className="rounded border border-[var(--c-cyan)]/30 bg-[var(--c-cyan)]/10 px-4 hud-eyebrow text-[10px] text-[var(--c-cyan-bright)] transition hover:bg-[var(--c-cyan)]/18"
                    >
                      Lancer
                    </button>
                  </div>
                  <div className="rounded border border-[var(--glass-border-soft)] bg-black/35 p-2">
                    <div className="grid grid-cols-3 gap-1.5">
                      <BuilderStat label="Carte" value={builderRecipe.mapName} />
                      <BuilderStat label="Fenêtre" value={builderRecipe.timeWindow} />
                      <BuilderStat label="Intel" value={`${builderRecipe.knownEventCount}/${builderRecipe.forecastEventCount}/${builderRecipe.hiddenEventCount}`} />
                    </div>
                    <div className="mt-2 grid gap-1">
                      {builderRecipe.primaryEvents.slice(0, 3).map((event) => (
                        <div key={event.id} className="grid grid-cols-[38px_1fr_auto] items-center gap-1.5 rounded border border-white/10 bg-white/[0.025] px-1.5 py-1">
                          <span className="mono text-[9px] text-[var(--c-muted)]">{event.time}</span>
                          <span className="truncate text-[10px] font-semibold text-zinc-200">{event.title}</span>
                          <span
                            className="hud-eyebrow text-[8px]"
                            style={{ color: event.intel === "known" ? "var(--c-green)" : event.intel === "forecast" ? "var(--c-amber)" : "var(--c-red)" }}
                          >
                            {event.intel}
                          </span>
                        </div>
                      ))}
                    </div>
                    <textarea
                      readOnly
                      value={builderRecipe.recipeText}
                      className="mt-2 h-20 w-full resize-none rounded border border-white/10 bg-black/45 p-2 font-mono text-[9px] leading-4 text-cyan-100/70 outline-none"
                    />
                  </div>
                </div>
              )}

              {view === "modes" && (
                <div className="grid gap-2.5">
                  <ModeCard
                    label="Défi quotidien"
                    description="Seed commune, incidents identiques pour tous, leaderboard comparable."
                    cta={`Lancer · ${dailyChallenge.seed} · ${dailyChallenge.label}`}
                    locked={!dailyUnlocked}
                    onLaunch={() => startScenario(dailyChallenge.scenario)}
                  />
                  <ModeCard
                    label="Crisis Run"
                    description={`Trois vagues semi-aléatoires, ${crisisRunDoctrines.length} doctrines entre les vagues.`}
                    cta="Vague 1"
                    locked={!crisisUnlocked}
                    onLaunch={() => startScenario(crisisRun[0].scenario)}
                  />
                </div>
              )}

              {view === "leaderboard" && (
                <div className="grid gap-2">
                  {leaderboard.length === 0 ? (
                    <p className="text-[13px] leading-5 text-[var(--c-muted)]">
                      Aucun run enregistré pour l’instant. Terminez une mission pour apparaître ici.
                    </p>
                  ) : (
                    <>
                      <div className="grid gap-1.5">
                        {leaderboard.map((entry, index) => (
                          <div
                            key={entry.id}
                            className="grid grid-cols-[24px_1fr_auto] items-center gap-2 rounded border border-[var(--glass-border-soft)] bg-white/[0.03] px-2.5 py-2"
                          >
                            <span className="hud-num text-sm text-[var(--c-muted)]">{index + 1}</span>
                            <span className="min-w-0">
                              <span className="block truncate text-[12px] font-semibold text-zinc-100">{entry.scenarioName}</span>
                              <span className="block truncate hud-eyebrow text-[9px] text-[var(--c-muted)]">{entry.mode} · {entry.badge}</span>
                            </span>
                            <span className="hud-num text-base text-[var(--c-cyan-bright)]">{Math.round(entry.score)}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={clearLeaderboard}
                        className="justify-self-start rounded border border-[var(--c-red)]/30 bg-[var(--c-red)]/[0.08] px-3 py-1.5 hud-eyebrow text-[9px] text-[var(--c-red)] transition hover:bg-[var(--c-red)]/15"
                      >
                        Réinitialiser
                      </button>
                    </>
                  )}
                </div>
              )}

              {view === "settings" && (
                <div className="grid gap-4">
                  <SettingGroup icon={<Gauge className="h-3.5 w-3.5" />} label="Qualité de rendu" hint="Réduire pour une démo de salon plus stable">
                    <div className="grid grid-cols-3 gap-1.5">
                      {renderQualities.map((quality) => (
                        <ToggleChip key={quality} active={renderQuality === quality} onClick={() => setRenderQuality(quality)}>
                          {renderQualityLabels[quality]}
                        </ToggleChip>
                      ))}
                    </div>
                  </SettingGroup>
                  <SettingGroup icon={audioEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />} label="Audio">
                    <div className="grid grid-cols-2 gap-1.5">
                      <ToggleChip active={audioEnabled} onClick={() => { if (!audioEnabled) toggleAudio(); }}>Activé</ToggleChip>
                      <ToggleChip active={!audioEnabled} onClick={() => { if (audioEnabled) toggleAudio(); }}>Coupé</ToggleChip>
                    </div>
                  </SettingGroup>
                  <SettingGroup icon={<Activity className="h-3.5 w-3.5" />} label="Vitesse par défaut">
                    <div className="grid grid-cols-5 gap-1.5">
                      {simulationSpeeds.map((value) => (
                        <ToggleChip key={value} active={speed === value} onClick={() => setSpeed(value)}>
                          ×{value}
                        </ToggleChip>
                      ))}
                    </div>
                  </SettingGroup>
                </div>
              )}
            </PageShell>
          )}
        </section>
      </div>

      <p className="pointer-events-none absolute bottom-4 right-5 hud-eyebrow text-[var(--c-muted)]/60">
        Faites glisser pour explorer la carte
      </p>
    </main>
  );
}

function pageMeta(view: MenuView): { eyebrow: string; title: string } {
  switch (view) {
    case "campaign":
      return { eyebrow: "Progression", title: "Campagne nationale" };
    case "sandbox":
      return { eyebrow: "Mode libre", title: "Bac à sable" };
    case "builder":
      return { eyebrow: "Données", title: "Éditeur de scénario" };
    case "modes":
      return { eyebrow: "Rejouabilité", title: "Modes rapides" };
    case "leaderboard":
      return { eyebrow: "Scores locaux", title: "Classement" };
    case "settings":
      return { eyebrow: "Démo & confort", title: "Réglages" };
    default:
      return { eyebrow: "", title: "" };
  }
}

function MenuButton({
  icon,
  label,
  hint,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full items-center gap-3 rounded-md border border-[var(--glass-border-soft)] bg-white/[0.03] px-3.5 py-3 text-left transition hover:border-[var(--c-cyan)]/45 hover:bg-[var(--c-cyan)]/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-[var(--c-cyan)]/12 text-[var(--c-cyan-bright)] group-hover:bg-[var(--c-cyan)]/22">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-zinc-100">{label}</span>
        {hint && <span className="block truncate text-[11px] text-[var(--c-muted)]">{hint}</span>}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--c-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--c-cyan-bright)]" />
    </button>
  );
}

function PageShell({
  eyebrow,
  title,
  onBack,
  children,
}: {
  eyebrow: string;
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-strong brackets hud-rise flex max-h-[88vh] flex-col rounded-lg">
      <header className="flex items-center gap-3 border-b border-[var(--glass-border-soft)] px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour"
          className="grid h-8 w-8 shrink-0 place-items-center rounded border border-[var(--glass-border-soft)] bg-white/[0.03] text-[var(--c-muted)] transition hover:border-[var(--c-cyan)]/45 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <p className="hud-eyebrow leading-none text-[var(--c-cyan-bright)]">{eyebrow}</p>
          <h2 className="hud-title truncate text-[18px] leading-tight text-white">{title}</h2>
        </div>
      </header>
      <div className="overflow-y-auto p-4">{children}</div>
    </div>
  );
}

function ModeCard({
  label,
  description,
  cta,
  locked,
  onLaunch,
}: {
  label: string;
  description: string;
  cta: string;
  locked: boolean;
  onLaunch: () => void;
}) {
  return (
    <div className={`rounded-md border border-[var(--glass-border-soft)] bg-black/20 p-3 ${locked ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-zinc-100">{label}</p>
        <span className="hud-eyebrow text-[var(--c-muted)]">{locked ? "verrouillé" : "disponible"}</span>
      </div>
      <p className="mt-1 text-[11px] leading-4 text-[var(--c-muted)]">{description}</p>
      <button
        type="button"
        onClick={onLaunch}
        disabled={locked}
        className="mt-2.5 w-full rounded border border-[var(--c-cyan)]/30 bg-[var(--c-cyan)]/10 px-2 py-2 text-left hud-eyebrow text-[10px] text-[var(--c-cyan-bright)] transition hover:bg-[var(--c-cyan)]/18 disabled:cursor-not-allowed"
      >
        {cta}
      </button>
    </div>
  );
}

function SettingGroup({
  icon,
  label,
  hint,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <p className="flex items-center gap-2 hud-eyebrow text-[var(--c-cyan-bright)]">
        <span className="text-[var(--c-cyan)]">{icon}</span>
        {label}
      </p>
      {hint && <p className="text-[11px] leading-4 text-[var(--c-muted)]">{hint}</p>}
      {children}
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-2 py-2 text-center text-[12px] font-semibold transition ${
        active
          ? "border-[var(--c-cyan)]/60 bg-[var(--c-cyan)]/15 text-[var(--c-cyan-bright)]"
          : "border-[var(--glass-border-soft)] bg-white/[0.03] text-[var(--c-muted)] hover:border-white/25 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function CampaignMissionMap({
  edges,
  nodes,
  selectedMissionId,
  onSelect,
}: {
  edges: CampaignMapEdge[];
  nodes: CampaignMapNode[];
  selectedMissionId: string;
  onSelect: (missionId: string) => void;
}) {
  const selectedMission = missionRegistry.find((mission) => mission.id === selectedMissionId) ?? missionRegistry[0];
  const selectedNode = nodes.find((node) => node.id === selectedMission.id);
  const selectedMap = getMapDefinition(selectedMission.mapId);

  return (
    <section className="glass rounded-md p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="hud-eyebrow text-[var(--c-cyan-bright)]">Campagne nationale</p>
        <p className="mono text-[10px] text-[var(--c-muted)]">
          {nodes.filter((node) => node.status === "completed").length}/{nodes.length} missions
        </p>
      </div>

      <CampaignMap3D edges={edges} nodes={nodes} selectedMissionId={selectedMissionId} onSelect={onSelect} />

      <div className="mt-3 grid gap-2 rounded border border-[var(--glass-border-soft)] bg-black/25 p-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-zinc-100">{selectedMission.title}</p>
            <p className="mt-0.5 text-[11px] leading-4 text-[var(--c-muted)]">
              {selectedMap.name} · {selectedMission.subtitle}
            </p>
          </div>
          <span className="hud-eyebrow shrink-0 text-[var(--c-cyan-bright)]">
            {selectedNode?.medal ?? (selectedNode?.status === "locked" ? "Verrouillé" : "Disponible")}
          </span>
        </div>
        <p className="hud-eyebrow text-[9px] text-[var(--c-green)]">{selectedMission.newMechanic}</p>
      </div>
    </section>
  );
}

function BuilderStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded border border-white/10 bg-white/[0.025] px-1.5 py-1">
      <p className="hud-eyebrow text-[7px] text-[var(--c-muted)]">{label}</p>
      <p className="truncate text-[10px] font-semibold text-cyan-50">{value}</p>
    </div>
  );
}

function BuilderSelect({
  children,
  label,
  onChange,
  value,
}: {
  children: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="hud-eyebrow text-[8px] text-[var(--c-muted)]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 min-w-0 rounded border border-[var(--glass-border-soft)] bg-black/45 px-2 text-[10px] font-semibold text-zinc-100 outline-none transition focus:border-[var(--c-cyan)]/60"
      >
        {children}
      </select>
    </label>
  );
}

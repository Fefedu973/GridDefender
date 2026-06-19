"use client";

import {
  AlertTriangle,
  BatteryCharging,
  Car,
  Clock3,
  Cloud,
  Cpu,
  DatabaseZap,
  Flame,
  GitBranch,
  Hammer,
  MousePointerClick,
  Route,
  Server,
  ShieldAlert,
  TimerReset,
  Zap,
} from "lucide-react";
import { useState } from "react";
import type { ComponentType, DragEvent, SVGProps } from "react";
import { getActionDefinition } from "@/game/actions";
import { filterAvailableActions } from "@/game/commands/commandAvailability";
import { getDefaultCommandDuration, getDefaultCommandIntensity } from "@/game/commands/commandCosts";
import { previewCommand } from "@/game/commands/previewCommand";
import { localActionsForNode } from "@/game/network/gridSelectors";
import type { GridNode, TransmissionLine } from "@/game/network/networkTypes";
import type { CommandTarget, PlayerActionType } from "@/game/types";
import { HudPanel } from "@/features/hud/hudKit";
import { useGameStore, type DemoActionCue } from "@/store/gameStore";
import { formatClock, formatMw } from "@/lib/format";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;
const JOB_DRAG_TYPE = "application/grid-defender-job";

const actionIcons: Record<PlayerActionType, IconComponent> = {
  smart_ev: Car,
  defer_ai: Clock3,
  migrate_ai: GitBranch,
  externalize_ai: Cloud,
  reduce_model: Cpu,
  activate_cache: DatabaseZap,
  agent_timeout: TimerReset,
  discharge_battery: BatteryCharging,
  import_energy: Zap,
  thermal_backup: Flame,
  curtail_industry: ShieldAlert,
  reroute_line: Route,
  repair_line: Hammer,
  authorize_overload: AlertTriangle,
};

function protectionLabel(line: TransmissionLine) {
  if (line.protectionState === "repairing") return line.repairUntil ? `Réparation ${formatClock(line.repairUntil)}` : "Réparation";
  if (line.protectionState === "open") return "Ouverte";
  if (line.protectionState === "tripped") return "Déclenchée";
  if (line.protectionState === "armed") return "Armée";
  return line.isControllable ? "Pilotable" : "Fixe";
}

function sameTarget(a: CommandTarget | undefined, b: CommandTarget | undefined) {
  return Boolean(a && b && a.kind === b.kind && a.id === b.id);
}

function matchesDemoActionTarget(cue: DemoActionCue | undefined, target: CommandTarget, game: ReturnType<typeof useGameStore.getState>["game"]) {
  if (!cue?.target) return false;
  if (sameTarget(cue.target, target)) return true;

  if (cue.target.kind === "workload" && target.kind === "node") {
    const job = game.aiJobs.find((item) => item.id === cue.target?.id);
    return job?.assignedNodeId === target.id;
  }

  if (cue.target.kind === "node" && target.kind === "workload") {
    const job = game.aiJobs.find((item) => item.id === target.id);
    return job?.assignedNodeId === cue.target.id;
  }

  return false;
}

function ActionControl({ action, target }: { action: PlayerActionType; target: CommandTarget }) {
  const applyAction = useGameStore((state) => state.applyAction);
  const game = useGameStore((state) => state.game);
  const lastDemoAction = useGameStore((state) => state.lastDemoAction);
  const def = getActionDefinition(action);
  const Icon = actionIcons[action];
  const defaultIntensity = getDefaultCommandIntensity(action);
  const defaultDuration = getDefaultCommandDuration(action);
  const [intensity, setIntensity] = useState(defaultIntensity);
  const [duration, setDuration] = useState(defaultDuration);
  const hasIntensity = defaultIntensity > 0;
  const command = {
    action,
    target,
    intensityMw: hasIntensity ? intensity : undefined,
    durationMinutes: duration,
  };
  const preview = previewCommand(game, command);
  const cooldownUntil = game.actionCooldowns[action] ?? 0;
  const blockedByCooldown = cooldownUntil > game.minute;
  const blockedByCapacity = preview.cost > game.commandCapacity;
  const disabled = blockedByCooldown || blockedByCapacity;
  const demoActive = lastDemoAction?.action === action && matchesDemoActionTarget(lastDemoAction, target, game);
  const lineImpacts = preview.lineImpacts
    .map((impact) => {
      const line = game.grid.lines.find((item) => item.id === impact.lineId);
      if (!line) return undefined;
      const sign = impact.estimatedUtilizationDelta < 0 ? "-" : "+";
      return `${line.label} ${sign}${Math.abs(Math.round(impact.estimatedUtilizationDelta * 100))} pts`;
    })
    .filter(Boolean)
    .slice(0, 3);
  const demandDelta = Math.round(preview.metricDeltas.demandMw);
  const productionDelta = Math.round(preview.metricDeltas.productionMw);
  const reserveDelta = Math.round(preview.metricDeltas.reserveMw);
  const metricHint = [
    demandDelta !== 0 ? `Demande ${demandDelta > 0 ? "+" : ""}${demandDelta} MW` : undefined,
    productionDelta !== 0 ? `Prod ${productionDelta > 0 ? "+" : ""}${productionDelta} MW` : undefined,
    reserveDelta !== 0 ? `Réserve ${reserveDelta > 0 ? "+" : ""}${reserveDelta} MW` : undefined,
  ].filter(Boolean);
  const estimatedBatteryLevel = preview.resourceDeltas.estimatedBatteryLevelPct;
  const batteryHint =
    estimatedBatteryLevel !== undefined
      ? `Batterie ${Math.round(game.metrics.batteryLevel)}% -> ${Math.round(estimatedBatteryLevel)}%`
      : undefined;
  const contractHint =
    preview.resourceDeltas.organizationName &&
    (preview.resourceDeltas.contractCostPenalty || preview.resourceDeltas.contractReputationPenalty)
      ? `${preview.resourceDeltas.organizationName}: coût -${preview.resourceDeltas.contractCostPenalty ?? 0}, satisfaction -${preview.resourceDeltas.contractReputationPenalty ?? 0}/tick${
          preview.resourceDeltas.contractDurationPenalty
            ? `, hors fenêtre ${preview.resourceDeltas.contractMinDurationMinutes}-${preview.resourceDeltas.contractMaxDurationMinutes} min`
            : ""
        }`
      : undefined;

  return (
    <div
      className={`rounded border p-2 transition ${
        demoActive
          ? "animate-pulse border-[var(--c-green)]/75 bg-[var(--c-green)]/[0.1] shadow-[0_0_26px_rgba(52,245,176,0.22)]"
          : "border-[var(--c-cyan)]/20 bg-[var(--c-cyan)]/[0.05] hover:border-[var(--c-cyan)]/45"
      }`}
    >
      {demoActive && (
        <span className="mb-1.5 inline-flex rounded border border-[var(--c-green)]/40 bg-[var(--c-green)]/10 px-1.5 py-0.5 hud-eyebrow text-[8px] text-[var(--c-green)]">
          ATHENA active
        </span>
      )}
      <button
        type="button"
        onClick={() => applyAction(command, target)}
        disabled={disabled}
        className="group flex w-full items-start gap-3 text-left transition disabled:cursor-not-allowed disabled:opacity-45"
      >
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded bg-[var(--c-cyan)]/12 text-[var(--c-cyan-bright)] group-hover:bg-[var(--c-cyan)]/25">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-cyan-50">{def?.label ?? action}</span>
          <span className="mt-0.5 block text-[11px] leading-4 text-cyan-100/55">{def?.expectedImpact}</span>
          <span className="mono mt-1 block text-[10px] text-[var(--c-muted)]">
            {blockedByCooldown ? "Cooldown actif" : blockedByCapacity ? "Capacité insuffisante" : preview.summary}
          </span>
          {metricHint.length > 0 && (
            <span className="mt-1 block break-words text-[10px] text-cyan-100/50">
              Impact: {metricHint.join(" · ")}
            </span>
          )}
          {batteryHint && (
            <span className="mt-1 block break-words text-[10px] text-[var(--c-amber)]/80">
              {batteryHint}
            </span>
          )}
          {contractHint && (
            <span className="mt-1 block break-words text-[10px] text-[var(--c-amber)]/80">
              {contractHint}
            </span>
          )}
          {lineImpacts.length > 0 && (
            <span className="mt-1 block break-words text-[10px] text-cyan-100/45">
              Lignes: {lineImpacts.join(" · ")}
            </span>
          )}
        </span>
      </button>
      {(hasIntensity || defaultDuration > 0) && (
        <div className="mt-2 grid gap-1.5">
          {hasIntensity && (
            <label className="grid gap-1.5 text-[10px] text-[var(--c-muted)]">
              <span className="mono flex justify-between">
                <span>MW</span>
                <span className="text-cyan-100">{Math.round(intensity)}</span>
              </span>
              <HudSlider
                ariaLabel="Intensité (MW)"
                value={intensity}
                min={5}
                max={Math.max(45, defaultIntensity + 18)}
                step={1}
                onChange={setIntensity}
              />
            </label>
          )}
          <label className="grid gap-1.5 text-[10px] text-[var(--c-muted)]">
            <span className="mono flex justify-between">
              <span>Durée</span>
              <span className="text-cyan-100">{Math.round(duration)} min</span>
            </span>
            <HudSlider
              ariaLabel="Durée (min)"
              value={duration}
              min={5}
              max={120}
              step={5}
              onChange={setDuration}
            />
          </label>
        </div>
      )}
    </div>
  );
}

function ActionDock({ actions, target }: { actions: PlayerActionType[]; target: CommandTarget }) {
  const game = useGameStore((state) => state.game);
  const availableActions = filterAvailableActions(game, actions);
  if (availableActions.length === 0) return null;

  return (
    <div className="grid gap-1.5 p-3 pt-2">
      <p className="hud-eyebrow mb-0.5 text-[var(--c-muted)]">Actions locales</p>
      {availableActions.slice(0, 6).map((action) => (
        <ActionControl key={action} action={action} target={target} />
      ))}
    </div>
  );
}

function DatacenterMigrationTarget({ node }: { node: GridNode }) {
  const applyAction = useGameStore((state) => state.applyAction);
  const game = useGameStore((state) => state.game);
  const [dragActive, setDragActive] = useState(false);
  const localJobs = game.aiJobs.filter(
    (job) => job.assignedNodeId === node.id && job.status !== "completed" && job.status !== "failed",
  );
  const migrableIncomingJobs = game.aiJobs.filter(
    (job) =>
      job.assignedNodeId !== node.id &&
      job.criticality !== "critical" &&
      !job.externalized &&
      job.status !== "completed" &&
      job.status !== "failed",
  );
  const localAiDemand = localJobs.reduce((total, job) => total + job.currentPowerMw, 0);

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!Array.from(event.dataTransfer.types).includes(JOB_DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragActive(true);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const jobId = event.dataTransfer.getData(JOB_DRAG_TYPE);
    if (!jobId) return;

    applyAction({
      action: "migrate_ai",
      target: { kind: "workload", id: jobId },
      destinationNodeId: node.id,
    });
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      className={`mx-3.5 mb-1 rounded border border-dashed px-3 py-2.5 transition ${
        dragActive
          ? "border-[var(--c-cyan-bright)] bg-[var(--c-cyan)]/16 shadow-[0_0_22px_rgba(34,211,238,0.18)]"
          : "border-[var(--c-cyan)]/25 bg-[var(--c-cyan)]/[0.045]"
      }`}
      aria-label={`Migration IA vers ${node.label}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[12px] font-semibold text-cyan-50">
          <GitBranch className="h-3.5 w-3.5 text-[var(--c-cyan-bright)]" />
          Cible migration IA
        </p>
        <span className="mono rounded border border-[var(--c-cyan)]/25 bg-black/25 px-2 py-0.5 text-[10px] text-cyan-100/60">
          {migrableIncomingJobs.length} entrants
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Stat label="Jobs locaux" value={`${localJobs.length}`} accent="#22d3ee" />
        <Stat label="Charge IA" value={formatMw(localAiDemand)} accent="#ffd447" />
      </div>
    </div>
  );
}

/* Div-based slider: full visual control, theme-matched, independent of the
   global input[type=range] CSS. The native range sits on top, invisible, to
   handle keyboard/drag interaction. */
function HudSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
  ariaLabel,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  ariaLabel?: string;
}) {
  const pct = max > min ? Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)) : 0;
  return (
    <div className="relative h-4 w-full select-none">
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/10" />
      <div
        className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full"
        style={{ width: `${pct}%`, background: "var(--c-cyan)", boxShadow: "0 0 8px rgba(34,211,238,0.55)" }}
      />
      <div
        className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#041018]"
        style={{ left: `${pct}%`, background: "var(--c-cyan-bright)", boxShadow: "0 0 8px rgba(34,211,238,0.7)" }}
      />
      <input
        type="range"
        aria-label={ariaLabel}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}

function Stat({ label, value, danger = false, accent }: { label: string; value: string; danger?: boolean; accent?: string }) {
  return (
    <div className="rounded border border-[var(--glass-border-soft)] bg-black/30 px-2.5 py-1.5">
      <p className="hud-eyebrow text-[9px] text-[var(--c-muted)]">{label}</p>
      <p className="hud-num text-base" style={{ color: danger ? "var(--c-red)" : accent ?? "#fff" }}>
        {value}
      </p>
    </div>
  );
}

function statsForNode(node: GridNode) {
  const production = {
    label: "Production",
    value: formatMw(node.productionMw),
    accent: "#34f5b0",
  };
  const demand = {
    label: "Demande",
    value: formatMw(node.demandMw),
    accent: "#ff6b5f",
  };
  const flexibility = {
    label: node.role === "storage" ? "Puissance" : "Flexibilité",
    value: formatMw(node.flexibilityMw),
    accent: "#a78bfa",
  };

  if (node.role === "consumer") {
    return [
      demand,
      ...(node.productionMw > 0 ? [production] : []),
      flexibility,
    ];
  }

  if (node.role === "producer") {
    return [
      production,
      ...(node.demandMw > 0 ? [demand] : []),
      flexibility,
    ];
  }

  if (node.role === "storage") {
    return [
      flexibility,
      ...(node.productionMw > 0 ? [production] : []),
      ...(node.demandMw > 0 ? [demand] : []),
    ];
  }

  return [
    flexibility,
    ...(node.productionMw > 0 ? [production] : []),
    ...(node.demandMw > 0 ? [demand] : []),
  ];
}

export function Inspector() {
  const game = useGameStore((state) => state.game);
  const selectedEntity = useGameStore((state) => state.selectedEntity);
  const snapshot = game.grid;

  if (!selectedEntity) {
    return (
      <HudPanel eyebrow="Inspecteur" title="Aucune sélection" icon={<MousePointerClick className="h-4 w-4" />}>
        <p className="px-3.5 py-3 text-[13px] leading-5 text-[var(--c-muted)]">
          Cliquez un <span className="text-cyan-200">nœud</span> (datacenter, batterie, centrale…) ou une{" "}
          <span className="text-cyan-200">ligne haute tension</span> sur la carte pour ouvrir ses actions.
        </p>
      </HudPanel>
    );
  }

  if (selectedEntity.kind === "line") {
    const line = snapshot.lines.find((item) => item.id === selectedEntity.id);
    if (!line) return null;
    const over = line.utilizationRatio > 0.94;

    return (
      <HudPanel
        eyebrow={`${line.voltageKv} kV · ligne`}
        title={line.label}
        icon={<Zap className="h-4 w-4" />}
        strong
      >
        <div className="grid grid-cols-3 gap-2 px-3.5 py-3">
          <Stat label="Flux" value={formatMw(line.currentFlowMw)} />
          <Stat label="Capacité" value={formatMw(line.capacityMw)} />
          <Stat label="Charge" value={`${Math.round(line.utilizationRatio * 100)}%`} danger={over} accent="#34f5b0" />
          <Stat label="Température" value={`${Math.round(line.temperatureC)}°C`} danger={line.temperatureC > 85} accent="#ffd447" />
          <Stat label="Nominal" value={formatMw(line.nominalCapacityMw)} />
          <Stat label="Protection" value={protectionLabel(line)} danger={line.tripped || line.protectionState === "armed"} accent="#7dd3fc" />
        </div>
        <div className="mx-3.5 mb-1 rounded border border-[var(--c-red)]/25 bg-[var(--c-red)]/[0.08] p-2.5">
          <p className="flex items-center gap-2 text-xs font-semibold text-[var(--c-red)]">
            <AlertTriangle className="h-3.5 w-3.5" /> Causes principales
          </p>
          <ul className="mt-1.5 space-y-0.5 text-[12px] text-zinc-300">
            {line.causes.map((cause) => (
              <li key={cause} className="flex gap-1.5">
                <span className="text-[var(--c-red)]/70">›</span>
                {cause}
              </li>
            ))}
          </ul>
        </div>
        <ActionDock actions={line.actions} target={{ kind: "line", id: line.id }} />
      </HudPanel>
    );
  }

  if (selectedEntity.kind === "node") {
    const node = snapshot.nodes.find((item) => item.id === selectedEntity.id);
    if (!node) return null;
    const stats = statsForNode(node);

    return (
      <HudPanel eyebrow={`${node.region} · ${node.kind}`} title={node.label} icon={<Server className="h-4 w-4" />} strong>
        <p className="px-3.5 pt-2.5 text-[12px] leading-5 text-[var(--c-muted)]">{node.description}</p>
        {node.organization && (
          <div className="mx-3.5 mt-2 rounded border border-[var(--glass-border-soft)] bg-black/25 px-2.5 py-2">
            <p className="hud-eyebrow text-[9px] text-[var(--c-muted)]">Organisation</p>
            <p className="mt-0.5 text-[12px] font-semibold text-zinc-100">{node.organization.name}</p>
            <p className="mono mt-0.5 text-[10px] text-[var(--c-muted)]">
              contrat {node.organization.contract} · {node.organization.minCurtailmentMinutes}-{node.organization.maxCurtailmentMinutes} min · satisfaction {node.organization.satisfaction}%
            </p>
          </div>
        )}
        <div className={`grid gap-2 px-3.5 py-3 ${stats.length >= 3 ? "grid-cols-3" : "grid-cols-2"}`}>
          {stats.map((stat) => (
            <Stat key={stat.label} label={stat.label} value={stat.value} accent={stat.accent} />
          ))}
        </div>
        {node.kind === "datacenter" && <DatacenterMigrationTarget node={node} />}
        <ActionDock actions={localActionsForNode(node, game.aiJobs)} target={{ kind: "node", id: node.id }} />
      </HudPanel>
    );
  }

  if (selectedEntity.kind === "workload") {
    const job = game.aiJobs.find((item) => item.id === selectedEntity.id);
    if (!job) return null;
    const critical = job.criticality === "critical";

    return (
      <HudPanel eyebrow={`Job IA · ${job.kind}`} title={job.name} icon={<Cpu className="h-4 w-4" />} strong>
        <p className="px-3.5 pt-2.5 text-[12px] leading-5 text-[var(--c-muted)]">{job.narrative}</p>
        <div className="grid grid-cols-3 gap-2 px-3.5 py-3">
          <Stat label="Puissance" value={formatMw(job.currentPowerMw)} accent="#22d3ee" />
          <Stat label="Avancement" value={`${Math.round(job.progress)}%`} accent="#34f5b0" />
          <Stat label="Deadline" value={formatClock(job.deadlineMinute)} accent={critical ? "#ff2f5f" : "#ffd447"} />
        </div>
        {critical && (
          <p className="mx-3.5 mb-1 flex items-center gap-1.5 rounded border border-[var(--c-red)]/25 bg-[var(--c-red)]/[0.08] px-2.5 py-1.5 text-[11px] text-[var(--c-red)]">
            <AlertTriangle className="h-3.5 w-3.5" /> Job critique souverain — à ne pas couper.
          </p>
        )}
        <ActionDock
          actions={["defer_ai", "migrate_ai", "externalize_ai", "reduce_model", "activate_cache", "agent_timeout"]}
          target={{ kind: "workload", id: job.id }}
        />
      </HudPanel>
    );
  }

  return null;
}

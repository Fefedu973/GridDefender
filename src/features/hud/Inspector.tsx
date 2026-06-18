"use client";

import {
  AlertTriangle,
  BatteryCharging,
  Car,
  Clock3,
  Cpu,
  DatabaseZap,
  Flame,
  MousePointerClick,
  Server,
  TimerReset,
  Zap,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { getActionDefinition } from "@/game/actions";
import { getFranceGridSnapshot } from "@/game/network/franceGrid";
import type { GridNode } from "@/game/network/networkTypes";
import type { PlayerActionType } from "@/game/types";
import { HudPanel } from "@/features/hud/hudKit";
import { useGameStore } from "@/store/gameStore";
import { formatClock, formatMw } from "@/lib/format";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const actionIcons: Record<PlayerActionType, IconComponent> = {
  smart_ev: Car,
  defer_ai: Clock3,
  reduce_model: Cpu,
  activate_cache: DatabaseZap,
  agent_timeout: TimerReset,
  discharge_battery: BatteryCharging,
  import_energy: Zap,
  thermal_backup: Flame,
};

function actionsForNode(node: GridNode): PlayerActionType[] {
  if (node.kind === "datacenter") return ["defer_ai", "reduce_model", "activate_cache", "agent_timeout"];
  if (node.kind === "battery") return ["discharge_battery"];
  if (node.kind === "ev" || node.kind === "city") return ["smart_ev", "discharge_battery", "import_energy"];
  return ["discharge_battery", "import_energy"];
}

function ActionDock({ actions }: { actions: PlayerActionType[] }) {
  const applyAction = useGameStore((state) => state.applyAction);
  if (actions.length === 0) return null;

  return (
    <div className="grid gap-1.5 p-3 pt-2">
      <p className="hud-eyebrow mb-0.5 text-[var(--c-muted)]">Actions locales</p>
      {actions.slice(0, 5).map((action) => {
        const def = getActionDefinition(action);
        const Icon = actionIcons[action];
        return (
          <button
            key={action}
            type="button"
            onClick={() => applyAction(action)}
            className="group flex items-start gap-3 rounded border border-[var(--c-cyan)]/20 bg-[var(--c-cyan)]/[0.06] px-3 py-2 text-left transition hover:border-[var(--c-cyan)]/60 hover:bg-[var(--c-cyan)]/[0.14]"
          >
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded bg-[var(--c-cyan)]/12 text-[var(--c-cyan-bright)] group-hover:bg-[var(--c-cyan)]/25">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-cyan-50">{def?.label ?? action}</span>
              <span className="mt-0.5 block text-[11px] leading-4 text-cyan-100/55">{def?.expectedImpact}</span>
            </span>
          </button>
        );
      })}
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
  const snapshot = getFranceGridSnapshot(game);

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
        <ActionDock actions={line.actions} />
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
        <div className={`grid gap-2 px-3.5 py-3 ${stats.length >= 3 ? "grid-cols-3" : "grid-cols-2"}`}>
          {stats.map((stat) => (
            <Stat key={stat.label} label={stat.label} value={stat.value} accent={stat.accent} />
          ))}
        </div>
        <ActionDock actions={actionsForNode(node)} />
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
        <ActionDock actions={["defer_ai", "reduce_model", "activate_cache", "agent_timeout"]} />
      </HudPanel>
    );
  }

  return null;
}

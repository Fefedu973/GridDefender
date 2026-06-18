"use client";

import { AthenaConsole } from "@/features/hud/AthenaConsole";
import { CommandTopBar } from "@/features/hud/CommandTopBar";
import { Inspector } from "@/features/hud/Inspector";
import { JobsPanel } from "@/features/hud/JobsPanel";
import { MapLegend } from "@/features/hud/MapLegend";
import { MetricRail } from "@/features/hud/MetricRail";
import { Telemetry } from "@/features/hud/Telemetry";
import { TimelineTrack } from "@/features/hud/TimelineTrack";
import { FranceGridCanvas } from "@/features/map3d/FranceGridCanvas";
import { useGameStore } from "@/store/gameStore";

export function Cockpit() {
  const stability = useGameStore((state) => state.game.metrics.stability);
  const crisis = stability < 35;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#030a10] text-white">
      {/* Live 3D command map fills the screen */}
      <FranceGridCanvas />

      {/* Edge darkening so floating HUD text stays legible over bright map areas */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(2,8,12,0.7)_100%)]" />
      {crisis && <div className="crisis-vignette pointer-events-none absolute inset-0 z-10" />}

      {/* HUD layer */}
      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto absolute left-3 right-3 top-3 z-30">
          <CommandTopBar />
        </div>

        <div className="pointer-events-auto absolute left-3 top-[74px] bottom-[150px] z-20 w-[262px] overflow-y-auto">
          <MetricRail />
        </div>

        <div className="pointer-events-auto absolute right-3 top-[74px] bottom-[150px] z-20 flex w-[344px] flex-col gap-3 overflow-y-auto pr-0.5">
          <Inspector />
          <JobsPanel />
        </div>

        <div className="absolute left-1/2 top-[74px] z-20 -translate-x-1/2">
          <MapLegend />
        </div>

        <div className="absolute bottom-[104px] left-3 z-20">
          <AthenaConsole />
        </div>

        <div className="absolute bottom-[104px] right-3 z-30">
          <Telemetry />
        </div>

        <div className="pointer-events-auto absolute bottom-3 left-3 right-3 z-20">
          <TimelineTrack />
        </div>
      </div>
    </div>
  );
}

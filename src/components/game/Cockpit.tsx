"use client";

import { DashboardCharts } from "@/components/charts/DashboardCharts";
import { ActionPanel } from "@/components/game/ActionPanel";
import { AIJobsPanel } from "@/components/game/AIJobsPanel";
import { AssistantPanel } from "@/components/game/AssistantPanel";
import { EventFeed } from "@/components/game/EventFeed";
import { GameHeader } from "@/components/game/GameHeader";
import { MissionControl, MissionTimeline } from "@/components/game/MissionControl";
import { GridMap } from "@/components/map/GridMap";

export function Cockpit() {
  return (
    <div className="min-h-screen bg-[#05070a] text-white">
      <div className="grid-bg fixed inset-0 opacity-55" />
      <div className="relative z-10">
        <GameHeader />
        <main className="mx-auto grid max-w-[1840px] gap-4 px-4 py-4 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="min-w-0 space-y-4">
            <MissionControl />
            <MissionTimeline />
            <GridMap />
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
              <DashboardCharts compact />
              <EventFeed />
            </div>
          </section>

          <aside className="space-y-4 2xl:sticky 2xl:top-4 2xl:self-start">
            <ActionPanel />
            <AssistantPanel />
            <AIJobsPanel />
          </aside>
        </main>
      </div>
    </div>
  );
}

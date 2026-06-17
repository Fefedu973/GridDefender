"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel } from "@/components/ui/Panel";
import { useGameStore } from "@/store/gameStore";

export function DashboardCharts({ compact = false }: { compact?: boolean }) {
  const timeline = useGameStore((state) => state.game.timeline);
  const height = compact ? 190 : 238;

  return (
    <Panel title="Tendances" eyebrow="Telemetry">
      <div className="grid gap-3 p-3 lg:grid-cols-2">
        <div className="h-[220px] min-w-0 rounded-[6px] border border-white/10 bg-white/[0.035] p-3" style={{ height }}>
          <p className="mb-2 text-xs font-semibold text-zinc-300">Production vs demande</p>
          <ResponsiveContainer width="100%" height="88%">
            <AreaChart data={timeline}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="label" stroke="#71717a" fontSize={10} minTickGap={18} />
              <YAxis stroke="#71717a" fontSize={10} width={34} />
              <Tooltip
                contentStyle={{
                  background: "#071016",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 6,
                  color: "#fff",
                }}
              />
              <Area
                type="monotone"
                dataKey="productionMw"
                name="Production MW"
                stroke="#34d399"
                fill="#34d399"
                fillOpacity={0.16}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="demandMw"
                name="Demande MW"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.12}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="h-[220px] min-w-0 rounded-[6px] border border-white/10 bg-white/[0.035] p-3" style={{ height }}>
          <p className="mb-2 text-xs font-semibold text-zinc-300">Stabilite, IA et batterie</p>
          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={timeline}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="label" stroke="#71717a" fontSize={10} minTickGap={18} />
              <YAxis stroke="#71717a" fontSize={10} width={34} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: "#071016",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 6,
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="stability"
                name="Stabilite"
                stroke="#34d399"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="batteryLevel"
                name="Batterie"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="aiLoadMw"
                name="Charge IA MW"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Panel>
  );
}

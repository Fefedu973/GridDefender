"use client";

import { Brain, ShieldCheck, TriangleAlert } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { useGameStore } from "@/store/gameStore";
import { formatClock } from "@/lib/format";

const toneClass = {
  info: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
  warning: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  critical: "border-red-400/30 bg-red-500/10 text-red-100",
};

const toneIcon = {
  info: ShieldCheck,
  warning: TriangleAlert,
  critical: TriangleAlert,
};

export function AssistantPanel() {
  const messages = useGameStore((state) => state.game.assistantMessages);

  return (
    <Panel
      title="ATHENA Grid"
      eyebrow="Advisor"
      action={<Brain className="h-4 w-4 text-cyan-200" aria-hidden="true" />}
    >
      <div className="max-h-[270px] space-y-2 overflow-auto p-3">
        {messages.map((message) => {
          const Icon = toneIcon[message.tone];

          return (
            <article
              key={message.id}
              className={`rounded-[6px] border p-3 ${toneClass[message.tone]}`}
            >
              <div className="mb-1 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <h3 className="truncate text-sm font-semibold">{message.title}</h3>
                </div>
                <span className="font-mono text-[11px] opacity-70">
                  {formatClock(message.minute)}
                </span>
              </div>
              <p className="text-xs leading-5 opacity-90">{message.body}</p>
            </article>
          );
        })}
      </div>
    </Panel>
  );
}

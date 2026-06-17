"use client";

import { Brain, ChevronRight } from "lucide-react";
import { getActionDefinition } from "@/game/actions";
import { getAdvisorRecommendation } from "@/game/advisor/rules";
import { useGameStore } from "@/store/gameStore";
import { formatClock } from "@/lib/format";

export function AthenaConsole() {
  const game = useGameStore((state) => state.game);
  const applyAction = useGameStore((state) => state.applyAction);
  const message = game.assistantMessages[0];

  // Live recommendation gives us a one-click suggested action.
  const reco = getAdvisorRecommendation(game);
  const suggestion = reco.suggestedAction;
  const suggestionDef = suggestion ? getActionDefinition(suggestion) : undefined;

  const tone = message?.tone ?? "info";
  const accent = tone === "critical" ? "var(--c-red)" : tone === "warning" ? "var(--c-amber)" : "var(--c-cyan)";

  return (
    <div className="glass-strong brackets pointer-events-auto w-[420px] max-w-[80vw] rounded-md p-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 hud-eyebrow" style={{ color: accent }}>
          <span className="grid h-6 w-6 place-items-center rounded-full" style={{ background: `${accent}22`, border: `1px solid ${accent}55` }}>
            <Brain className="h-3.5 w-3.5" />
          </span>
          ATHENA Grid
        </p>
        {message && <span className="mono text-[11px] text-[var(--c-muted)]">{formatClock(message.minute)}</span>}
      </div>

      <h3 className="mt-2 hud-title text-[15px] text-white">{message?.title ?? reco.title}</h3>
      <p className="mt-1 text-[12.5px] leading-5 text-zinc-300/90">{message?.body ?? reco.body}</p>

      {suggestion && suggestionDef && (
        <button
          type="button"
          onClick={() => applyAction(suggestion)}
          className="group mt-3 flex w-full items-center justify-between gap-2 rounded border px-3 py-2 text-left transition"
          style={{ borderColor: `${accent}55`, background: `${accent}14` }}
        >
          <span className="min-w-0">
            <span className="hud-eyebrow block" style={{ color: accent }}>
              Action recommandée
            </span>
            <span className="block truncate text-[13px] font-semibold text-white">{suggestionDef.label}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-white transition group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  );
}

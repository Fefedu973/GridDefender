"use client";

import { Brain, ChevronRight } from "lucide-react";
import { getActionDefinition } from "@/game/actions";
import { getAdvisorOptions } from "@/game/advisor/options";
import { getAdvisorRecommendation } from "@/game/advisor/rules";
import { useGameStore } from "@/store/gameStore";
import { formatClock } from "@/lib/format";

export function AthenaConsole() {
  const game = useGameStore((state) => state.game);
  const demoMode = useGameStore((state) => state.demoMode);
  const lastDemoAction = useGameStore((state) => state.lastDemoAction);
  const applyAction = useGameStore((state) => state.applyAction);
  const message = game.assistantMessages[0];

  // Live recommendation gives us a one-click suggested action.
  const reco = getAdvisorRecommendation(game);
  const suggestion = reco.suggestedAction;
  const suggestionDef = suggestion ? getActionDefinition(suggestion) : undefined;
  const options = getAdvisorOptions(game);
  const suggestedOption = suggestion ? options.find((option) => option.action === suggestion) : undefined;
  const autopilotAvailable = game.athenaTokens > 0 && Boolean(suggestedOption?.autopilotEligible);

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

      {demoMode && lastDemoAction && (
        <div className="mt-2 rounded border border-[var(--c-green)]/30 bg-[var(--c-green)]/[0.08] px-2.5 py-1.5">
          <p className="hud-eyebrow text-[8px] text-[var(--c-green)]">Mode démo · commande ATHENA</p>
          <p className="mt-0.5 truncate text-[12px] font-semibold text-cyan-50">
            {getActionDefinition(lastDemoAction.action)?.label ?? lastDemoAction.action}
            {lastDemoAction.targetLabel ? ` · ${lastDemoAction.targetLabel}` : ""}
          </p>
        </div>
      )}

      {options.length > 0 && (
        <div className="mt-3 grid gap-1.5">
          {options.map((option) => {
            const blocked = option.cooldownBlocked || option.capacityBlocked;
            const reserve = Math.round(option.reserveDeltaMw);
            return (
              <div
                key={option.action}
                className={`grid grid-cols-[1fr_auto] items-center gap-2 rounded border px-2.5 py-1.5 ${
                  option.reason === "recommended"
                    ? "border-[var(--c-cyan)]/35 bg-[var(--c-cyan)]/[0.08]"
                    : "border-[var(--glass-border-soft)] bg-black/20"
                } ${blocked ? "opacity-55" : ""}`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-semibold text-zinc-100">{option.label}</span>
                  <span className="mono mt-0.5 block text-[10px] text-[var(--c-muted)]">
                    {option.reason === "recommended" ? "recommandé" : "option"} · {option.cost} CP
                    {blocked ? " · bloqué" : ""}
                  </span>
                  {option.targetLabel && (
                    <span className="mono mt-0.5 block truncate text-[10px] text-cyan-100/45">
                      cible · {option.targetLabel}
                    </span>
                  )}
                </span>
                <span
                  className="hud-num text-sm"
                  style={{ color: reserve >= 0 ? "var(--c-green)" : "var(--c-red)" }}
                >
                  {reserve > 0 ? "+" : ""}
                  {reserve} MW
                </span>
              </div>
            );
          })}
        </div>
      )}

      {suggestion && suggestionDef && suggestedOption?.autopilotEligible && (
        <button
          type="button"
          onClick={() => applyAction({ ...(suggestedOption?.command ?? { action: suggestion }), source: "athena" })}
          disabled={!autopilotAvailable}
          className="group mt-3 flex w-full items-center justify-between gap-2 rounded border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-45"
          style={{ borderColor: `${accent}55`, background: `${accent}14` }}
        >
          <span className="min-w-0">
            <span className="hud-eyebrow block" style={{ color: accent }}>
              Autopilot ATHENA · {game.athenaTokens} jeton{game.athenaTokens > 1 ? "s" : ""} · +5 CP
            </span>
            <span className="block truncate text-[13px] font-semibold text-white">
              {suggestionDef.label}
              {suggestedOption?.targetLabel ? ` · ${suggestedOption.targetLabel}` : ""}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-white transition group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  );
}

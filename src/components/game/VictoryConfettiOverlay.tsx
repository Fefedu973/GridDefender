import type { CSSProperties } from "react";
import { createVictoryConfettiPieces } from "@/components/game/victoryConfetti";

type VictoryConfettiOverlayProps = {
  seed: string;
};

type ConfettiStyle = CSSProperties & {
  "--confetti-color": string;
  "--confetti-depth": string;
  "--confetti-drift": string;
  "--confetti-duration": string;
  "--confetti-delay": string;
  "--confetti-opacity": string;
  "--confetti-rotate-x": string;
  "--confetti-rotate-y": string;
  "--confetti-rotate-z": string;
  "--confetti-spin-x": string;
  "--confetti-spin-y": string;
  "--confetti-spin-z": string;
  "--confetti-travel": string;
};

export function VictoryConfettiOverlay({ seed }: VictoryConfettiOverlayProps) {
  const pieces = createVictoryConfettiPieces(seed);

  return (
    <div className="victory-confetti-layer" aria-hidden="true">
      <div className="victory-confetti-aura victory-confetti-aura--left" />
      <div className="victory-confetti-aura victory-confetti-aura--right" />
      {pieces.map((piece) => {
        const style: ConfettiStyle = {
          "--confetti-color": piece.color,
          "--confetti-depth": `${piece.depthPx}px`,
          "--confetti-drift": `${piece.driftVw}vw`,
          "--confetti-duration": `${piece.durationMs}ms`,
          "--confetti-delay": `${piece.delayMs}ms`,
          "--confetti-opacity": `${piece.opacity}`,
          "--confetti-rotate-x": `${piece.rotateXDeg}deg`,
          "--confetti-rotate-y": `${piece.rotateYDeg}deg`,
          "--confetti-rotate-z": `${piece.rotateZDeg}deg`,
          "--confetti-spin-x": `${piece.spinXDeg}deg`,
          "--confetti-spin-y": `${piece.spinYDeg}deg`,
          "--confetti-spin-z": `${piece.spinZDeg}deg`,
          "--confetti-travel": `${piece.travelVh}vh`,
          height: `${piece.heightPx}px`,
          left: `${piece.xPct}%`,
          top: `${piece.yStartVh}vh`,
          width: `${piece.widthPx}px`,
        };

        return <span key={piece.id} className={`victory-confetti-piece victory-confetti-piece--${piece.shape}`} style={style} />;
      })}
    </div>
  );
}


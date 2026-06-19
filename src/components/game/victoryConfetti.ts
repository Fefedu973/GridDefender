export type VictoryConfettiShape = "plate" | "ribbon" | "spark" | "ring";

export type VictoryConfettiPiece = {
  id: string;
  shape: VictoryConfettiShape;
  color: string;
  xPct: number;
  yStartVh: number;
  driftVw: number;
  depthPx: number;
  widthPx: number;
  heightPx: number;
  durationMs: number;
  delayMs: number;
  rotateXDeg: number;
  rotateYDeg: number;
  rotateZDeg: number;
  spinXDeg: number;
  spinYDeg: number;
  spinZDeg: number;
  travelVh: number;
  opacity: number;
};

export const VICTORY_CONFETTI_PIECE_COUNT = 220;
export const VICTORY_CONFETTI_MIN_DURATION_MS = 7200;
export const VICTORY_CONFETTI_MAX_FINISH_MS = 15400;

const VICTORY_CONFETTI_COLORS = ["#34f5b0", "#22d3ee", "#7df9ff", "#ffd447", "#ff6b5f", "#a78bfa", "#f8fafc"];
const SHAPES: VictoryConfettiShape[] = ["plate", "ribbon", "spark", "ring"];

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed: string) {
  let value = hashSeed(seed) || 1;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function round(value: number, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function lerp(min: number, max: number, amount: number) {
  return min + (max - min) * amount;
}

function pick<T>(values: T[], random: () => number) {
  return values[Math.min(values.length - 1, Math.floor(random() * values.length))];
}

export function createVictoryConfettiPieces(seed = "grid-defender-victory", count = VICTORY_CONFETTI_PIECE_COUNT): VictoryConfettiPiece[] {
  const random = createRandom(seed);

  return Array.from({ length: count }, (_, index) => {
    const depthAmount = random();
    const depthPx = lerp(-260, 260, depthAmount);
    const scale = lerp(0.78, 1.55, depthAmount);
    const shape = SHAPES[index % SHAPES.length];
    const laneX = ((index + 0.12 + random() * 0.76) / count) * 100;
    const sidePush = index % 17 === 0 ? (random() > 0.5 ? -4.5 : 4.5) : 0;
    const baseSize = shape === "ribbon" ? lerp(10, 17, random()) : shape === "spark" ? lerp(5, 9, random()) : lerp(8, 14, random());
    const width = shape === "ribbon" ? baseSize * lerp(2.2, 3.2, random()) : shape === "spark" ? baseSize : baseSize * lerp(1.1, 1.55, random());
    const height = shape === "ribbon" ? baseSize * lerp(0.42, 0.62, random()) : shape === "spark" ? baseSize : baseSize * lerp(0.9, 1.25, random());
    const durationMs = Math.round(lerp(VICTORY_CONFETTI_MIN_DURATION_MS, 11800, random()) + (1 - depthAmount) * 1100);
    const delayMs = Math.round(lerp(0, 3600, random()) + (index % 8) * 95);

    return {
      id: `confetti-${index}`,
      shape,
      color: pick(VICTORY_CONFETTI_COLORS, random),
      xPct: round(Math.max(0.4, Math.min(99.6, laneX + sidePush))),
      yStartVh: round(lerp(-22, -7, random())),
      driftVw: round(lerp(-18, 18, random()) + (laneX < 20 ? lerp(2, 10, random()) : laneX > 80 ? lerp(-10, -2, random()) : 0)),
      depthPx: Math.round(depthPx),
      widthPx: round(width * scale, 1),
      heightPx: round(height * scale, 1),
      durationMs: Math.min(durationMs, VICTORY_CONFETTI_MAX_FINISH_MS - delayMs),
      delayMs,
      rotateXDeg: Math.round(lerp(-76, 76, random())),
      rotateYDeg: Math.round(lerp(-68, 68, random())),
      rotateZDeg: Math.round(lerp(0, 360, random())),
      spinXDeg: Math.round(lerp(420, 1180, random()) * (random() > 0.5 ? 1 : -1)),
      spinYDeg: Math.round(lerp(360, 1040, random()) * (random() > 0.5 ? 1 : -1)),
      spinZDeg: Math.round(lerp(540, 1440, random()) * (random() > 0.5 ? 1 : -1)),
      travelVh: round(lerp(112, 136, random())),
      opacity: round(lerp(0.72, 0.98, random())),
    };
  });
}


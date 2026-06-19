import type { TransmissionLine } from "@/game/network/networkTypes";
import { clamp } from "@/lib/math";

const AMBIENT_C = 20;
const MAX_C = 150;

/** Equilibrium temperature a conductor trends toward at a given utilization. */
function targetTemperature(ratio: number): number {
  if (ratio <= 0.8) return AMBIENT_C + (ratio / 0.8) * 20; // 20..40
  if (ratio <= 1.0) return 40 + ((ratio - 0.8) / 0.2) * 20; // 40..60 (stable band)
  if (ratio <= 1.15) return 60 + ((ratio - 1.0) / 0.15) * 25; // 60..85 (slow heat)
  if (ratio <= 1.3) return 85 + ((ratio - 1.15) / 0.15) * 25; // 85..110 (fast heat)
  return clamp(110 + (ratio - 1.3) * 80, 110, MAX_C); // imminent
}

/**
 * Integrate conductor heat over one tick of `tickMinutes`. Conductors heat
 * faster than they cool, giving overloads inertia: a line yellows, then
 * oranges, then reddens before protection acts. Also persists how long the line
 * has spent above capacity (the audit's §20.2 fix — per-line, not global tick).
 */
export function updateLineThermal(line: TransmissionLine, tickMinutes: number): void {
  if (line.tripped) {
    line.temperatureC = clamp(line.temperatureC + (AMBIENT_C - line.temperatureC) * 0.4, AMBIENT_C, MAX_C);
    line.overloadDuration = 0;
    return;
  }

  const ratio = line.utilizationRatio;
  const target = targetTemperature(ratio);
  const rate = target > line.temperatureC ? 0.5 : 0.25;
  line.temperatureC = clamp(line.temperatureC + (target - line.temperatureC) * rate, AMBIENT_C, MAX_C);

  if (ratio > 1.0) {
    line.overloadDuration += tickMinutes;
  } else {
    line.overloadDuration = Math.max(0, line.overloadDuration - tickMinutes);
  }
}

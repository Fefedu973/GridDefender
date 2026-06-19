import type { TransmissionLine } from "@/game/network/networkTypes";

/** Sustained-heat trip threshold (°C). Reached only after a real overload. */
const TRIP_TEMPERATURE_C = 120;
/** Instant trip on a severe overload, used for fast cascade propagation. */
const INSTANT_TRIP_RATIO = 1.6;

/** A live line trips when it is too hot, or instantly on a severe overload. */
export function shouldTrip(line: TransmissionLine): boolean {
  if (line.tripped) return false;
  return line.temperatureC >= TRIP_TEMPERATURE_C || line.utilizationRatio >= INSTANT_TRIP_RATIO;
}

/** Take a line offline and record the trip. */
export function tripLine(line: TransmissionLine): void {
  line.tripped = true;
  line.protectionState = "tripped";
  line.repairUntil = undefined;
  line.tripCount += 1;
  line.signedFlowMw = 0;
  line.currentFlowMw = 0;
  line.utilizationRatio = 0;
  line.status = "offline";
}

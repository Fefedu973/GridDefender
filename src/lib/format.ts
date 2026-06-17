export function formatClock(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

export function formatMw(value: number) {
  return `${Math.round(value)} MW`;
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

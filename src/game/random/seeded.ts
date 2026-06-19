export type SeededRandom = () => number;

export function hashSeed(seed: string | number): number {
  const text = String(seed);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededRandom(seed: string | number): SeededRandom {
  let state = hashSeed(seed) || 0x9e3779b9;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickSeeded<T>(items: readonly T[], random: SeededRandom): T {
  return items[Math.floor(random() * items.length)];
}

export function seededInt(min: number, max: number, random: SeededRandom): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

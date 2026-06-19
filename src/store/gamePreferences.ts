"use client";

export const simulationSpeeds = [0.25, 0.5, 1, 2, 4] as const;
export type SimulationSpeed = (typeof simulationSpeeds)[number];

export const viewLayers = ["grid", "ai", "carbon"] as const;
export type ViewLayer = (typeof viewLayers)[number];

export const renderQualities = ["safe", "standard", "high"] as const;
export type RenderQuality = (typeof renderQualities)[number];

export interface GamePreferences {
  audioEnabled: boolean;
  renderQuality: RenderQuality;
  speed: SimulationSpeed;
  viewLayer: ViewLayer;
}

interface PreferenceStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export const preferencesKey = "grid-defender-preferences";

export const defaultGamePreferences: GamePreferences = {
  audioEnabled: false,
  renderQuality: "standard",
  speed: 1,
  viewLayer: "grid",
};

function isSimulationSpeed(value: unknown): value is SimulationSpeed {
  return simulationSpeeds.includes(value as SimulationSpeed);
}

function isViewLayer(value: unknown): value is ViewLayer {
  return viewLayers.includes(value as ViewLayer);
}

function isRenderQuality(value: unknown): value is RenderQuality {
  return renderQualities.includes(value as RenderQuality);
}

export function normalizeGamePreferences(value: unknown): GamePreferences {
  if (!value || typeof value !== "object") return defaultGamePreferences;
  const candidate = value as Partial<GamePreferences>;

  return {
    audioEnabled: typeof candidate.audioEnabled === "boolean" ? candidate.audioEnabled : defaultGamePreferences.audioEnabled,
    renderQuality: isRenderQuality(candidate.renderQuality) ? candidate.renderQuality : defaultGamePreferences.renderQuality,
    speed: isSimulationSpeed(candidate.speed) ? candidate.speed : defaultGamePreferences.speed,
    viewLayer: isViewLayer(candidate.viewLayer) ? candidate.viewLayer : defaultGamePreferences.viewLayer,
  };
}

export function getAvailableViewLayers(map?: { availableLayers?: readonly ViewLayer[] }): ViewLayer[] {
  const layers = map?.availableLayers?.filter(isViewLayer) ?? viewLayers;
  const unique = [...new Set(layers)];
  return unique.length > 0 ? unique : [defaultGamePreferences.viewLayer];
}

export function coerceViewLayer(layer: ViewLayer, map?: { availableLayers?: readonly ViewLayer[] }): ViewLayer {
  const available = getAvailableViewLayers(map);
  return available.includes(layer) ? layer : available[0];
}

export function loadGamePreferences(storage?: PreferenceStorage): GamePreferences {
  const targetStorage = storage ?? (typeof window === "undefined" ? undefined : window.localStorage);
  if (!targetStorage) return defaultGamePreferences;

  try {
    const raw = targetStorage.getItem(preferencesKey);
    return raw ? normalizeGamePreferences(JSON.parse(raw)) : defaultGamePreferences;
  } catch {
    return defaultGamePreferences;
  }
}

export function persistGamePreferences(preferences: GamePreferences, storage?: PreferenceStorage) {
  const targetStorage = storage ?? (typeof window === "undefined" ? undefined : window.localStorage);
  if (!targetStorage) return;

  targetStorage.setItem(preferencesKey, JSON.stringify(normalizeGamePreferences(preferences)));
}

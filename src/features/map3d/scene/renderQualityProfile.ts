import type { RenderQuality } from "@/store/gamePreferences";

export interface SceneRenderQualityProfile {
  antialias: boolean;
  bloomIntensity: number;
  crisisRingSegments: number;
  dpr: [number, number];
  extraLights: boolean;
  flowParticleScale: number;
  heatSparkScale: number;
  lightScale: number;
  postprocessing: boolean;
  pylonDensity: number;
  pylonInsulators: boolean;
  pylonShadows: boolean;
  shadowMode: false | "percentage";
  weatherEffects: boolean;
}

const QUALITY_PROFILES: Record<RenderQuality, SceneRenderQualityProfile> = {
  safe: {
    antialias: false,
    bloomIntensity: 0,
    crisisRingSegments: 24,
    dpr: [1, 1],
    extraLights: false,
    flowParticleScale: 0.45,
    heatSparkScale: 0.55,
    lightScale: 0.48,
    postprocessing: false,
    pylonDensity: 0.45,
    pylonInsulators: false,
    pylonShadows: false,
    shadowMode: false,
    weatherEffects: false,
  },
  standard: {
    antialias: true,
    bloomIntensity: 0.55,
    crisisRingSegments: 36,
    dpr: [1, 1],
    extraLights: true,
    flowParticleScale: 0.78,
    heatSparkScale: 0.75,
    lightScale: 0.72,
    postprocessing: true,
    pylonDensity: 0.72,
    pylonInsulators: true,
    pylonShadows: false,
    shadowMode: false,
    weatherEffects: true,
  },
  high: {
    antialias: true,
    bloomIntensity: 0.9,
    crisisRingSegments: 44,
    dpr: [1, 1.7],
    extraLights: true,
    flowParticleScale: 1.1,
    heatSparkScale: 1,
    lightScale: 1,
    postprocessing: true,
    pylonDensity: 1,
    pylonInsulators: true,
    pylonShadows: true,
    shadowMode: "percentage",
    weatherEffects: true,
  },
};

export function getSceneRenderQualityProfile(quality: RenderQuality): SceneRenderQualityProfile {
  return QUALITY_PROFILES[quality];
}

export function scaleEffectCount(baseCount: number, scale: number): number {
  const normalizedBase = Math.max(0, Math.floor(baseCount));
  if (normalizedBase === 0 || scale <= 0) return 0;
  return Math.max(1, Math.round(normalizedBase * scale));
}

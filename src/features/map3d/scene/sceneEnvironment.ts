import type { MapDefinition } from "@/game/domain/mapDefinition";

export type ScenePhase = "expo" | "day" | "dusk" | "night" | "storm";

export interface SceneEnvironmentInput {
  map?: Pick<MapDefinition, "cameraPreset" | "environment">;
  minute: number;
  startMinute: number;
  endMinute: number;
  solarDrop: boolean;
}

export interface SceneEnvironment {
  phase: ScenePhase;
  skyColor: string;
  keyLight: string;
  ambientIntensity: number;
  hemiIntensity: number;
  keyIntensity: number;
  fogNear: number;
  fogFar: number;
  horizonColor: string;
  horizonOpacity: number;
  rain: boolean;
}

function missionProgress(input: SceneEnvironmentInput) {
  return Math.max(0, Math.min(1, (input.minute - input.startMinute) / Math.max(1, input.endMinute - input.startMinute)));
}

export function getSceneEnvironment(input: SceneEnvironmentInput): SceneEnvironment {
  const progress = missionProgress(input);
  const storm = input.solarDrop || input.map?.environment === "storm";
  const close = input.map?.cameraPreset === "close";

  if (input.map?.environment === "expo-floor") {
    return {
      phase: "expo",
      skyColor: "#030a10",
      keyLight: "#ffffff",
      ambientIntensity: 0.62,
      hemiIntensity: 0.54,
      keyIntensity: 1.45,
      fogNear: 10,
      fogFar: close ? 18 : 22,
      horizonColor: "#22d3ee",
      horizonOpacity: 0.08,
      rain: false,
    };
  }

  if (storm) {
    return {
      phase: "storm",
      skyColor: "#02070c",
      keyLight: "#9fb7c8",
      ambientIntensity: 0.36,
      hemiIntensity: 0.34,
      keyIntensity: 0.92,
      fogNear: 7.5,
      fogFar: close ? 16 : 21,
      horizonColor: "#7dd3fc",
      horizonOpacity: 0.14,
      rain: input.map?.environment === "storm",
    };
  }

  if (input.map?.environment === "island-dusk" || progress >= 0.68) {
    return {
      phase: progress >= 0.88 ? "night" : "dusk",
      skyColor: progress >= 0.88 ? "#020812" : "#06121a",
      keyLight: progress >= 0.88 ? "#7dd3fc" : "#ffd08a",
      ambientIntensity: progress >= 0.88 ? 0.44 : 0.5,
      hemiIntensity: progress >= 0.88 ? 0.4 : 0.46,
      keyIntensity: progress >= 0.88 ? 1.05 : 1.24,
      fogNear: 10,
      fogFar: close ? 18 : 25,
      horizonColor: progress >= 0.88 ? "#22d3ee" : "#ffb45f",
      horizonOpacity: progress >= 0.88 ? 0.12 : 0.2,
      rain: false,
    };
  }

  return {
    phase: "day",
    skyColor: "#030a10",
    keyLight: "#ffffff",
    ambientIntensity: 0.55,
    hemiIntensity: 0.5,
    keyIntensity: 1.5,
    fogNear: 11,
    fogFar: close ? 18 : 26,
    horizonColor: "#34f5b0",
    horizonOpacity: 0.08,
    rain: false,
  };
}

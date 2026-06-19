export type MapTerrainKind = "france" | "microgrid" | "island" | "regional" | "europe";

export interface MapDefinition {
  id: string;
  name: string;
  terrain: MapTerrainKind;
  description: string;
  nodeIds?: string[];
  lineIds?: string[];
  cameraPreset: "national" | "regional" | "close" | "europe";
  modelScale: number;
  environment: "command-night" | "expo-floor" | "island-dusk" | "storm";
  availableLayers: Array<"grid" | "ai" | "carbon">;
}

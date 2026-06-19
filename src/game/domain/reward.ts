export type MissionMedal = "none" | "bronze" | "silver" | "gold";

export interface MissionReward {
  id: string;
  label: string;
  kind: "mission" | "tool" | "map" | "mode";
}

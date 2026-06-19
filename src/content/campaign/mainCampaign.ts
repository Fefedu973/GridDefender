import type { CampaignDefinition } from "@/game/domain/campaignDefinition";
import { missionRegistry } from "@/content/missions/missionRegistry";

export const mainCampaign: CampaignDefinition = {
  id: "main-campaign",
  title: "Grid Defender Hackathon",
  missionIds: missionRegistry.map((mission) => mission.id),
};

import assert from "node:assert/strict";
import test from "node:test";
import { getCampaignMap } from "@/content/campaign/campaignMap";
import { missionRegistry } from "@/content/missions/missionRegistry";
import type { CampaignProgress } from "@/game/progression/campaignProgress";

test("campaign map exposes ordered mission nodes and route edges", () => {
  const map = getCampaignMap(missionRegistry, { missions: {}, unlockedRewards: [] });

  assert.equal(map.nodes.length, missionRegistry.length);
  assert.equal(map.edges.length, missionRegistry.length - 1);
  assert.equal(map.nodes[0].id, "tutorial-microgrid");
  assert.equal(map.nodes.at(-1)?.id, "europe-2030");
  assert.ok(map.nodes[0].z > 0);
  assert.deepEqual(map.edges.at(-1), {
    fromId: "black-grid",
    toId: "europe-2030",
    unlocked: false,
  });
});

test("campaign map reflects completed medals and unlocks the finale after Black Grid", () => {
  const progress: CampaignProgress = {
    unlockedRewards: [],
    missions: {
      "tutorial-microgrid": { bestMedal: "silver", bestScore: 700 },
      "paris-peak": { bestMedal: "bronze", bestScore: 620 },
      "corsica-islanding": { bestMedal: "bronze", bestScore: 610 },
      "atlantic-storm": { bestMedal: "bronze", bestScore: 640 },
      "rhone-corridor": { bestMedal: "bronze", bestScore: 645 },
      "sovereign-ai": { bestMedal: "bronze", bestScore: 650 },
      "black-grid": { bestMedal: "bronze", bestScore: 660 },
    },
  };

  const map = getCampaignMap(missionRegistry, progress);
  const tutorial = map.nodes.find((node) => node.id === "tutorial-microgrid");
  const finale = map.nodes.find((node) => node.id === "europe-2030");

  assert.equal(tutorial?.status, "completed");
  assert.equal(tutorial?.medal, "silver");
  assert.equal(finale?.status, "available");
  assert.ok((tutorial?.z ?? 0) > (finale?.z ?? 0) - 20);
  assert.equal(map.edges.at(-1)?.unlocked, true);
});

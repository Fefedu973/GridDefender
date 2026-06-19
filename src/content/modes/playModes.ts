export interface PlayModeDefinition {
  id: string;
  label: string;
  description: string;
  unlockRewardId?: string;
  status: "available" | "locked" | "prototype";
}

export const playModes: PlayModeDefinition[] = [
  {
    id: "campaign",
    label: "Campagne",
    description: "Missions scénarisées avec mécanique nouvelle à chaque niveau.",
    status: "available",
  },
  {
    id: "crisis-run",
    label: "Crisis Run",
    description: "Trois vagues semi-aléatoires et choix de doctrine entre les vagues.",
    unlockRewardId: "mode-crisis-run",
    status: "available",
  },
  {
    id: "daily-challenge",
    label: "Défi quotidien",
    description: "Seed commune, leaderboard comparable et mêmes incidents pour tous.",
    unlockRewardId: "mode-daily-challenge",
    status: "available",
  },
  {
    id: "sandbox",
    label: "Sandbox",
    description: "Choix carte, heure, météo, demande, pannes et difficulté.",
    status: "available",
  },
  {
    id: "scenario-builder",
    label: "Scenario Builder",
    description: "Assembler rapidement une mission en données sans toucher au moteur.",
    status: "available",
  },
];

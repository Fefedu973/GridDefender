import type { ActionDefinition } from "@/game/types";

export const actionDefinitions: ActionDefinition[] = [
  {
    type: "smart_ev",
    label: "Recharge EV intelligente",
    shortLabel: "EV smart",
    target: "Bornes EV",
    description: "Lisse la recharge des vehicules pendant 60 minutes.",
    expectedImpact: "Baisse le pic immediat, avec une legere friction publique.",
  },
  {
    type: "defer_ai",
    label: "Decaler job IA",
    shortLabel: "Decaler IA",
    target: "Job IA flexible",
    description: "Reporte le job IA flexible le plus lourd hors du pic.",
    expectedImpact: "Reduit la demande sans couper les services critiques.",
  },
  {
    type: "reduce_model",
    label: "Reduire modele IA",
    shortLabel: "Modele -",
    target: "Job IA actif",
    description: "Passe un job non critique sur un modele plus leger.",
    expectedImpact: "Baisse la puissance et le cout, avec une petite perte de qualite.",
  },
  {
    type: "activate_cache",
    label: "Activer cache IA",
    shortLabel: "Cache IA",
    target: "Datacenter IA",
    description: "Supprime une partie des appels redondants.",
    expectedImpact: "Tres efficace sur les assistants et agents repetitifs.",
  },
  {
    type: "agent_timeout",
    label: "Timeout agent",
    shortLabel: "Timeout",
    target: "Agent IA",
    description: "Stoppe les boucles d'iterations sans valeur.",
    expectedImpact: "Coupe le gaspillage sans toucher aux jobs critiques.",
  },
  {
    type: "discharge_battery",
    label: "Decharger batterie",
    shortLabel: "Batterie",
    target: "Batteries reseau",
    description: "Injecte de la puissance stockee pendant 20 minutes.",
    expectedImpact: "Remonte vite la stabilite mais consomme la reserve.",
  },
  {
    type: "import_energy",
    label: "Importer energie",
    shortLabel: "Import",
    target: "Interconnexion",
    description: "Achete de l'energie externe pendant 30 minutes.",
    expectedImpact: "Securise le reseau, mais penalise cout et souverainete.",
  },
  {
    type: "thermal_backup",
    label: "Thermique secours",
    shortLabel: "Thermique",
    target: "Centrale secours",
    description: "Lance une production pilotable fortement carbonee.",
    expectedImpact: "Solution de dernier recours, tres efficace mais tres penalisee.",
  },
];

export function getActionDefinition(type: ActionDefinition["type"]) {
  return actionDefinitions.find((action) => action.type === type);
}

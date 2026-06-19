import type { AssistantMessage, GameState, PlayerActionType } from "@/game/types";

interface Recommendation {
  title: string;
  body: string;
  tone: AssistantMessage["tone"];
  suggestedAction?: PlayerActionType;
}

function hasActiveEffect(state: GameState, action: PlayerActionType) {
  return state.activeEffects.some(
    (effect) => effect.action === action && effect.expiresAt >= state.minute,
  );
}

function hasFlexibleAiLoad(state: GameState) {
  return state.aiJobs.some(
    (job) =>
      (job.status === "active" || job.status === "throttled" || job.status === "queued") &&
      job.criticality !== "critical" &&
      job.basePowerMw >= 12,
  );
}

export function getAdvisorRecommendation(state: GameState): Recommendation {
  const loopingAgent = state.flags.agentLoop
    ? state.aiJobs.find((job) => job.id === "looping-agent" && !job.timeoutApplied)
    : undefined;

  if (loopingAgent) {
    return {
      title: "Agent IA en boucle",
      body:
        "Energy SOC détecte une consommation IA sans valeur utile. Appliquer un timeout réduira la charge sans pénaliser le job cyber.",
      tone: "critical",
      suggestedAction: "agent_timeout",
    };
  }

  if (state.metrics.stability < 35 && state.metrics.batteryLevel > 18) {
    return {
      title: "Réserve réseau critique",
      body:
        "La marge est trop faible. Décharger les batteries est l'action la plus rapide avant d'utiliser l'import ou le thermique.",
      tone: "critical",
      suggestedAction: "discharge_battery",
    };
  }

  if (state.metrics.stability < 45 && hasFlexibleAiLoad(state)) {
    return {
      title: "Décaler la charge flexible",
      body:
        "La tension vient d'un cumul pic réseau et jobs IA non critiques. Reporter le job flexible préserve l'IA utile tout en libérant de la puissance.",
      tone: "critical",
      suggestedAction: "defer_ai",
    };
  }

  if (state.flags.evSurge && !hasActiveEffect(state, "smart_ev")) {
    return {
      title: "Pic EV anticipé",
      body:
        "La recharge des véhicules arrive avant le pic résidentiel. Le lissage EV réduira la pointe sans couper les usages essentiels.",
      tone: "warning",
      suggestedAction: "smart_ev",
    };
  }

  if (
    state.metrics.reserveMw < -8 &&
    state.metrics.batteryLevel > 24 &&
    !hasActiveEffect(state, "discharge_battery")
  ) {
    return {
      title: "Utiliser le stockage",
      body:
        "Le déficit reste gérable. Une décharge courte des batteries peut passer le creux sans dégrader le CO₂.",
      tone: "warning",
      suggestedAction: "discharge_battery",
    };
  }

  const heavyActiveJob = state.aiJobs.find(
    (job) =>
      (job.status === "active" || job.status === "throttled") &&
      job.criticality !== "critical" &&
      job.modelScale === 1 &&
      job.currentPowerMw >= 12,
  );

  if (heavyActiveJob) {
    return {
      title: "Modèle IA surdimensionné",
      body:
        "Un job non critique peut passer sur un modèle plus léger. L'impact qualité est limité et la puissance baisse immédiatement.",
      tone: "warning",
      suggestedAction: "reduce_model",
    };
  }

  const redundantJob = state.aiJobs.find(
    (job) => !job.cached && job.redundantCalls > 20 && job.status !== "completed",
  );

  if (redundantJob) {
    return {
      title: "Requêtes redondantes",
      body:
        "Le cache IA peut éviter des appels répétés. C'est une optimisation peu risquée pour stabiliser la demande numérique.",
      tone: "info",
      suggestedAction: "activate_cache",
    };
  }

  if (state.metrics.stability < 24 && !hasActiveEffect(state, "import_energy")) {
    return {
      title: "Sécuriser avant blackout",
      body:
        "Si la batterie ne suffit plus, l'import est préférable au thermique pour éviter un blackout tout en limitant le CO₂.",
      tone: "critical",
      suggestedAction: "import_energy",
    };
  }

  return {
    title: "Réseau sous contrôle",
    body:
      "La stratégie tient. Gardez les jobs critiques souverains, chargez les usages flexibles hors pic et conservez une marge batterie.",
    tone: "info",
  };
}

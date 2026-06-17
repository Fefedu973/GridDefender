import type { AssistantMessage, GameState, PlayerActionType } from "@/game/types";

interface Recommendation {
  title: string;
  body: string;
  tone: AssistantMessage["tone"];
  suggestedAction?: PlayerActionType;
}

function hasActiveEffect(state: GameState, action: PlayerActionType) {
  return state.activeEffects.some(
    (effect) => effect.action === action && effect.expiresAt > state.minute,
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
        "Energy SOC detecte une consommation IA sans valeur utile. Appliquer un timeout reduira la charge sans penaliser le job cyber.",
      tone: "critical",
      suggestedAction: "agent_timeout",
    };
  }

  if (state.metrics.stability < 35 && state.metrics.batteryLevel > 18) {
    return {
      title: "Reserve reseau critique",
      body:
        "La marge est trop faible. Decharger les batteries est l'action la plus rapide avant d'utiliser l'import ou le thermique.",
      tone: "critical",
      suggestedAction: "discharge_battery",
    };
  }

  if (state.metrics.stability < 45 && hasFlexibleAiLoad(state)) {
    return {
      title: "Decaler la charge flexible",
      body:
        "La tension vient d'un cumul pic reseau et jobs IA non critiques. Reporter le job flexible preserve l'IA utile tout en liberant de la puissance.",
      tone: "critical",
      suggestedAction: "defer_ai",
    };
  }

  if (state.flags.evSurge && !hasActiveEffect(state, "smart_ev")) {
    return {
      title: "Pic EV anticipe",
      body:
        "La recharge des vehicules arrive avant le pic residentiel. Le lissage EV reduira la pointe sans couper les usages essentiels.",
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
        "Le deficit reste gerable. Une decharge courte des batteries peut passer le creux sans degrader le CO2.",
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
      title: "Modele IA surdimensionne",
      body:
        "Un job non critique peut passer sur un modele plus leger. L'impact qualite est limite et la puissance baisse immediatement.",
      tone: "warning",
      suggestedAction: "reduce_model",
    };
  }

  const redundantJob = state.aiJobs.find(
    (job) => !job.cached && job.redundantCalls > 20 && job.status !== "completed",
  );

  if (redundantJob) {
    return {
      title: "Requetes redondantes",
      body:
        "Le cache IA peut eviter des appels repetes. C'est une optimisation peu risquee pour stabiliser la demande numerique.",
      tone: "info",
      suggestedAction: "activate_cache",
    };
  }

  if (state.metrics.stability < 24 && !hasActiveEffect(state, "import_energy")) {
    return {
      title: "Securiser avant blackout",
      body:
        "Si la batterie ne suffit plus, l'import est preferable au thermique pour eviter un blackout tout en limitant le CO2.",
      tone: "critical",
      suggestedAction: "import_energy",
    };
  }

  return {
    title: "Reseau sous controle",
    body:
      "La strategie tient. Gardez les jobs critiques souverains, chargez les usages flexibles hors pic et conservez une marge batterie.",
    tone: "info",
  };
}

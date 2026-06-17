import { getActionDefinition } from "@/game/actions";
import { getAdvisorRecommendation } from "@/game/advisor/rules";
import type {
  ActionRecord,
  ActiveEffect,
  ActiveIncident,
  AIJob,
  AssistantMessage,
  EnergyAsset,
  GameMetrics,
  GameState,
  PlayerActionType,
  Scenario,
  TimelineSnapshot,
} from "@/game/types";
import { formatClock } from "@/lib/format";
import { clamp, rangeRatio, round } from "@/lib/math";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function makeId(prefix: string, state: GameState) {
  return `${prefix}-${state.minute}-${state.tick}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function timelinePoint(state: GameState, metrics = state.metrics): TimelineSnapshot {
  return {
    minute: state.minute,
    label: formatClock(state.minute),
    productionMw: round(metrics.productionMw),
    demandMw: round(metrics.demandMw),
    stability: round(metrics.stability),
    batteryLevel: round(metrics.batteryLevel),
    aiLoadMw: round(metrics.aiLoadMw),
    carbon: round(metrics.carbon),
    score: round(metrics.score),
  };
}

function addAssistantMessage(
  state: GameState,
  message: Omit<AssistantMessage, "id" | "minute">,
) {
  state.assistantMessages.unshift({
    id: makeId("athena", state),
    minute: state.minute,
    ...message,
  });
  state.assistantMessages = state.assistantMessages.slice(0, 16);
}

function addActionRecord(
  state: GameState,
  record: Omit<ActionRecord, "id" | "minute">,
) {
  state.actionHistory.unshift({
    id: makeId("action", state),
    minute: state.minute,
    ...record,
  });
  state.actionHistory = state.actionHistory.slice(0, 18);
}

function openIncident(
  state: GameState,
  incident: Omit<ActiveIncident, "openedAt">,
) {
  const existing = state.incidents.find((item) => item.id === incident.id);
  if (existing) {
    existing.resolvedAt = undefined;
    return;
  }

  state.incidents.unshift({
    ...incident,
    openedAt: state.minute,
  });
}

function resolveIncident(state: GameState, id: string) {
  const incident = state.incidents.find((item) => item.id === id && !item.resolvedAt);
  if (incident) {
    incident.resolvedAt = state.minute;
  }
}

function upsertEffect(state: GameState, effect: Omit<ActiveEffect, "id" | "startedAt">) {
  state.activeEffects = state.activeEffects.filter((item) => item.action !== effect.action);
  state.activeEffects.push({
    id: makeId("effect", state),
    startedAt: state.minute,
    ...effect,
  });
}

function getEffectMagnitude(state: GameState, action: PlayerActionType) {
  return state.activeEffects
    .filter((effect) => effect.action === action && effect.expiresAt > state.minute)
    .reduce((total, effect) => total + effect.magnitude, 0);
}

function activeOrThrottled(job: AIJob) {
  return job.status === "active" || job.status === "throttled";
}

function computeAiJobPower(state: GameState, job: AIJob) {
  if (!activeOrThrottled(job)) return 0;

  const cacheFactor = job.cached ? 0.82 : 1;
  const throttleFactor = job.status === "throttled" ? 0.82 : 1;
  const loopFactor =
    job.id === "looping-agent" && state.flags.agentLoop && !job.timeoutApplied ? 2.45 : 1;
  const timeoutFactor = job.timeoutApplied ? 0.42 : 1;

  return round(job.basePowerMw * job.modelScale * cacheFactor * throttleFactor * loopFactor * timeoutFactor, 1);
}

function maybeActivateJob(state: GameState, job: AIJob) {
  if (job.status !== "queued" && job.status !== "deferred") return;
  if (state.minute < job.startMinute) return;
  if (job.deferredUntil && state.minute < job.deferredUntil) return;

  job.status = "active";
  job.currentPowerMw = computeAiJobPower(state, job);
}

function updateAiJobs(state: GameState) {
  for (const job of state.aiJobs) {
    maybeActivateJob(state, job);

    if (activeOrThrottled(job)) {
      job.currentPowerMw = computeAiJobPower(state, job);

      const baseGain = job.kind === "video" ? 7 : job.kind === "cyber" ? 10 : 8;
      const cacheGain = job.cached ? 1.08 : 1;
      const throttleGain = job.status === "throttled" ? 0.82 : 1;
      const loopPenalty =
        job.id === "looping-agent" && state.flags.agentLoop && !job.timeoutApplied ? 0.12 : 1;
      const gain = baseGain * cacheGain * throttleGain * loopPenalty;

      job.progress = clamp(job.progress + gain, 0, 100);

      if (job.progress >= 100) {
        job.status = "completed";
        job.currentPowerMw = 0;

        if (job.id === "cyber-critical") {
          resolveIncident(state, "cyber-job");
        }
      }

      if (state.minute > job.deadlineMinute && job.progress < 100) {
        if (job.criticality === "critical") {
          job.status = "failed";
          job.currentPowerMw = 0;
          openIncident(state, {
            id: "critical-job-failed",
            title: "Job critique echoue",
            description: "La detection cyber n'a pas ete traitee avant sa deadline.",
            severity: "critical",
            source: "ai",
          });
        } else if (job.status !== "deferred") {
          job.status = "failed";
          job.currentPowerMw = 0;
        }
      }
    } else {
      job.currentPowerMw = 0;
    }
  }
}

function processScenarioEvents(state: GameState) {
  for (const event of state.scenario.events) {
    if (state.triggeredEventIds.includes(event.id) || event.minute > state.minute) continue;

    state.triggeredEventIds.push(event.id);

    if (event.id === "ev-surge") {
      state.flags.evSurge = true;
      openIncident(state, {
        id: event.id,
        title: event.title,
        description: event.description,
        severity: event.severity,
        source: "grid",
      });
    }

    if (event.id === "video-job") {
      const videoJob = state.aiJobs.find((job) => job.id === "video-demo");
      if (videoJob && videoJob.status !== "deferred") {
        videoJob.status = "active";
      }
      openIncident(state, {
        id: event.id,
        title: event.title,
        description: event.description,
        severity: event.severity,
        source: "ai",
      });
    }

    if (event.id === "solar-drop") {
      state.flags.solarDrop = true;
      state.flags.residentialPeak = true;
      openIncident(state, {
        id: event.id,
        title: event.title,
        description: event.description,
        severity: event.severity,
        source: "weather",
      });
    }

    if (event.id === "cyber-job") {
      state.flags.cyberPriority = true;
      const cyberJob = state.aiJobs.find((job) => job.id === "cyber-critical");
      if (cyberJob) cyberJob.status = "active";
      openIncident(state, {
        id: event.id,
        title: event.title,
        description: event.description,
        severity: event.severity,
        source: "ai",
      });
    }

    if (event.id === "agent-loop") {
      state.flags.agentLoop = true;
      const loopJob = state.aiJobs.find((job) => job.id === "looping-agent");
      if (loopJob && !loopJob.timeoutApplied) loopJob.status = "active";
      openIncident(state, {
        id: event.id,
        title: event.title,
        description: event.description,
        severity: event.severity,
        source: "ai",
      });
    }

    addAssistantMessage(state, {
      title: event.title,
      body: event.description,
      tone: event.severity,
    });
  }
}

function computeProduction(state: GameState) {
  const elapsed = state.minute - state.scenario.startMinute;
  const missionDuration = state.scenario.endMinute - state.scenario.startMinute;
  const solarRatio = clamp(1 - elapsed / missionDuration, 0, 1);
  const solarDropFactor = state.flags.solarDrop ? 0.42 : 1;
  const nuclear = 92;
  const solar = round(30 * solarRatio * solarDropFactor, 1);
  const wind = round(18 + Math.sin(elapsed / 18) * 4 - (state.flags.solarDrop ? 2 : 0), 1);
  const hydro = state.metrics.stability < 42 ? 24 : 18;
  const battery = getEffectMagnitude(state, "discharge_battery");
  const imported = getEffectMagnitude(state, "import_energy");
  const thermal = getEffectMagnitude(state, "thermal_backup");

  return {
    nuclear,
    solar: Math.max(0, solar),
    wind: Math.max(8, wind),
    hydro,
    battery,
    imported,
    thermal,
    total: nuclear + Math.max(0, solar) + Math.max(8, wind) + hydro + battery + imported + thermal,
  };
}

function computeDemand(state: GameState) {
  const progression = rangeRatio(
    state.minute,
    state.scenario.startMinute,
    state.scenario.endMinute,
  );
  const residential =
    42 + progression * 18 + (state.flags.residentialPeak ? 10 : 0);
  const industry = 42;
  const hospital = 24;
  const event = 16 + (state.flags.cyberPriority ? 2 : 0);
  const evSmartReduction = getEffectMagnitude(state, "smart_ev");
  const ev =
    18 +
    (state.flags.evSurge ? 22 : 0) +
    (state.minute >= 18 * 60 + 35 ? 8 : 0) -
    evSmartReduction;
  const ai = state.aiJobs.reduce((total, job) => total + job.currentPowerMw, 0);

  return {
    residential: round(residential, 1),
    industry,
    hospital,
    event,
    ev: Math.max(8, round(ev, 1)),
    ai: round(ai, 1),
    total: round(residential + industry + hospital + event + Math.max(8, ev) + ai, 1),
  };
}

function updateAssetPowers(
  assets: EnergyAsset[],
  production: ReturnType<typeof computeProduction>,
  demand: ReturnType<typeof computeDemand>,
  metrics: GameMetrics,
) {
  const powerById: Record<string, number> = {
    nuclear: production.nuclear,
    solar: production.solar,
    wind: production.wind,
    hydro: production.hydro,
    battery: production.battery,
    datacenter: demand.ai,
    hospital: demand.hospital,
    residential: demand.residential,
    industry: demand.industry,
    ev: demand.ev,
    vivatech: demand.event,
  };

  return assets.map((asset) => {
    const powerMw = round(powerById[asset.id] ?? asset.powerMw, 1);
    let status = asset.status;

    if (asset.id === "battery") {
      status = metrics.batteryLevel < 20 ? "critical" : metrics.batteryLevel < 38 ? "watch" : "stable";
    } else if (asset.kind === "load" || asset.kind === "datacenter") {
      const loadRatio = asset.maxPowerMw > 0 ? powerMw / asset.maxPowerMw : 0;
      status = loadRatio > 0.9 || metrics.stability < 35 ? "critical" : loadRatio > 0.72 ? "watch" : "stable";
    } else if (asset.id === "solar" && production.solar < 8) {
      status = "critical";
    } else {
      status = metrics.reserveMw < -18 ? "watch" : "stable";
    }

    return {
      ...asset,
      powerMw,
      status,
    };
  });
}

function computeAiProductivity(state: GameState) {
  const weightedValue = state.aiJobs.reduce((total, job) => {
    const criticalBoost = job.criticality === "critical" ? 1.5 : job.criticality === "high" ? 1.2 : 1;
    const failedPenalty = job.status === "failed" ? -job.value * 1.1 : 0;
    return total + (job.progress / 100) * job.value * criticalBoost + failedPenalty;
  }, 0);

  return clamp(48 + weightedValue, 0, 100);
}

function computeMetrics(state: GameState): GameMetrics {
  const production = computeProduction(state);
  const demand = computeDemand(state);
  const previous = state.metrics;
  const reserveMw = round(production.total - demand.total, 1);
  const unresolvedCritical = state.incidents.filter(
    (incident) => !incident.resolvedAt && incident.severity === "critical",
  ).length;
  const unresolvedWarnings = state.incidents.filter(
    (incident) => !incident.resolvedAt && incident.severity === "warning",
  ).length;

  const reserveDelta =
    reserveMw >= 0 ? Math.min(1.6, reserveMw / 18) : Math.max(-4.8, reserveMw / 9);
  const incidentPenalty = unresolvedCritical * 0.55 + unresolvedWarnings * 0.2;
  const stability = clamp(previous.stability + reserveDelta - incidentPenalty);

  const batteryDispatch = production.battery;
  const batteryRecharge =
    reserveMw > 22 && batteryDispatch === 0 && state.minute < 18 * 60 + 40 ? 1.2 : 0;
  const batteryLevel = clamp(
    previous.batteryLevel - batteryDispatch * 0.12 + batteryRecharge,
  );

  const carbon = clamp(
    previous.carbon +
      (production.thermal > 0 ? -3.4 : 0.14) +
      (production.imported > 0 ? -1.1 : 0.08) +
      (production.solar + production.wind > 32 ? 0.16 : -0.08),
  );

  const cost = clamp(
    previous.cost -
      (production.imported > 0 ? 1.25 : 0) -
      (production.thermal > 0 ? 2.2 : 0) -
      (reserveMw < -15 ? 0.35 : 0) +
      (reserveMw > 8 ? 0.08 : 0),
  );

  const sovereignty = clamp(
    previous.sovereignty - (production.imported > 0 ? 1.4 : 0) + 0.04,
  );

  const publicSatisfaction = clamp(
    previous.publicSatisfaction -
      (stability < 45 ? 0.8 : 0) -
      (stability < 25 ? 2.4 : 0) -
      (getEffectMagnitude(state, "smart_ev") > 0 ? 0.22 : 0) +
      (stability > 65 ? 0.08 : 0),
  );

  const cyberFailed = state.aiJobs.some(
    (job) => job.id === "cyber-critical" && job.status === "failed",
  );
  const criticalContinuity = clamp(
    previous.criticalContinuity -
      (stability < 22 ? 6 : 0) -
      (cyberFailed ? 18 : 0) +
      (stability > 55 ? 0.08 : 0),
  );

  const aiProductivity = computeAiProductivity(state);
  const co2Intensity = round(
    38 +
      production.thermal * 6.8 +
      production.imported * 2.2 -
      (production.solar + production.wind) * 0.35,
    1,
  );

  const score = clamp(
    stability * 2.2 +
      carbon * 1.35 +
      cost * 1.05 +
      sovereignty * 1.15 +
      aiProductivity * 1.55 +
      publicSatisfaction +
      criticalContinuity * 1.75,
    0,
    1000,
  );

  return {
    stability: round(stability, 1),
    carbon: round(carbon, 1),
    cost: round(cost, 1),
    sovereignty: round(sovereignty, 1),
    aiProductivity: round(aiProductivity, 1),
    publicSatisfaction: round(publicSatisfaction, 1),
    criticalContinuity: round(criticalContinuity, 1),
    batteryLevel: round(batteryLevel, 1),
    productionMw: round(production.total, 1),
    demandMw: round(demand.total, 1),
    aiLoadMw: round(demand.ai, 1),
    reserveMw,
    co2Intensity,
    score: round(score),
  };
}

function recomputeState(state: GameState) {
  const metrics = computeMetrics(state);
  const production = computeProduction(state);
  const demand = computeDemand(state);
  state.metrics = metrics;
  state.assets = updateAssetPowers(state.assets, production, demand, metrics);
  state.timeline = [...state.timeline, timelinePoint(state, metrics)].slice(-56);
}

function resolveIncidentsFromState(state: GameState) {
  if (getEffectMagnitude(state, "smart_ev") > 0) resolveIncident(state, "ev-surge");

  const videoJob = state.aiJobs.find((job) => job.id === "video-demo");
  if (videoJob && (videoJob.status === "deferred" || videoJob.status === "completed")) {
    resolveIncident(state, "video-job");
  }

  if (state.metrics.stability > 54 && state.flags.solarDrop) {
    resolveIncident(state, "solar-drop");
  }

  if (!state.flags.agentLoop) resolveIncident(state, "agent-loop");
}

function applyOutcome(state: GameState) {
  if (state.minute < state.scenario.endMinute && state.metrics.stability > 0) {
    if (state.metrics.criticalContinuity > 20) return;
  }

  const failure =
    state.metrics.stability <= 0 ||
    state.metrics.criticalContinuity <= 20 ||
    state.aiJobs.some((job) => job.id === "cyber-critical" && job.status === "failed");

  if (state.minute >= state.scenario.endMinute || failure) {
    const victory =
      !failure &&
      state.metrics.stability >= 45 &&
      state.metrics.criticalContinuity >= 75;
    const score = state.metrics.score;
    const badge =
      score >= 850
        ? "Orchestrateur IA-Energie"
        : score >= 720
          ? "Defense reseau fiable"
          : score >= 560
            ? "Operateur sous tension"
            : "Blackout evite de justesse";

    state.phase = "ended";
    state.outcome = {
      result: victory ? "victory" : "failure",
      score,
      badge: failure ? "Mission compromise" : badge,
      summary: victory
        ? "Vous avez conserve les services critiques tout en pilotant les charges IA flexibles."
        : "La mission montre le risque d'une orchestration trop tardive des pics et des jobs critiques.",
    };

    addAssistantMessage(state, {
      title: victory ? "Mission terminee" : "Mission compromise",
      body: state.outcome.summary,
      tone: victory ? "info" : "critical",
    });
  }
}

function maybeAddAdvisorMessage(state: GameState) {
  const last = state.assistantMessages[0];
  const recommendation = getAdvisorRecommendation(state);
  const urgent = recommendation.tone === "critical";
  const enoughTimePassed = !last || state.minute - last.minute >= 15;

  if ((urgent || enoughTimePassed) && last?.title !== recommendation.title) {
    addAssistantMessage(state, recommendation);
  }
}

export function createInitialGameState(scenario: Scenario): GameState {
  const scenarioCopy = clone(scenario);
  const state: GameState = {
    scenario: scenarioCopy,
    phase: "ready",
    minute: scenarioCopy.startMinute,
    tick: 0,
    triggeredEventIds: [],
    flags: {
      evSurge: false,
      solarDrop: false,
      residentialPeak: false,
      cyberPriority: false,
      agentLoop: false,
    },
    metrics: clone(scenarioCopy.initialMetrics),
    assets: clone(scenarioCopy.assets),
    aiJobs: clone(scenarioCopy.aiJobs),
    activeEffects: [],
    incidents: [],
    actionHistory: [],
    assistantMessages: [],
    timeline: [],
  };

  state.timeline = [timelinePoint(state)];
  addAssistantMessage(state, {
    title: "ATHENA Grid en ligne",
    body:
      "Mission: passer le pic du soir sans couper les usages critiques. L'IA utile doit rester disponible, les charges flexibles doivent etre orchestrees.",
    tone: "info",
  });

  return state;
}

export function advanceSimulation(currentState: GameState): GameState {
  if (currentState.phase === "ended") return currentState;

  const state = clone(currentState);
  state.phase = "running";
  state.tick += 1;
  state.minute = Math.min(
    state.minute + state.scenario.tickMinutes,
    state.scenario.endMinute,
  );
  state.activeEffects = state.activeEffects.filter((effect) => effect.expiresAt > state.minute);

  processScenarioEvents(state);
  updateAiJobs(state);
  recomputeState(state);
  resolveIncidentsFromState(state);
  maybeAddAdvisorMessage(state);
  applyOutcome(state);

  return state;
}

export function applyPlayerAction(
  currentState: GameState,
  actionType: PlayerActionType,
): GameState {
  if (currentState.phase === "ended") return currentState;

  const state = clone(currentState);
  const definition = getActionDefinition(actionType);
  const label = definition?.label ?? actionType;
  let result = "";
  let impact: ActionRecord["impact"] = "positive";
  let assistant: Omit<AssistantMessage, "id" | "minute"> | undefined;

  if (actionType === "smart_ev") {
    upsertEffect(state, {
      label,
      action: actionType,
      expiresAt: state.minute + 60,
      magnitude: 22,
    });
    result = "Recharge lissee pendant une heure.";
    assistant = {
      title: "Recharge EV lissee",
      body:
        "Le pic de recharge baisse. Certains vehicules finiront plus tard, mais le reseau respire.",
      tone: "info",
    };
  }

  if (actionType === "defer_ai") {
    const target = [...state.aiJobs]
      .filter(
        (job) =>
          job.criticality !== "critical" &&
          job.status !== "completed" &&
          job.status !== "failed" &&
          job.deadlineMinute - state.minute >= 25,
      )
      .sort((a, b) => b.basePowerMw - a.basePowerMw)[0];

    if (target) {
      const job = state.aiJobs.find((item) => item.id === target.id);
      if (job) {
        job.status = "deferred";
        job.currentPowerMw = 0;
        job.deferredUntil = state.minute + 45;
        result = `${job.name} reporte hors pointe.`;
        assistant = {
          title: "Charge IA reportee",
          body:
            "Le job flexible est sorti du pic. La productivite est preservee si la deadline reste respectee.",
          tone: "info",
        };
      }
    } else {
      impact = "mixed";
      result = "Aucun job flexible reportable maintenant.";
      assistant = {
        title: "Pas de job reportable",
        body:
          "Les charges restantes sont soit critiques, soit trop proches de leur deadline. Cherchez plutot batterie, cache ou import.",
        tone: "warning",
      };
    }
  }

  if (actionType === "reduce_model") {
    const target = [...state.aiJobs]
      .filter(
        (job) =>
          activeOrThrottled(job) &&
          job.criticality !== "critical" &&
          job.modelScale > 0.55,
      )
      .sort((a, b) => b.currentPowerMw - a.currentPowerMw)[0];

    if (target) {
      const job = state.aiJobs.find((item) => item.id === target.id);
      if (job) {
        job.modelScale = job.modelScale === 1 ? 0.75 : 0.55;
        job.status = "throttled";
        job.currentPowerMw = computeAiJobPower(state, job);
        result = `${job.name} passe sur un modele plus leger.`;
        assistant = {
          title: "Modele optimise",
          body:
            "La consommation IA baisse avec une perte de qualite acceptable pour une charge non critique.",
          tone: "info",
        };
      }
    } else {
      impact = "mixed";
      result = "Aucun job non critique actif a reduire.";
      assistant = {
        title: "Reduction indisponible",
        body:
          "Les jobs actifs ne sont pas de bons candidats. Evitez de degrader le cyber critique.",
        tone: "warning",
      };
    }
  }

  if (actionType === "activate_cache") {
    let improved = 0;
    for (const job of state.aiJobs) {
      if (!job.cached && job.status !== "completed" && job.status !== "failed") {
        job.cached = true;
        job.redundantCalls = Math.max(0, Math.round(job.redundantCalls * 0.38));
        if (activeOrThrottled(job)) {
          job.currentPowerMw = computeAiJobPower(state, job);
        }
        improved += 1;
      }
    }

    result = improved > 0 ? `${improved} jobs proteges par cache.` : "Cache deja actif.";
    impact = improved > 0 ? "positive" : "mixed";
    assistant = {
      title: "Cache IA active",
      body:
        "Les appels repetes sont reduits. L'effet est progressif mais fiable sur les assistants et agents.",
      tone: "info",
    };
  }

  if (actionType === "agent_timeout") {
    const agent = state.aiJobs.find((job) => job.id === "looping-agent");
    if (agent && state.flags.agentLoop && !agent.timeoutApplied) {
      agent.timeoutApplied = true;
      agent.status = "throttled";
      agent.loopRisk = 14;
      agent.redundantCalls = 8;
      agent.currentPowerMw = computeAiJobPower(state, agent);
      state.flags.agentLoop = false;
      resolveIncident(state, "agent-loop");
      result = "Boucle agent stoppee par budget d'iterations.";
      assistant = {
        title: "Timeout applique",
        body:
          "L'agent ne peut plus consommer sans valeur. Le datacenter garde sa capacite pour les charges utiles.",
        tone: "info",
      };
    } else {
      impact = "mixed";
      result = "Aucune boucle agent active.";
      assistant = {
        title: "Aucun agent a stopper",
        body:
          "Gardez cette action pour une anomalie Energy SOC ou un agent qui multiplie les appels.",
        tone: "warning",
      };
    }
  }

  if (actionType === "discharge_battery") {
    if (state.metrics.batteryLevel > 12) {
      upsertEffect(state, {
        label,
        action: actionType,
        expiresAt: state.minute + 20,
        magnitude: 32,
      });
      result = "Batterie dechargee pendant 20 minutes.";
      assistant = {
        title: "Batterie engagee",
        body:
          "La stabilite va remonter rapidement. Surveillez la reserve pour ne pas arriver vide au pic final.",
        tone: "info",
      };
    } else {
      impact = "negative";
      result = "Reserve batterie trop basse.";
      assistant = {
        title: "Batterie insuffisante",
        body:
          "Le stockage ne peut plus absorber la crise. Il faut reduire la demande ou importer.",
        tone: "critical",
      };
    }
  }

  if (actionType === "import_energy") {
    upsertEffect(state, {
      label,
      action: actionType,
      expiresAt: state.minute + 30,
      magnitude: 30,
    });
    result = "Import active pour securiser la marge.";
    impact = "mixed";
    assistant = {
      title: "Import active",
      body:
        "Le reseau gagne une marge immediate. Le cout et la souverainete seront penalises.",
      tone: "warning",
    };
  }

  if (actionType === "thermal_backup") {
    upsertEffect(state, {
      label,
      action: actionType,
      expiresAt: state.minute + 25,
      magnitude: 38,
    });
    result = "Thermique de secours lance.";
    impact = "mixed";
    assistant = {
      title: "Thermique de secours",
      body:
        "La stabilite remonte fortement, mais l'empreinte CO2 et le cout augmentent. C'est un dernier recours.",
      tone: "critical",
    };
  }

  addActionRecord(state, {
    type: actionType,
    label,
    result,
    impact,
  });

  if (assistant) addAssistantMessage(state, assistant);
  updateAiJobs(state);
  recomputeState(state);
  resolveIncidentsFromState(state);

  return state;
}

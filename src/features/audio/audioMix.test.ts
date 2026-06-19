import assert from "node:assert/strict";
import test from "node:test";
import {
  getActionAudioPulse,
  getAdaptiveAudioMix,
  getAthenaVoiceCue,
  getLineTripAudioPulse,
  getSelectionAudioCue,
} from "@/features/audio/audioMix";

test("adaptive audio mix raises alarm and flow layers under grid stress", () => {
  const calm = getAdaptiveAudioMix({
    grid: { maxUtilization: 0.55, overloadMw: 0, unservedMw: 0 },
    metrics: { aiProductivity: 100, criticalContinuity: 100, demandMw: 120, stability: 96 },
  });
  const stressed = getAdaptiveAudioMix({
    grid: { maxUtilization: 1.16, overloadMw: 34, unservedMw: 12 },
    metrics: { aiProductivity: 62, criticalContinuity: 58, demandMw: 210, stability: 32 },
  });

  assert.ok(stressed.stress > calm.stress);
  assert.ok(stressed.alarmGain > calm.alarmGain);
  assert.ok(stressed.datacenterAlarmGain > calm.datacenterAlarmGain);
  assert.ok(stressed.flowGain > calm.flowGain);
  assert.ok(stressed.humFrequency > calm.humFrequency);
  assert.ok(stressed.musicGain > calm.musicGain);
  assert.ok(stressed.musicFrequency < calm.musicFrequency);
  assert.ok(stressed.serviceAlarmGain > calm.serviceAlarmGain);
});

test("action audio pulses distinguish grid, supply, AI and demand commands", () => {
  const grid = getActionAudioPulse({ impact: "positive", type: "reroute_line" });
  const supply = getActionAudioPulse({ impact: "positive", type: "discharge_battery" });
  const ai = getActionAudioPulse({ impact: "positive", type: "migrate_ai" });
  const demand = getActionAudioPulse({ impact: "positive", type: "smart_ev" });

  assert.equal(grid?.type, "sawtooth");
  assert.equal(supply?.type, "triangle");
  assert.equal(ai?.type, "square");
  assert.equal(demand?.type, "sine");
  assert.notEqual(grid?.frequency, ai?.frequency);
});

test("line trip pulse only fires when the trip count increases", () => {
  assert.equal(getLineTripAudioPulse(2, 2), undefined);

  const pulse = getLineTripAudioPulse(2, 4);

  assert.equal(pulse?.type, "sawtooth");
  assert.ok((pulse?.gain ?? 0) > 0.08);
  assert.ok((pulse?.duration ?? 0) > 0.3);
});

test("selection audio cue clicks once per selected entity and distinguishes kinds", () => {
  const line = getSelectionAudioCue({ kind: "line", id: "line-a" });
  const sameLine = getSelectionAudioCue({ kind: "line", id: "line-a" }, line?.key);
  const node = getSelectionAudioCue({ kind: "node", id: "node-a" }, line?.key);
  const workload = getSelectionAudioCue({ kind: "workload", id: "job-a" }, node?.key);

  assert.equal(line?.key, "line:line-a");
  assert.equal(line?.pulse.type, "triangle");
  assert.equal(sameLine, undefined);
  assert.equal(node?.pulse.type, "sine");
  assert.equal(workload?.pulse.type, "square");
});

test("athena voice cue speaks each assistant message once with severity pacing", () => {
  const info = getAthenaVoiceCue({
    body: "Le reseau est stable et les charges flexibles restent sous controle.",
    id: "athena-info",
    title: "ATHENA Grid en ligne",
    tone: "info",
  });
  const critical = getAthenaVoiceCue({
    body: "Perte de continuite critique sur un poste prioritaire.",
    id: "athena-critical",
    title: "Rupture critique",
    tone: "critical",
  });

  assert.equal(getAthenaVoiceCue({
    body: "Deja annonce.",
    id: "athena-info",
    title: "Doublon",
    tone: "warning",
  }, "athena-info"), undefined);

  assert.equal(info?.text.startsWith("Athéna."), true);
  assert.equal(critical?.text.startsWith("Athéna critique."), true);
  assert.ok((critical?.rate ?? 1) < (info?.rate ?? 0));
  assert.ok((critical?.volume ?? 0) > (info?.volume ?? 1));
  assert.equal(critical?.pulse.type, "square");
});

test("athena voice cue restores common French accents for speech synthesis", () => {
  const cue = getAthenaVoiceCue({
    body: "Le reseau est securise, preparez une commande ciblee.",
    id: "athena-accent",
    title: "Stabilite reseau",
    tone: "warning",
  });

  assert.match(cue?.text ?? "", /Stabilité réseau/);
  assert.match(cue?.text ?? "", /réseau est sécurisé/);
  assert.match(cue?.text ?? "", /préparez une commande ciblée/);
});

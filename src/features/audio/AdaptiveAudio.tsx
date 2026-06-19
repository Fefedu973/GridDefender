"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  getActionAudioPulse,
  getAdaptiveAudioMix,
  getAthenaVoiceCue,
  getLineTripAudioPulse,
  getSelectionAudioCue,
  type AudioPulse,
} from "@/features/audio/audioMix";
import { selectFrenchSpeechVoice } from "@/features/audio/speechVoice";
import { useGameStore } from "@/store/gameStore";

export function AdaptiveAudio() {
  const enabled = useGameStore((state) => state.audioEnabled);
  const demandMw = useGameStore((state) => state.game.metrics.demandMw);
  const stability = useGameStore((state) => state.game.metrics.stability);
  const maxUtilization = useGameStore((state) => state.game.grid.maxUtilization);
  const overloadMw = useGameStore((state) => state.game.grid.overloadMw);
  const unservedMw = useGameStore((state) => state.game.grid.unservedMw);
  const aiProductivity = useGameStore((state) => state.game.metrics.aiProductivity);
  const criticalContinuity = useGameStore((state) => state.game.metrics.criticalContinuity);
  const latestAction = useGameStore((state) => state.game.actionHistory[0]);
  const latestAssistantMessage = useGameStore((state) => state.game.assistantMessages[0]);
  const lineTripCount = useGameStore((state) => state.game.cumulative.lineTrips);
  const selectedEntity = useGameStore((state) => state.selectedEntity);
  const recordSpeechCue = useGameStore((state) => state.recordSpeechCue);
  const contextRef = useRef<AudioContext | null>(null);
  const humRef = useRef<OscillatorNode | null>(null);
  const flowRef = useRef<OscillatorNode | null>(null);
  const alarmRef = useRef<OscillatorNode | null>(null);
  const datacenterAlarmRef = useRef<OscillatorNode | null>(null);
  const musicRef = useRef<OscillatorNode | null>(null);
  const serviceAlarmRef = useRef<OscillatorNode | null>(null);
  const humGainRef = useRef<GainNode | null>(null);
  const flowGainRef = useRef<GainNode | null>(null);
  const alarmGainRef = useRef<GainNode | null>(null);
  const datacenterAlarmGainRef = useRef<GainNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const serviceAlarmGainRef = useRef<GainNode | null>(null);
  const lastActionIdRef = useRef<string | undefined>(undefined);
  const lastAssistantMessageIdRef = useRef<string | undefined>(undefined);
  const lastLineTripCountRef = useRef(0);
  const lastSelectionKeyRef = useRef<string | undefined>(undefined);
  const mix = useMemo(
    () =>
      getAdaptiveAudioMix({
        grid: { maxUtilization, overloadMw, unservedMw },
        metrics: { aiProductivity, criticalContinuity, demandMw, stability },
      }),
    [aiProductivity, criticalContinuity, demandMw, maxUtilization, overloadMw, stability, unservedMw],
  );

  const playPulse = useCallback((pulse: AudioPulse) => {
    const context = contextRef.current;
    if (!enabled || !context) return;
    const oscillator = context.createOscillator();
    const pulseGain = context.createGain();
    oscillator.type = pulse.type;
    oscillator.frequency.value = pulse.frequency;
    pulseGain.gain.setValueAtTime(pulse.gain, context.currentTime);
    pulseGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + pulse.duration);
    oscillator.connect(pulseGain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + pulse.duration);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      humGainRef.current?.gain.setTargetAtTime(0, contextRef.current?.currentTime ?? 0, 0.08);
      flowGainRef.current?.gain.setTargetAtTime(0, contextRef.current?.currentTime ?? 0, 0.08);
      alarmGainRef.current?.gain.setTargetAtTime(0, contextRef.current?.currentTime ?? 0, 0.08);
      datacenterAlarmGainRef.current?.gain.setTargetAtTime(0, contextRef.current?.currentTime ?? 0, 0.08);
      musicGainRef.current?.gain.setTargetAtTime(0, contextRef.current?.currentTime ?? 0, 0.08);
      serviceAlarmGainRef.current?.gain.setTargetAtTime(0, contextRef.current?.currentTime ?? 0, 0.08);
      return;
    }

    const context = new AudioContext();
    const hum = context.createOscillator();
    const flow = context.createOscillator();
    const alarm = context.createOscillator();
    const datacenterAlarm = context.createOscillator();
    const music = context.createOscillator();
    const serviceAlarm = context.createOscillator();
    const humGain = context.createGain();
    const flowGain = context.createGain();
    const alarmGain = context.createGain();
    const datacenterAlarmGain = context.createGain();
    const musicGain = context.createGain();
    const serviceAlarmGain = context.createGain();
    const filter = context.createBiquadFilter();
    const flowFilter = context.createBiquadFilter();
    const musicFilter = context.createBiquadFilter();

    hum.type = "sine";
    hum.frequency.value = 52;
    flow.type = "sawtooth";
    flow.frequency.value = 74;
    alarm.type = "triangle";
    alarm.frequency.value = 220;
    datacenterAlarm.type = "square";
    datacenterAlarm.frequency.value = 540;
    music.type = "sine";
    music.frequency.value = 110;
    serviceAlarm.type = "sine";
    serviceAlarm.frequency.value = 820;
    filter.type = "lowpass";
    filter.frequency.value = 620;
    flowFilter.type = "bandpass";
    flowFilter.frequency.value = 190;
    flowFilter.Q.value = 0.85;
    musicFilter.type = "lowpass";
    musicFilter.frequency.value = 360;
    humGain.gain.value = 0;
    flowGain.gain.value = 0;
    alarmGain.gain.value = 0;
    datacenterAlarmGain.gain.value = 0;
    musicGain.gain.value = 0;
    serviceAlarmGain.gain.value = 0;

    hum.connect(humGain).connect(filter).connect(context.destination);
    flow.connect(flowGain).connect(flowFilter).connect(context.destination);
    alarm.connect(alarmGain).connect(context.destination);
    datacenterAlarm.connect(datacenterAlarmGain).connect(context.destination);
    music.connect(musicGain).connect(musicFilter).connect(context.destination);
    serviceAlarm.connect(serviceAlarmGain).connect(context.destination);
    hum.start();
    flow.start();
    alarm.start();
    datacenterAlarm.start();
    music.start();
    serviceAlarm.start();

    contextRef.current = context;
    humRef.current = hum;
    flowRef.current = flow;
    alarmRef.current = alarm;
    datacenterAlarmRef.current = datacenterAlarm;
    musicRef.current = music;
    serviceAlarmRef.current = serviceAlarm;
    humGainRef.current = humGain;
    flowGainRef.current = flowGain;
    alarmGainRef.current = alarmGain;
    datacenterAlarmGainRef.current = datacenterAlarmGain;
    musicGainRef.current = musicGain;
    serviceAlarmGainRef.current = serviceAlarmGain;

    return () => {
      hum.stop();
      flow.stop();
      alarm.stop();
      datacenterAlarm.stop();
      music.stop();
      serviceAlarm.stop();
      context.close();
      contextRef.current = null;
      humRef.current = null;
      flowRef.current = null;
      alarmRef.current = null;
      datacenterAlarmRef.current = null;
      musicRef.current = null;
      serviceAlarmRef.current = null;
      humGainRef.current = null;
      flowGainRef.current = null;
      alarmGainRef.current = null;
      datacenterAlarmGainRef.current = null;
      musicGainRef.current = null;
      serviceAlarmGainRef.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    const context = contextRef.current;
    if (
      !enabled ||
      !context ||
      !humRef.current ||
      !flowRef.current ||
      !alarmRef.current ||
      !datacenterAlarmRef.current ||
      !musicRef.current ||
      !serviceAlarmRef.current ||
      !humGainRef.current ||
      !flowGainRef.current ||
      !alarmGainRef.current ||
      !datacenterAlarmGainRef.current ||
      !musicGainRef.current ||
      !serviceAlarmGainRef.current
    ) return;
    const now = context.currentTime;

    humRef.current.frequency.setTargetAtTime(mix.humFrequency, now, 0.12);
    humGainRef.current.gain.setTargetAtTime(mix.humGain, now, 0.18);
    flowRef.current.frequency.setTargetAtTime(mix.flowFrequency, now, 0.14);
    flowGainRef.current.gain.setTargetAtTime(mix.flowGain, now, 0.2);
    alarmRef.current.frequency.setTargetAtTime(mix.alarmFrequency, now, 0.08);
    alarmGainRef.current.gain.setTargetAtTime(mix.alarmGain, now, 0.08);
    datacenterAlarmRef.current.frequency.setTargetAtTime(mix.datacenterAlarmFrequency, now, 0.1);
    datacenterAlarmGainRef.current.gain.setTargetAtTime(mix.datacenterAlarmGain, now, 0.14);
    musicRef.current.frequency.setTargetAtTime(mix.musicFrequency, now, 0.35);
    musicGainRef.current.gain.setTargetAtTime(mix.musicGain, now, 0.45);
    serviceAlarmRef.current.frequency.setTargetAtTime(mix.serviceAlarmFrequency, now, 0.1);
    serviceAlarmGainRef.current.gain.setTargetAtTime(mix.serviceAlarmGain, now, 0.14);
  }, [enabled, mix]);

  useEffect(() => {
    if (!latestAction?.id || lastActionIdRef.current === latestAction.id) return;
    lastActionIdRef.current = latestAction.id;
    const pulse = getActionAudioPulse(latestAction);
    if (pulse) playPulse(pulse);
  }, [latestAction, playPulse]);

  useEffect(() => {
    const pulse = getLineTripAudioPulse(lastLineTripCountRef.current, lineTripCount);
    lastLineTripCountRef.current = lineTripCount;
    if (pulse) playPulse(pulse);
  }, [lineTripCount, playPulse]);

  useEffect(() => {
    if (!selectedEntity) {
      lastSelectionKeyRef.current = undefined;
      return;
    }
    const cue = getSelectionAudioCue(selectedEntity, lastSelectionKeyRef.current);
    lastSelectionKeyRef.current = cue?.key ?? `${selectedEntity.kind}:${selectedEntity.id}`;
    if (cue) playPulse(cue.pulse);
  }, [playPulse, selectedEntity]);

  useEffect(() => {
    const cue = getAthenaVoiceCue(latestAssistantMessage, lastAssistantMessageIdRef.current);
    if (!cue) return;
    lastAssistantMessageIdRef.current = cue.id;
    playPulse(cue.pulse);

    if (!enabled || typeof window === "undefined" || !window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") return;

    const synthesis = window.speechSynthesis;
    let didSpeak = false;

    const speakCue = () => {
      if (didSpeak) return;
      didSpeak = true;

      const utterance = new SpeechSynthesisUtterance(cue.text);
      const voice = selectFrenchSpeechVoice(synthesis.getVoices());
      utterance.lang = voice?.lang || "fr-FR";
      if (voice) utterance.voice = voice;
      utterance.pitch = cue.pitch;
      utterance.rate = cue.rate;
      utterance.volume = cue.volume;
      recordSpeechCue({
        id: cue.id,
        minute: latestAssistantMessage?.minute ?? 0,
        text: cue.text,
        voiceLang: utterance.lang,
        voiceName: voice?.name,
      });
      synthesis.cancel();
      synthesis.speak(utterance);
    };

    if (synthesis.getVoices().length > 0) {
      speakCue();
      return;
    }

    const timeoutId = window.setTimeout(speakCue, 350);
    synthesis.addEventListener("voiceschanged", speakCue, { once: true });

    return () => {
      window.clearTimeout(timeoutId);
      synthesis.removeEventListener("voiceschanged", speakCue);
    };
  }, [enabled, latestAssistantMessage, playPulse, recordSpeechCue]);

  return null;
}

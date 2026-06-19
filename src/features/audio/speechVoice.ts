const FRENCH_NAME_HINTS = ["francais", "français", "french"];

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("fr-FR");
}

function scoreFrenchVoice(voice: SpeechSynthesisVoice) {
  const lang = normalize(voice.lang);
  const name = normalize(voice.name);
  const isFranceFrench = lang === "fr-fr" || lang === "fr_fr";
  const isFrenchLocale = lang === "fr" || lang.startsWith("fr-") || lang.startsWith("fr_");
  const hasFrenchName = FRENCH_NAME_HINTS.some((hint) => name.includes(hint));

  if (!isFrenchLocale && !hasFrenchName) return -1;

  let score = 0;
  if (isFranceFrench) score += 100;
  else if (isFrenchLocale) score += 75;
  else score += 35;
  if (hasFrenchName) score += 12;
  if (voice.localService) score += 4;
  if (voice.default) score += 2;

  return score;
}

export function selectFrenchSpeechVoice(voices: readonly SpeechSynthesisVoice[]) {
  let selected: SpeechSynthesisVoice | undefined;
  let selectedScore = -1;

  for (const voice of voices) {
    const score = scoreFrenchVoice(voice);
    if (score > selectedScore) {
      selected = voice;
      selectedScore = score;
    }
  }

  return selected;
}

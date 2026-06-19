import assert from "node:assert/strict";
import test from "node:test";
import { selectFrenchSpeechVoice } from "@/features/audio/speechVoice";

function voice(name: string, lang: string, options: Partial<SpeechSynthesisVoice> = {}) {
  return {
    default: false,
    lang,
    localService: true,
    name,
    voiceURI: name,
    ...options,
  } as SpeechSynthesisVoice;
}

test("speech voice selection prefers a French France voice", () => {
  const selected = selectFrenchSpeechVoice([
    voice("Samantha", "en-US"),
    voice("Amelie", "fr-CA"),
    voice("Thomas", "fr-FR", { default: false }),
  ]);

  assert.equal(selected?.name, "Thomas");
});

test("speech voice selection falls back to another francophone voice", () => {
  const selected = selectFrenchSpeechVoice([
    voice("Alex", "en-US"),
    voice("Amelie", "fr-CA"),
  ]);

  assert.equal(selected?.name, "Amelie");
});

test("speech voice selection can use French name hints when locale metadata is weak", () => {
  const selected = selectFrenchSpeechVoice([
    voice("English Default", "en-US"),
    voice("Google français", ""),
  ]);

  assert.equal(selected?.name, "Google français");
});

test("speech voice selection returns undefined without a French voice", () => {
  const selected = selectFrenchSpeechVoice([
    voice("Alex", "en-US"),
    voice("Samantha", "en-GB"),
  ]);

  assert.equal(selected, undefined);
});

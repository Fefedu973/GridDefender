import assert from "node:assert/strict";
import test from "node:test";
import { restoreFrenchSpeechAccents } from "@/features/audio/speechText";

test("speech text restores common French accents before TTS", () => {
  assert.equal(
    restoreFrenchSpeechAccents("Reseau securise. Decharger energie ciblee sans penaliser les vehicules."),
    "Réseau sécurisé. Décharger énergie ciblée sans pénaliser les véhicules.",
  );
});

test("speech text restores Athena, capacity and action result accents", () => {
  assert.equal(
    restoreFrenchSpeechAccents("ATHENA detecte une capacite insuffisante. Modele optimise, job reporte."),
    "Athéna détecte une capacité insuffisante. Modèle optimisé, job reporté.",
  );
});

test("speech text keeps already-accented French text and normalizes Athena", () => {
  assert.equal(
    restoreFrenchSpeechAccents("ATHENA signale un incident critique. Gardez la simulation active."),
    "Athéna signale un incident critique. Gardez la simulation active.",
  );
});

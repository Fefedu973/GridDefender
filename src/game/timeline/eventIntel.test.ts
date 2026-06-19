import assert from "node:assert/strict";
import test from "node:test";
import { getTimelineEventIntel } from "@/game/timeline/eventIntel";
import { eveningPeakScenario } from "@/game/scenarios/eveningPeak";
import type { Scenario } from "@/game/types";

const hiddenEvent = eveningPeakScenario.events.find((event) => event.id === "cyber-job")!;
const knownEvent = eveningPeakScenario.events.find((event) => event.id === "ev-surge")!;

test("timeline intel keeps known events exact", () => {
  const intel = getTimelineEventIntel(eveningPeakScenario, knownEvent, eveningPeakScenario.startMinute, []);

  assert.equal(intel.level, "known");
  assert.equal(intel.markerMinute, knownEvent.minute);
  assert.equal(intel.title, knownEvent.title);
});

test("timeline intel hides unknown events outside the forecast horizon", () => {
  const intel = getTimelineEventIntel(eveningPeakScenario, hiddenEvent, eveningPeakScenario.startMinute, []);

  assert.equal(intel.level, "hidden");
});

test("timeline intel reveals unknown events as vague forecasts near the event", () => {
  const intel = getTimelineEventIntel(eveningPeakScenario, hiddenEvent, hiddenEvent.minute - 20, []);

  assert.equal(intel.level, "forecast");
  assert.equal(intel.title, "Incident probable");
  assert.ok((intel.windowStartMinute ?? 0) < hiddenEvent.minute);
  assert.ok((intel.windowEndMinute ?? 0) > hiddenEvent.minute);
});

test("timeline intel shows explicit forecast events without exposing exact event details", () => {
  const scenario: Scenario = {
    ...eveningPeakScenario,
    knownEventIds: [],
    forecastEventIds: [hiddenEvent.id],
  };
  const intel = getTimelineEventIntel(scenario, hiddenEvent, eveningPeakScenario.startMinute, []);

  assert.equal(intel.level, "forecast");
  assert.equal(intel.title, "Incident probable");
  assert.equal(intel.markerMinute, hiddenEvent.minute);
  assert.notEqual(intel.description, hiddenEvent.description);
  assert.ok((intel.windowStartMinute ?? 0) < hiddenEvent.minute);
  assert.ok((intel.windowEndMinute ?? 0) > hiddenEvent.minute);
});

test("blackout telemetry narrows forecast horizon and changes uncertain labels", () => {
  const scenario: Scenario = {
    ...eveningPeakScenario,
    difficulty: "expert",
    knownEventIds: [],
    telemetry: {
      mode: "blackout",
      label: "SCADA partiel",
      forecastHorizonMinutes: 5,
    },
  };

  const hidden = getTimelineEventIntel(scenario, hiddenEvent, hiddenEvent.minute - 10, []);
  const forecast = getTimelineEventIntel(scenario, hiddenEvent, hiddenEvent.minute - 5, []);

  assert.equal(hidden.level, "hidden");
  assert.equal(hidden.title, "Télémétrie noire");
  assert.equal(forecast.level, "forecast");
  assert.equal(forecast.title, "Incident fantôme probable");
});

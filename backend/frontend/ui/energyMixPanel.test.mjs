import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildEnergyMixModel,
  buildGroupedSeries,
  DEFAULT_MOCK_ENTRIES,
} from "./energyMixPanel.js";

test("aggregates durations, active timers, and completions", () => {
  const now = new Date("2024-01-02T10:00:00Z");
  const habits = [
    { id: 1, name: "Meditate", category: "Mind", completions: [{}, {}] },
    { id: 2, name: "Run", category: "Move", completions: [{}] },
  ];
  const timeLogs = {
    "2024-01-01": { 1: 15, 2: 30 },
    "2024-01-02": { 1: 10 },
  };
  const activeTimers = { 2: { start: now.getTime() - 15 * 60_000 } };

  const model = buildEnergyMixModel({
    habits,
    timeLogs,
    activeTimers,
    now,
    chartMode: "habit",
    valueMode: "duration",
  });

  const meditate = model.entries.find((entry) => entry.habitId === 1);
  const run = model.entries.find((entry) => entry.habitId === 2);

  assert.equal(meditate.durationMinutes, 25);
  assert.equal(run.durationMinutes, 45);
  assert.equal(run.frequency, 1);
  assert.equal(model.total, 70);
  assert.equal(model.habitSeries[0].label, "Run");
});

test("frequency view uses completion counts", () => {
  const habits = [{ id: 3, name: "Read", category: "Growth", completions: [{}, {}, {}] }];

  const model = buildEnergyMixModel({
    habits,
    timeLogs: {},
    activeTimers: {},
    valueMode: "frequency",
  });

  assert.equal(model.total, 3);
  assert.equal(model.categorySeries[0].value, 3);
  assert.equal(model.habitSeries[0].value, 3);
});

test("falls back to mock entries when no data exists", () => {
  const model = buildEnergyMixModel({
    habits: [],
    timeLogs: {},
    mockEntries: DEFAULT_MOCK_ENTRIES.slice(0, 1),
  });

  assert.ok(model.hasData);
  assert.equal(model.entries[0].habitId, DEFAULT_MOCK_ENTRIES[0].habitId);
  assert.equal(model.entries[0].frequency, DEFAULT_MOCK_ENTRIES[0].sessionCount);
  assert.equal(model.total, DEFAULT_MOCK_ENTRIES[0].durationMinutes);
});

test("grouped series orders by category total and child values", () => {
  const habits = [
    { id: 1, name: "Stretch", category: "Health", completions: [{}] },
    { id: 2, name: "Lift", category: "Health", completions: [{}, {}] },
    { id: 3, name: "Write", category: "Focus", completions: [{}] },
  ];
  const timeLogs = { "2024-01-01": { 1: 10, 2: 25, 3: 5 } };
  const model = buildEnergyMixModel({
    habits,
    timeLogs,
    chartMode: "grouped",
    valueMode: "duration",
  });

  const grouped = buildGroupedSeries(model.entries, "duration");
  assert.equal(grouped[0].label, "Health");
  assert.equal(grouped[0].habits[0].label, "Lift");
});

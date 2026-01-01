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

test("test_frequency_aggregation_counts_all_completions", () => {
  // 1. Setup
  const habitIdAlpha = 11;
  const habitIdBeta = 12;
  const alphaCompletions = [{}, {}];
  const betaCompletions = [{}];
  const expectedAlphaCount = alphaCompletions.length;
  const expectedBetaCount = betaCompletions.length;
  const expectedTotal = expectedAlphaCount + expectedBetaCount;
  const habits = [
    { id: habitIdAlpha, name: "Alpha", category: "Focus", completions: alphaCompletions },
    { id: habitIdBeta, name: "Beta", category: "Health", completions: betaCompletions },
  ];

  // 2. Act
  const model = buildEnergyMixModel({
    habits,
    timeLogs: {},
    activeTimers: {},
    valueMode: "frequency",
  });

  // 3. Assert
  assert.equal(model.total, expectedTotal);
  assert.equal(model.habitSeries.find((entry) => entry.habitId === habitIdAlpha).value, expectedAlphaCount);
  assert.equal(model.habitSeries.find((entry) => entry.habitId === habitIdBeta).value, expectedBetaCount);
});

test("test_duration_aggregation_includes_time_logs_and_active_timer", () => {
  // 1. Setup
  const habitId = 21;
  const dayOneMinutes = 20;
  const dayTwoMinutes = 35;
  const activeMinutes = 10;
  const now = new Date("2024-01-02T12:00:00Z");
  const habits = [{ id: habitId, name: "Deep Work", category: "Focus", completions: [{}] }];
  const timeLogs = {
    "2024-01-01": { [habitId]: dayOneMinutes },
    "2024-01-02": { [habitId]: dayTwoMinutes },
  };
  const activeTimers = { [habitId]: { start: now.getTime() - activeMinutes * 60_000 } };
  const expectedTotal = dayOneMinutes + dayTwoMinutes + activeMinutes;

  // 2. Act
  const model = buildEnergyMixModel({
    habits,
    timeLogs,
    activeTimers,
    now,
    valueMode: "duration",
  });

  // 3. Assert
  assert.equal(model.total, expectedTotal);
  assert.equal(model.entries[0].durationMinutes, expectedTotal);
});

test("test_duration_excludes_zero_minute_habit_entry", () => {
  // 1. Setup
  const habitId = 31;
  const completions = [{}, {}, {}];
  const expectedSeriesLength = 0;
  const habits = [{ id: habitId, name: "No Timer", category: "Other", completions }];

  // 2. Act
  const model = buildEnergyMixModel({
    habits,
    timeLogs: {},
    activeTimers: {},
    valueMode: "duration",
  });

  // 3. Assert
  assert.equal(model.habitSeries.length, expectedSeriesLength);
  assert.equal(model.categorySeries.length, expectedSeriesLength);
  assert.equal(model.total, 0);
});

test("test_duration_mixed_habits_exclude_zero_minute_entry", () => {
  // 1. Setup
  const timedHabitId = 41;
  const untimedHabitId = 42;
  const timedMinutes = 50;
  const expectedTotal = timedMinutes;
  const expectedSeriesLength = 1;
  const habits = [
    { id: timedHabitId, name: "Timed", category: "Focus", completions: [{}] },
    { id: untimedHabitId, name: "Untimed", category: "Focus", completions: [{}, {}] },
  ];
  const timeLogs = {
    "2024-01-03": { [timedHabitId]: timedMinutes },
  };

  // 2. Act
  const model = buildEnergyMixModel({
    habits,
    timeLogs,
    activeTimers: {},
    valueMode: "duration",
  });

  // 3. Assert
  assert.equal(model.total, expectedTotal);
  assert.equal(model.habitSeries.length, expectedSeriesLength);
  assert.equal(model.habitSeries[0].habitId, timedHabitId);
});

test("test_duration_zero_minutes_show_empty_series", () => {
  // 1. Setup
  const habitId = 51;
  const zeroMinutes = 0;
  const expectedSeriesLength = 0;
  const now = new Date("2024-01-04T08:00:00Z");
  const habits = [{ id: habitId, name: "Zero", category: "Focus", completions: [{}] }];
  const timeLogs = {
    "2024-01-04": { [habitId]: zeroMinutes },
  };
  const activeTimers = { [habitId]: { start: now.getTime() } };
  const expectedTotal = 0;

  // 2. Act
  const model = buildEnergyMixModel({
    habits,
    timeLogs,
    activeTimers,
    now,
    valueMode: "duration",
  });

  // 3. Assert
  assert.equal(model.total, expectedTotal);
  assert.equal(model.habitSeries.length, expectedSeriesLength);
  assert.equal(model.categorySeries.length, expectedSeriesLength);
});

test("test_duration_accumulates_multiple_sessions_across_days", () => {
  // 1. Setup
  const habitId = 61;
  const dayOneMinutes = 25;
  const dayTwoMinutes = 40;
  const expectedTotal = dayOneMinutes + dayTwoMinutes;
  const habits = [{ id: habitId, name: "Sessions", category: "Growth", completions: [{}, {}] }];
  const timeLogs = {
    "2024-01-05": { [habitId]: dayOneMinutes },
    "2024-01-06": { [habitId]: dayTwoMinutes },
  };

  // 2. Act
  const model = buildEnergyMixModel({
    habits,
    timeLogs,
    activeTimers: {},
    valueMode: "duration",
  });

  // 3. Assert
  assert.equal(model.total, expectedTotal);
  assert.equal(model.entries[0].durationMinutes, expectedTotal);
});

test("test_duration_aggregates_completion_notes_when_time_logs_missing", () => {
  // 1. Setup
  const habitId = 71;
  const noteMinutes = 20;
  const expectedTotal = noteMinutes;
  const habits = [
    {
      id: habitId,
      name: "Note Logged",
      category: "Focus",
      completions: [{ date: "2024-02-01", note: `${noteMinutes}m focus` }],
    },
  ];

  // 2. Act
  const model = buildEnergyMixModel({
    habits,
    timeLogs: {},
    activeTimers: {},
    valueMode: "duration",
  });

  // 3. Assert
  assert.equal(model.total, expectedTotal);
  assert.equal(model.habitSeries[0].value, expectedTotal);
});

test("test_duration_skips_completion_minutes_for_dates_with_time_logs", () => {
  // 1. Setup
  const habitId = 81;
  const loggedMinutes = 15;
  const completionMinutes = 15;
  const extraMinutes = 10;
  const expectedTotal = loggedMinutes + extraMinutes;
  const habits = [
    {
      id: habitId,
      name: "Mixed Logs",
      category: "Focus",
      completions: [
        { date: "2024-02-02", note: `${completionMinutes}m focus` },
        { date: "2024-02-01", note: `${extraMinutes}m focus` },
      ],
    },
  ];
  const timeLogs = {
    "2024-02-02": { [habitId]: loggedMinutes },
  };

  // 2. Act
  const model = buildEnergyMixModel({
    habits,
    timeLogs,
    activeTimers: {},
    valueMode: "duration",
  });

  // 3. Assert
  assert.equal(model.total, expectedTotal);
  assert.equal(model.habitSeries[0].value, expectedTotal);
});

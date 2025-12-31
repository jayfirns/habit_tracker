import assert from "node:assert/strict";
import { test } from "node:test";

import { purgeHabitState } from "./habitState.js";

test("purgeHabitState leaves empty state intact for incomplete habits", () => {
  const state = {
    timeLogs: { "2024-01-01": { "2": 15 } },
    manualLogs: { "2024-01-01": { "2": 10 } },
    activeTimers: { 2: { start: 123 } },
  };

  purgeHabitState(state, 1);

  assert.deepEqual(state.timeLogs, { "2024-01-01": { "2": 15 } });
  assert.deepEqual(state.manualLogs, { "2024-01-01": { "2": 10 } });
  assert.deepEqual(state.activeTimers, { 2: { start: 123 } });
});

test("purgeHabitState removes completed habit entries from logs and timers", () => {
  const state = {
    timeLogs: {
      "2024-01-01": { "1": 25, "2": 10 },
      "2024-01-02": { "1": 5 },
    },
    manualLogs: {
      "2024-01-01": { "1": 45 },
    },
    activeTimers: { 1: { start: 111 }, 2: { start: 222 } },
  };

  purgeHabitState(state, 1);

  assert.deepEqual(state.timeLogs, {
    "2024-01-01": { "2": 10 },
    "2024-01-02": {},
  });
  assert.deepEqual(state.manualLogs, { "2024-01-01": {} });
  assert.deepEqual(state.activeTimers, { 2: { start: 222 } });
});

test("purgeHabitState handles missing collections safely", () => {
  const state = {};

  purgeHabitState(state, 1);

  assert.deepEqual(state, {});
});

test("purgeHabitState removes string-keyed habit ids", () => {
  const state = {
    timeLogs: {
      "2024-01-01": { "7": 30 },
    },
    manualLogs: {
      "2024-01-01": { "7": 15, "8": 10 },
    },
    activeTimers: { 7: { start: 1000 } },
  };

  purgeHabitState(state, "7");

  assert.deepEqual(state.timeLogs, { "2024-01-01": {} });
  assert.deepEqual(state.manualLogs, { "2024-01-01": { "8": 10 } });
  assert.deepEqual(state.activeTimers, {});
});

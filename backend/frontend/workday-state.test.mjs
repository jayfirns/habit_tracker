import { test } from "node:test";
import assert from "node:assert/strict";
import { applyWorkdayEvent, getWorkdayUiState } from "./workday-state.js";

test("plan event sets planned values and clears clock data", () => {
  // 1. Setup
  const workday = {
    plannedStart: "08:00",
    plannedMinutes: 360,
    clockInAt: "2024-01-01T08:05:00.000Z",
    clockOutAt: "2024-01-01T12:05:00.000Z",
    workedMinutesOverride: 240,
  };

  // 2. Act
  const { workday: next } = applyWorkdayEvent(workday, {
    type: "plan",
    plannedStart: "09:00",
    plannedMinutes: 480,
  });

  // 3. Assert
  assert.equal(next.plannedStart, "09:00");
  assert.equal(next.plannedMinutes, 480);
  assert.equal(next.clockInAt, null);
  assert.equal(next.clockOutAt, null);
  assert.equal(next.workedMinutesOverride, null);
});

test("clock in only works once", () => {
  // 1. Setup
  const workday = {
    plannedStart: "09:00",
    plannedMinutes: 480,
    clockInAt: "2024-01-01T09:00:00.000Z",
  };

  // 2. Act
  const { workday: next, ignored } = applyWorkdayEvent(workday, {
    type: "clock_in",
    at: "2024-01-01T09:05:00.000Z",
  });

  // 3. Assert
  assert.equal(ignored, true);
  assert.equal(next.clockInAt, "2024-01-01T09:00:00.000Z");
});

test("clock out requires clock in", () => {
  // 1. Setup
  const workday = { plannedMinutes: 480 };

  // 2. Act
  const { workday: next, ignored } = applyWorkdayEvent(workday, {
    type: "clock_out",
    at: "2024-01-01T17:00:00.000Z",
  });

  // 3. Assert
  assert.equal(ignored, true);
  assert.equal(next.clockOutAt, null);
});

test("clock out locks clock in/out", () => {
  // 1. Setup
  const workday = {
    clockInAt: "2024-01-01T09:00:00.000Z",
    clockOutAt: "2024-01-01T17:00:00.000Z",
  };

  // 2. Act
  const { workday: next, ignored } = applyWorkdayEvent(workday, {
    type: "clock_in",
    at: "2024-01-01T09:30:00.000Z",
  });

  // 3. Assert
  assert.equal(ignored, true);
  assert.equal(next.clockInAt, "2024-01-01T09:00:00.000Z");
  assert.equal(next.clockOutAt, "2024-01-01T17:00:00.000Z");
});

test("worked override allowed only after clock out", () => {
  // 1. Setup
  const running = { clockInAt: "2024-01-01T09:00:00.000Z" };
  const completed = {
    clockInAt: "2024-01-01T09:00:00.000Z",
    clockOutAt: "2024-01-01T17:00:00.000Z",
  };

  // 2. Act
  const runningResult = applyWorkdayEvent(running, {
    type: "override_worked",
    minutes: 120,
  });
  const completedResult = applyWorkdayEvent(completed, {
    type: "override_worked",
    minutes: 120,
  });

  // 3. Assert
  assert.equal(runningResult.ignored, true);
  assert.equal(runningResult.workday.workedMinutesOverride, null);
  assert.equal(completedResult.ignored, false);
  assert.equal(completedResult.workday.workedMinutesOverride, 120);
});

test("UI state locks buttons based on clock state", () => {
  // 1. Setup
  const idle = getWorkdayUiState({ plannedMinutes: 480 });
  const running = getWorkdayUiState({
    clockInAt: "2024-01-01T09:00:00.000Z",
  });
  const completed = getWorkdayUiState({
    clockInAt: "2024-01-01T09:00:00.000Z",
    clockOutAt: "2024-01-01T17:00:00.000Z",
  });

  // 2. Act
  // 3. Assert
  assert.equal(idle.canClockIn, true);
  assert.equal(idle.canClockOut, false);
  assert.equal(idle.canOverride, false);
  assert.equal(running.canClockIn, false);
  assert.equal(running.canClockOut, true);
  assert.equal(running.canOverride, false);
  assert.equal(completed.canClockIn, false);
  assert.equal(completed.canClockOut, false);
  assert.equal(completed.canOverride, true);
});

test("UI state hides remaining time in clocked mode", () => {
  // 1. Setup
  const state = getWorkdayUiState({
    plannedMinutes: 480,
    clockInAt: "2024-01-01T09:00:00.000Z",
    clockOutAt: "2024-01-01T17:00:00.000Z",
  });

  // 2. Act
  // 3. Assert
  assert.equal(state.showRemaining, false);
  assert.equal(state.showPlanned, false);
  assert.equal(state.showWorked, true);
});

test("UI state flags adjusted worked label after override", () => {
  // 1. Setup
  const state = getWorkdayUiState({
    clockInAt: "2024-01-01T09:00:00.000Z",
    clockOutAt: "2024-01-01T17:00:00.000Z",
    workedMinutesOverride: 300,
  });

  // 2. Act
  // 3. Assert
  assert.equal(state.workedLabel, "Adjusted worked time");
});

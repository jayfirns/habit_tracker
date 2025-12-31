import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFocusMinutes, formatMinutes, computeWorkdayMinutes } from "./time-utils.js";

test("parses minutes only", () => {
  assert.equal(parseFocusMinutes("22m focus"), 22);
});

test("parses hours and minutes", () => {
  assert.equal(parseFocusMinutes("1h 05m focus"), 65);
});

test("ignores unrelated notes", () => {
  assert.equal(parseFocusMinutes("no time noted"), 0);
});

test("formats minutes dropping zero minutes", () => {
  assert.equal(formatMinutes(60), "1h");
  assert.equal(formatMinutes(61), "1h 01m");
  assert.equal(formatMinutes(0), "0m");
});

test("computes planned metrics when no clock exists", () => {
  const now = new Date("2024-01-01T10:00:00");
  const workday = { plannedStart: "09:00", plannedMinutes: 480 };
  const metrics = computeWorkdayMinutes(workday, now);
  assert.equal(metrics.mode, "planned");
  assert.equal(metrics.clockState, "idle");
  assert.equal(metrics.plannedMinutes, 480);
  assert.equal(metrics.workedMinutes, 0);
  assert.equal(metrics.remainingMinutes, 480);
});

test("computes worked minutes from clock in/out and ignores planned start", () => {
  const now = new Date("2024-01-01T12:00:00");
  const workday = {
    plannedStart: "09:00",
    plannedMinutes: 480,
    clockInAt: new Date("2024-01-01T09:30:00").toISOString(),
    clockOutAt: new Date("2024-01-01T12:00:00").toISOString(),
  };
  const metrics = computeWorkdayMinutes(workday, now);
  assert.equal(metrics.mode, "clocked");
  assert.equal(metrics.clockState, "completed");
  assert.equal(metrics.workedMinutes, 150);
  assert.equal(metrics.remainingMinutes, 330);
});

test("uses running clock when clock out is missing", () => {
  const now = new Date("2024-01-01T10:00:00");
  const workday = {
    plannedMinutes: 480,
    clockInAt: new Date("2024-01-01T09:00:00").toISOString(),
  };
  const metrics = computeWorkdayMinutes(workday, now);
  assert.equal(metrics.mode, "clocked");
  assert.equal(metrics.clockState, "running");
  assert.equal(metrics.workedMinutes, 60);
});

test("applies worked override only after clock out", () => {
  const now = new Date("2024-01-01T10:00:00");
  const workday = {
    plannedMinutes: 480,
    clockInAt: new Date("2024-01-01T09:00:00").toISOString(),
    clockOutAt: new Date("2024-01-01T09:10:00").toISOString(),
    workedMinutesOverride: 42,
  };
  const metrics = computeWorkdayMinutes(workday, now);
  assert.equal(metrics.workedMinutes, 42);
});

test("ignores worked override while clock is running", () => {
  const now = new Date("2024-01-01T10:00:00");
  const workday = {
    plannedMinutes: 480,
    clockInAt: new Date("2024-01-01T09:00:00").toISOString(),
    workedMinutesOverride: 200,
  };
  const metrics = computeWorkdayMinutes(workday, now);
  assert.equal(metrics.workedMinutes, 60);
});

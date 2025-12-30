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

test("computes workday minutes with clockout", () => {
  const now = new Date("2024-01-01T10:00:00");
  const workday = { start: "09:00", hours: 1, clockedOutAt: new Date("2024-01-01T09:38:00").toISOString() };
  const { usedMinutes, totalMinutes } = computeWorkdayMinutes(workday, now);
  assert.equal(totalMinutes, 60);
  assert.equal(usedMinutes, 38);
});

test("respects manual worked override", () => {
  const now = new Date("2024-01-01T10:00:00");
  const workday = { start: "09:00", hours: 1, manualWorkedMinutes: 22 };
  const { usedMinutes, totalMinutes } = computeWorkdayMinutes(workday, now);
  assert.equal(totalMinutes, 60);
  assert.equal(usedMinutes, 22);
});

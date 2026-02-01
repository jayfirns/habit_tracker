import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseQuarter,
  quarterEndDate,
  buildGoalPayload,
} from "./smartGoalForm.js";

// Quarter parsing tests
test("parseQuarter extracts quarter and year from 'Q1 2026'", () => {
  const result = parseQuarter("Q1 2026");
  assert.deepEqual(result, { quarter: 1, year: 2026 });
});

test("parseQuarter extracts quarter and year from 'Q4 2025'", () => {
  const result = parseQuarter("Q4 2025");
  assert.deepEqual(result, { quarter: 4, year: 2025 });
});

test("parseQuarter handles lowercase 'q2 2026'", () => {
  const result = parseQuarter("q2 2026");
  assert.deepEqual(result, { quarter: 2, year: 2026 });
});

test("parseQuarter returns null for invalid format", () => {
  assert.equal(parseQuarter("2026-Q1"), null);
  assert.equal(parseQuarter("Quarter 1"), null);
  assert.equal(parseQuarter(""), null);
  assert.equal(parseQuarter(null), null);
});

// Quarter end date tests
test("quarterEndDate returns March 31 for Q1", () => {
  const result = quarterEndDate(1, 2026);
  assert.equal(result, "2026-03-31");
});

test("quarterEndDate returns June 30 for Q2", () => {
  const result = quarterEndDate(2, 2026);
  assert.equal(result, "2026-06-30");
});

test("quarterEndDate returns September 30 for Q3", () => {
  const result = quarterEndDate(3, 2026);
  assert.equal(result, "2026-09-30");
});

test("quarterEndDate returns December 31 for Q4", () => {
  const result = quarterEndDate(4, 2026);
  assert.equal(result, "2026-12-31");
});

test("quarterEndDate returns null for invalid quarter", () => {
  assert.equal(quarterEndDate(0, 2026), null);
  assert.equal(quarterEndDate(5, 2026), null);
});

// Payload building tests
test("buildGoalPayload includes frequency when measure_type is frequency", () => {
  const payload = buildGoalPayload({
    title: "Test Goal",
    measure_type: "frequency",
    frequency: 3,
    duration_minutes: 60,
    frequency_period: "week",
    success_threshold: 80,
    quarter: "Q1 2026",
    due_date: "2026-03-31",
    tags: ["test"],
    habit_ids: [1, 2],
  });

  assert.equal(payload.frequency, 3);
  assert.equal(payload.duration_minutes, null);
  assert.equal(payload.measure_type, "frequency");
});

test("buildGoalPayload includes duration_minutes when measure_type is duration", () => {
  const payload = buildGoalPayload({
    title: "Test Goal",
    measure_type: "duration",
    frequency: 3,
    duration_minutes: 60,
    frequency_period: "week",
    success_threshold: 80,
    quarter: "Q1 2026",
    due_date: "2026-03-31",
    tags: ["test"],
    habit_ids: [1, 2],
  });

  assert.equal(payload.frequency, null);
  assert.equal(payload.duration_minutes, 60);
  assert.equal(payload.measure_type, "duration");
});

test("buildGoalPayload omits due_date when empty", () => {
  const payload = buildGoalPayload({
    title: "Test Goal",
    measure_type: "frequency",
    frequency: 3,
    duration_minutes: null,
    frequency_period: "week",
    success_threshold: 80,
    quarter: "Q1 2026",
    due_date: "",
    tags: [],
    habit_ids: [],
  });

  assert.equal(payload.due_date, null);
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { removeHabitFromMilestoneSelection } from "./milestoneSelection.js";

test("removeHabitFromMilestoneSelection removes habit and refreshes", () => {
  const selection = new Set([1, 2]);
  const calls = [];
  const removed = removeHabitFromMilestoneSelection({
    selection,
    habitId: 2,
    onRefreshOptions: () => calls.push("options"),
    onRefreshChips: () => calls.push("chips"),
  });

  assert.equal(removed, true);
  assert.deepEqual(Array.from(selection), [1]);
  assert.deepEqual(calls, ["options", "chips"]);
});

test("removeHabitFromMilestoneSelection is no-op when habit missing", () => {
  const selection = new Set([1, 2]);
  const calls = [];
  const removed = removeHabitFromMilestoneSelection({
    selection,
    habitId: 3,
    onRefreshOptions: () => calls.push("options"),
    onRefreshChips: () => calls.push("chips"),
  });

  assert.equal(removed, false);
  assert.deepEqual(Array.from(selection), [1, 2]);
  assert.deepEqual(calls, []);
});

test("removeHabitFromMilestoneSelection handles null selection", () => {
  const removed = removeHabitFromMilestoneSelection({
    selection: null,
    habitId: 1,
    onRefreshOptions: () => {},
    onRefreshChips: () => {},
  });

  assert.equal(removed, false);
});

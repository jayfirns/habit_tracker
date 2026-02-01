import assert from "node:assert/strict";
import { test } from "node:test";
import { removeHabitFromGoalSelection } from "./goalSelection.js";

test("removeHabitFromGoalSelection removes habit and refreshes", () => {
  const selection = new Set([1, 2]);
  const calls = [];
  const removed = removeHabitFromGoalSelection({
    selection,
    habitId: 2,
    onRefreshOptions: () => calls.push("options"),
    onRefreshChips: () => calls.push("chips"),
  });

  assert.equal(removed, true);
  assert.deepEqual(Array.from(selection), [1]);
  assert.deepEqual(calls, ["options", "chips"]);
});

test("removeHabitFromGoalSelection is no-op when habit missing", () => {
  const selection = new Set([1, 2]);
  const calls = [];
  const removed = removeHabitFromGoalSelection({
    selection,
    habitId: 3,
    onRefreshOptions: () => calls.push("options"),
    onRefreshChips: () => calls.push("chips"),
  });

  assert.equal(removed, false);
  assert.deepEqual(Array.from(selection), [1, 2]);
  assert.deepEqual(calls, []);
});

test("removeHabitFromGoalSelection handles null selection", () => {
  const removed = removeHabitFromGoalSelection({
    selection: null,
    habitId: 1,
    onRefreshOptions: () => {},
    onRefreshChips: () => {},
  });

  assert.equal(removed, false);
});

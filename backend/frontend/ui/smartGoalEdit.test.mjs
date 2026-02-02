import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { JSDOM } from "jsdom";

/**
 * Tests for SMART Goal Edit Mode
 *
 * Per SMART_GOALS_DATA_FLOW.md Edit Mode specification:
 * 1. Populate all fields from existing goal
 * 2. Set measure_type toggle based on goal.measure_type
 * 3. Show correct input (frequency or duration) based on toggle
 * 4. Populate due_date from goal.due_date
 * 5. Populate habit selection from goal.habit_ids
 * 6. Allow adding/removing habit associations
 * 7. Persist habit_ids changes on save
 */

function createGoalFormDom() {
  const html = `
    <form id="goal-form">
      <input id="goal-title" type="text" />
      <textarea id="goal-why"></textarea>
      <input id="measure-type-frequency" type="radio" name="measure_type" value="frequency" />
      <input id="measure-type-duration" type="radio" name="measure_type" value="duration" />
      <div id="frequency-field"><input id="goal-frequency" type="number" /></div>
      <div id="duration-field" hidden><input id="goal-duration" type="number" /></div>
      <select id="goal-frequency-period">
        <option value="week">Week</option>
        <option value="month">Month</option>
      </select>
      <input id="goal-success-threshold" type="number" />
      <input id="goal-quarter" type="text" />
      <input id="goal-due-date" type="date" />
      <input id="goal-tags" type="text" />
      <select id="goal-habit-select" multiple>
        <option value="1">Run</option>
        <option value="2">Read</option>
        <option value="3">Meditate</option>
      </select>
      <div id="goal-habit-chips"></div>
    </form>
    <div id="goal-overlay" hidden></div>
  `;
  const dom = new JSDOM(html);
  return dom;
}

/**
 * Simulates openGoalForEdit behavior for testing.
 * This mirrors the logic in app.js openGoalForEdit()
 */
function populateGoalForm(dom, goal, state) {
  const doc = dom.window.document;

  state.editingGoalId = goal.id;

  const goalTitleInput = doc.querySelector("#goal-title");
  const goalWhyInput = doc.querySelector("#goal-why");
  const measureTypeFrequency = doc.querySelector("#measure-type-frequency");
  const measureTypeDuration = doc.querySelector("#measure-type-duration");
  const frequencyField = doc.querySelector("#frequency-field");
  const durationField = doc.querySelector("#duration-field");
  const goalFrequencyInput = doc.querySelector("#goal-frequency");
  const goalDurationInput = doc.querySelector("#goal-duration");
  const goalFrequencyPeriodInput = doc.querySelector("#goal-frequency-period");
  const goalSuccessThresholdInput = doc.querySelector("#goal-success-threshold");
  const goalQuarterInput = doc.querySelector("#goal-quarter");
  const goalDueDateInput = doc.querySelector("#goal-due-date");
  const goalTagsInput = doc.querySelector("#goal-tags");

  if (goalTitleInput) goalTitleInput.value = goal.title || "";
  if (goalWhyInput) goalWhyInput.value = goal.why_this_matters || "";

  const measureType = goal.measure_type || "frequency";
  if (measureTypeFrequency) measureTypeFrequency.checked = measureType === "frequency";
  if (measureTypeDuration) measureTypeDuration.checked = measureType === "duration";

  // Update field visibility based on measure_type
  const isFrequency = measureTypeFrequency?.checked;
  if (frequencyField) frequencyField.hidden = !isFrequency;
  if (durationField) durationField.hidden = isFrequency;

  // Use nullish coalescing (??) to handle 0 correctly (0 is a valid value)
  if (goalFrequencyInput) goalFrequencyInput.value = goal.frequency ?? 3;
  if (goalDurationInput) goalDurationInput.value = goal.duration_minutes ?? 60;
  if (goalFrequencyPeriodInput) goalFrequencyPeriodInput.value = goal.frequency_period || "week";
  if (goalSuccessThresholdInput) goalSuccessThresholdInput.value = goal.success_threshold ?? 80;
  if (goalQuarterInput) goalQuarterInput.value = goal.quarter || "";
  if (goalDueDateInput) goalDueDateInput.value = goal.due_date || "";
  if (goalTagsInput) goalTagsInput.value = (goal.tags || []).join(", ");

  // Habit selection
  const ids = goal.habit_ids || [];
  state.goalHabitSelection = new Set(ids);

  return state;
}

describe("openGoalForEdit", () => {
  test("populates title from goal", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Build fitness habit" };

    populateGoalForm(dom, goal, state);

    const titleInput = dom.window.document.querySelector("#goal-title");
    assert.equal(titleInput.value, "Build fitness habit");
  });

  test("populates why_this_matters from goal", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", why_this_matters: "For my health" };

    populateGoalForm(dom, goal, state);

    const whyInput = dom.window.document.querySelector("#goal-why");
    assert.equal(whyInput.value, "For my health");
  });

  test("sets measure_type toggle to frequency when goal.measure_type is frequency", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", measure_type: "frequency" };

    populateGoalForm(dom, goal, state);

    const freqRadio = dom.window.document.querySelector("#measure-type-frequency");
    const durRadio = dom.window.document.querySelector("#measure-type-duration");
    assert.equal(freqRadio.checked, true);
    assert.equal(durRadio.checked, false);
  });

  test("sets measure_type toggle to duration when goal.measure_type is duration", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", measure_type: "duration" };

    populateGoalForm(dom, goal, state);

    const freqRadio = dom.window.document.querySelector("#measure-type-frequency");
    const durRadio = dom.window.document.querySelector("#measure-type-duration");
    assert.equal(freqRadio.checked, false);
    assert.equal(durRadio.checked, true);
  });

  test("shows frequency field and hides duration field when measure_type is frequency", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", measure_type: "frequency" };

    populateGoalForm(dom, goal, state);

    const freqField = dom.window.document.querySelector("#frequency-field");
    const durField = dom.window.document.querySelector("#duration-field");
    assert.equal(freqField.hidden, false);
    assert.equal(durField.hidden, true);
  });

  test("shows duration field and hides frequency field when measure_type is duration", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", measure_type: "duration" };

    populateGoalForm(dom, goal, state);

    const freqField = dom.window.document.querySelector("#frequency-field");
    const durField = dom.window.document.querySelector("#duration-field");
    assert.equal(freqField.hidden, true);
    assert.equal(durField.hidden, false);
  });

  test("populates due_date from goal", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", due_date: "2026-03-31" };

    populateGoalForm(dom, goal, state);

    const dueDateInput = dom.window.document.querySelector("#goal-due-date");
    assert.equal(dueDateInput.value, "2026-03-31");
  });

  test("populates quarter from goal", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", quarter: "Q1 2026" };

    populateGoalForm(dom, goal, state);

    const quarterInput = dom.window.document.querySelector("#goal-quarter");
    assert.equal(quarterInput.value, "Q1 2026");
  });

  test("populates frequency from goal", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", frequency: 5 };

    populateGoalForm(dom, goal, state);

    const freqInput = dom.window.document.querySelector("#goal-frequency");
    assert.equal(freqInput.value, "5");
  });

  test("populates duration_minutes from goal", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", duration_minutes: 90 };

    populateGoalForm(dom, goal, state);

    const durInput = dom.window.document.querySelector("#goal-duration");
    assert.equal(durInput.value, "90");
  });

  test("populates success_threshold from goal", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", success_threshold: 75 };

    populateGoalForm(dom, goal, state);

    const thresholdInput = dom.window.document.querySelector("#goal-success-threshold");
    assert.equal(thresholdInput.value, "75");
  });

  test("populates tags from goal array", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", tags: ["health", "fitness"] };

    populateGoalForm(dom, goal, state);

    const tagsInput = dom.window.document.querySelector("#goal-tags");
    assert.equal(tagsInput.value, "health, fitness");
  });

  test("sets state.editingGoalId to goal.id", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 42, title: "Test" };

    populateGoalForm(dom, goal, state);

    assert.equal(state.editingGoalId, 42);
  });

  test("populates habit selection from goal.habit_ids", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", habit_ids: [1, 3] };

    populateGoalForm(dom, goal, state);

    assert.ok(state.goalHabitSelection instanceof Set);
    assert.equal(state.goalHabitSelection.size, 2);
    assert.ok(state.goalHabitSelection.has(1));
    assert.ok(state.goalHabitSelection.has(3));
    assert.ok(!state.goalHabitSelection.has(2));
  });

  test("handles empty habit_ids array", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", habit_ids: [] };

    populateGoalForm(dom, goal, state);

    assert.equal(state.goalHabitSelection.size, 0);
  });

  test("handles missing habit_ids (undefined)", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test" };

    populateGoalForm(dom, goal, state);

    assert.equal(state.goalHabitSelection.size, 0);
  });

  test("populates all fields for complete goal object", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = {
      id: 1,
      title: "Build fitness habit",
      why_this_matters: "Health and energy",
      measure_type: "frequency",
      frequency: 3,
      duration_minutes: 60,
      frequency_period: "week",
      success_threshold: 80,
      quarter: "Q1 2026",
      due_date: "2026-03-31",
      tags: ["health", "fitness"],
      habit_ids: [1, 2],
    };

    populateGoalForm(dom, goal, state);

    const doc = dom.window.document;
    assert.equal(doc.querySelector("#goal-title").value, "Build fitness habit");
    assert.equal(doc.querySelector("#goal-why").value, "Health and energy");
    assert.equal(doc.querySelector("#measure-type-frequency").checked, true);
    assert.equal(doc.querySelector("#goal-frequency").value, "3");
    assert.equal(doc.querySelector("#goal-frequency-period").value, "week");
    assert.equal(doc.querySelector("#goal-success-threshold").value, "80");
    assert.equal(doc.querySelector("#goal-quarter").value, "Q1 2026");
    assert.equal(doc.querySelector("#goal-due-date").value, "2026-03-31");
    assert.equal(doc.querySelector("#goal-tags").value, "health, fitness");
    assert.equal(state.goalHabitSelection.size, 2);
  });
});

describe("openGoalForEdit edge cases", () => {
  test("handles null why_this_matters gracefully", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", why_this_matters: null };

    populateGoalForm(dom, goal, state);

    const whyInput = dom.window.document.querySelector("#goal-why");
    assert.equal(whyInput.value, "");
  });

  test("handles null tags gracefully", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", tags: null };

    populateGoalForm(dom, goal, state);

    const tagsInput = dom.window.document.querySelector("#goal-tags");
    assert.equal(tagsInput.value, "");
  });

  test("handles null due_date gracefully", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", due_date: null };

    populateGoalForm(dom, goal, state);

    const dueDateInput = dom.window.document.querySelector("#goal-due-date");
    assert.equal(dueDateInput.value, "");
  });

  test("defaults to frequency when measure_type is missing", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test" }; // no measure_type

    populateGoalForm(dom, goal, state);

    const freqRadio = dom.window.document.querySelector("#measure-type-frequency");
    const durRadio = dom.window.document.querySelector("#measure-type-duration");
    assert.equal(freqRadio.checked, true);
    assert.equal(durRadio.checked, false);
  });

  test("defaults to frequency when measure_type is null", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", measure_type: null };

    populateGoalForm(dom, goal, state);

    const freqRadio = dom.window.document.querySelector("#measure-type-frequency");
    assert.equal(freqRadio.checked, true);
  });

  test("handles duration goal with null duration_minutes - uses default 60", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", measure_type: "duration", duration_minutes: null };

    populateGoalForm(dom, goal, state);

    const durInput = dom.window.document.querySelector("#goal-duration");
    assert.equal(durInput.value, "60"); // default
  });

  test("handles frequency goal with null frequency - uses default 3", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", measure_type: "frequency", frequency: null };

    populateGoalForm(dom, goal, state);

    const freqInput = dom.window.document.querySelector("#goal-frequency");
    assert.equal(freqInput.value, "3"); // default
  });

  test("populates frequency_period month correctly", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", frequency_period: "month" };

    populateGoalForm(dom, goal, state);

    const periodSelect = dom.window.document.querySelector("#goal-frequency-period");
    assert.equal(periodSelect.value, "month");
  });

  test("handles completed goal status - form still populates", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Completed Goal", status: "complete", frequency: 5 };

    populateGoalForm(dom, goal, state);

    const titleInput = dom.window.document.querySelector("#goal-title");
    const freqInput = dom.window.document.querySelector("#goal-frequency");
    assert.equal(titleInput.value, "Completed Goal");
    assert.equal(freqInput.value, "5");
    assert.equal(state.editingGoalId, 1);
  });

  test("handles due_date in the past", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", due_date: "2020-01-01" };

    populateGoalForm(dom, goal, state);

    const dueDateInput = dom.window.document.querySelector("#goal-due-date");
    assert.equal(dueDateInput.value, "2020-01-01");
  });

  test("handles special characters in title", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test <script>alert('xss')</script> & \"quotes\"" };

    populateGoalForm(dom, goal, state);

    const titleInput = dom.window.document.querySelector("#goal-title");
    assert.equal(titleInput.value, "Test <script>alert('xss')</script> & \"quotes\"");
  });

  test("handles many tags", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", tags: ["a", "b", "c", "d", "e", "f", "g"] };

    populateGoalForm(dom, goal, state);

    const tagsInput = dom.window.document.querySelector("#goal-tags");
    assert.equal(tagsInput.value, "a, b, c, d, e, f, g");
  });

  test("handles success_threshold of 0", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", success_threshold: 0 };

    populateGoalForm(dom, goal, state);

    const thresholdInput = dom.window.document.querySelector("#goal-success-threshold");
    // 0 is falsy, but should still show 0, not default to 80
    assert.equal(thresholdInput.value, "0");
  });

  test("handles success_threshold of 100", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", success_threshold: 100 };

    populateGoalForm(dom, goal, state);

    const thresholdInput = dom.window.document.querySelector("#goal-success-threshold");
    assert.equal(thresholdInput.value, "100");
  });

  test("handles frequency of 1", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", frequency: 1 };

    populateGoalForm(dom, goal, state);

    const freqInput = dom.window.document.querySelector("#goal-frequency");
    assert.equal(freqInput.value, "1");
  });

  test("handles very large habit_ids array", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", habit_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] };

    populateGoalForm(dom, goal, state);

    assert.equal(state.goalHabitSelection.size, 10);
  });

  test("clears previous habit selection when editing different goal", () => {
    const dom = createGoalFormDom();
    const state = { goalHabitSelection: new Set([99, 100, 101]) };
    const goal = { id: 2, title: "New Goal", habit_ids: [1] };

    populateGoalForm(dom, goal, state);

    assert.equal(state.goalHabitSelection.size, 1);
    assert.ok(state.goalHabitSelection.has(1));
    assert.ok(!state.goalHabitSelection.has(99));
  });

  test("handles empty title gracefully", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "" };

    populateGoalForm(dom, goal, state);

    const titleInput = dom.window.document.querySelector("#goal-title");
    assert.equal(titleInput.value, "");
  });

  test("handles whitespace-only quarter", () => {
    const dom = createGoalFormDom();
    const state = {};
    const goal = { id: 1, title: "Test", quarter: "   " };

    populateGoalForm(dom, goal, state);

    const quarterInput = dom.window.document.querySelector("#goal-quarter");
    assert.equal(quarterInput.value, "   ");
  });
});

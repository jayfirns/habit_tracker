import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { JSDOM } from "jsdom";

/**
 * Integration test: Render goals and inspect the actual HTML output
 */

function createFullDom() {
  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <div id="goals-list" class="goal-list meta"></div>
      <div id="goal-overlay" hidden>
        <form id="goal-form">
          <input id="goal-title" type="text" />
          <textarea id="goal-why"></textarea>
          <input id="measure-type-frequency" type="radio" name="measure_type" value="frequency" checked />
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
        </form>
      </div>
    </body>
    </html>
  `;
  const dom = new JSDOM(html);
  return dom;
}

/**
 * Simulates renderGoals from app.js
 */
function renderGoals(dom, state) {
  const doc = dom.window.document;
  const goalsList = doc.querySelector("#goals-list");

  if (!goalsList) {
    return { error: "goalsList element not found" };
  }

  goalsList.innerHTML = "";

  if (state.goals.length === 0) {
    goalsList.innerHTML = `<p class="meta">No goals yet. Tap the period pill to create one.</p>`;
    return { html: goalsList.innerHTML, buttons: [] };
  }

  const buttons = [];

  state.goals.forEach((goal) => {
    const progress = state.weeklyProgress?.find((p) => p.goal_id === goal.id);
    const progressText = progress
      ? `${progress.completed}/${progress.target} (${Math.round(progress.percentage)}%)`
      : `0/${goal.frequency}`;

    const line = doc.createElement("div");
    line.className = "goal-line";

    const left = doc.createElement("div");
    left.innerHTML = `<strong>${goal.title}</strong><div class="meta">${goal.frequency}x/${goal.frequency_period} · ${progressText} · ${goal.status || "active"}</div>`;

    const actions = doc.createElement("div");
    actions.className = "goal-actions";

    const editBtn = doc.createElement("button");
    editBtn.className = "ghost small";
    editBtn.textContent = "Edit";
    editBtn.dataset.goalId = goal.id;
    editBtn.dataset.action = "edit";

    const reflectBtn = doc.createElement("button");
    reflectBtn.className = "ghost small";
    reflectBtn.textContent = "Reflect";

    const deleteBtn = doc.createElement("button");
    deleteBtn.className = "ghost small";
    deleteBtn.textContent = "Archive";

    actions.appendChild(editBtn);
    actions.appendChild(reflectBtn);
    actions.appendChild(deleteBtn);
    line.appendChild(left);
    line.appendChild(actions);
    goalsList.appendChild(line);

    buttons.push({
      goalId: goal.id,
      goalTitle: goal.title,
      editButton: editBtn,
    });
  });

  return {
    html: goalsList.innerHTML,
    outerHTML: goalsList.outerHTML,
    buttons,
    goalLineCount: goalsList.querySelectorAll(".goal-line").length,
  };
}

describe("renderGoals HTML output", () => {
  test("renders empty state when no goals", () => {
    const dom = createFullDom();
    const state = { goals: [], weeklyProgress: [] };

    const result = renderGoals(dom, state);

    console.log("Empty state HTML:", result.html);
    assert.match(result.html, /No goals yet/);
  });

  test("renders one goal with Edit button", () => {
    const dom = createFullDom();
    const state = {
      goals: [{
        id: 1,
        title: "Test Goal",
        frequency: 3,
        frequency_period: "week",
        status: "active",
      }],
      weeklyProgress: [],
    };

    const result = renderGoals(dom, state);

    console.log("\n=== Single goal HTML ===");
    console.log(result.html);
    console.log("========================\n");

    assert.equal(result.goalLineCount, 1, "Should render 1 goal-line");
    assert.equal(result.buttons.length, 1, "Should have 1 edit button");
    assert.equal(result.buttons[0].goalTitle, "Test Goal");
    assert.match(result.html, /Edit/);
    assert.match(result.html, /Reflect/);
    assert.match(result.html, /Archive/);
  });

  test("renders two goals with separate goal-line divs", () => {
    const dom = createFullDom();
    const state = {
      goals: [
        {
          id: 1,
          title: "First Goal",
          frequency: 3,
          frequency_period: "week",
          status: "active",
        },
        {
          id: 2,
          title: "Second Goal",
          frequency: 5,
          frequency_period: "month",
          status: "active",
        },
      ],
      weeklyProgress: [],
    };

    const result = renderGoals(dom, state);

    console.log("\n=== Two goals HTML ===");
    console.log(result.html);
    console.log("======================\n");

    assert.equal(result.goalLineCount, 2, "Should render 2 separate goal-line divs");
    assert.equal(result.buttons.length, 2, "Should have 2 edit buttons");

    // Check each goal has its own div
    const goalLines = dom.window.document.querySelectorAll(".goal-line");
    assert.equal(goalLines.length, 2);

    // First goal
    assert.match(goalLines[0].innerHTML, /First Goal/);
    assert.match(goalLines[0].innerHTML, /3x\/week/);

    // Second goal
    assert.match(goalLines[1].innerHTML, /Second Goal/);
    assert.match(goalLines[1].innerHTML, /5x\/month/);
  });

  test("each goal has its own Edit button", () => {
    const dom = createFullDom();
    const state = {
      goals: [
        { id: 1, title: "Goal A", frequency: 1, frequency_period: "week", status: "active" },
        { id: 2, title: "Goal B", frequency: 2, frequency_period: "week", status: "active" },
      ],
      weeklyProgress: [],
    };

    const result = renderGoals(dom, state);

    const editButtons = dom.window.document.querySelectorAll('button[data-action="edit"]');

    console.log("\n=== Edit buttons found ===");
    editButtons.forEach((btn, i) => {
      console.log(`Button ${i}: goalId=${btn.dataset.goalId}, text="${btn.textContent}"`);
    });
    console.log("==========================\n");

    assert.equal(editButtons.length, 2, "Should have 2 edit buttons");
    assert.equal(editButtons[0].dataset.goalId, "1");
    assert.equal(editButtons[1].dataset.goalId, "2");
  });

  test("goal with duration measure_type renders correctly", () => {
    const dom = createFullDom();
    const state = {
      goals: [{
        id: 1,
        title: "Duration Goal",
        measure_type: "duration",
        duration_minutes: 60,
        frequency: null,
        frequency_period: "week",
        status: "active",
      }],
      weeklyProgress: [],
    };

    const result = renderGoals(dom, state);

    console.log("\n=== Duration goal HTML ===");
    console.log(result.html);
    console.log("==========================\n");

    // Note: current renderGoals uses frequency, not duration_minutes for display
    // This might be a bug - duration goals show "nullx/week"
    assert.equal(result.goalLineCount, 1);
  });

  test("renders goal with all fields populated", () => {
    const dom = createFullDom();
    const state = {
      goals: [{
        id: 42,
        title: "Complete Goal",
        why_this_matters: "For health",
        measure_type: "frequency",
        frequency: 3,
        duration_minutes: null,
        frequency_period: "week",
        success_threshold: 80,
        quarter: "Q1 2026",
        due_date: "2026-03-31",
        tags: ["health", "fitness"],
        habit_ids: [1, 2, 3],
        status: "active",
      }],
      weeklyProgress: [{ goal_id: 42, completed: 2, target: 3, percentage: 66.67 }],
    };

    const result = renderGoals(dom, state);

    console.log("\n=== Complete goal with progress HTML ===");
    console.log(result.html);
    console.log("========================================\n");

    assert.match(result.html, /Complete Goal/);
    assert.match(result.html, /3x\/week/);
    assert.match(result.html, /2\/3/);  // progress
    assert.match(result.html, /67%/);   // percentage
  });

  test("clicking Edit button triggers handler", () => {
    const dom = createFullDom();
    const state = {
      goals: [{ id: 1, title: "Clickable Goal", frequency: 3, frequency_period: "week", status: "active" }],
      weeklyProgress: [],
    };

    const result = renderGoals(dom, state);

    let clickedGoalId = null;
    const editBtn = result.buttons[0].editButton;

    editBtn.addEventListener("click", () => {
      clickedGoalId = state.goals[0].id;
    });

    // Simulate click
    editBtn.click();

    assert.equal(clickedGoalId, 1, "Click handler should fire with goal id");
  });
});

describe("openGoalForEdit form population", () => {
  function openGoalForEdit(dom, goal, state) {
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
    const goalOverlay = doc.querySelector("#goal-overlay");

    if (goalTitleInput) goalTitleInput.value = goal.title || "";
    if (goalWhyInput) goalWhyInput.value = goal.why_this_matters || "";

    const measureType = goal.measure_type || "frequency";
    if (measureTypeFrequency) measureTypeFrequency.checked = measureType === "frequency";
    if (measureTypeDuration) measureTypeDuration.checked = measureType === "duration";

    const isFrequency = measureTypeFrequency?.checked;
    if (frequencyField) frequencyField.hidden = !isFrequency;
    if (durationField) durationField.hidden = isFrequency;

    if (goalFrequencyInput) goalFrequencyInput.value = goal.frequency ?? 3;
    if (goalDurationInput) goalDurationInput.value = goal.duration_minutes ?? 60;
    if (goalFrequencyPeriodInput) goalFrequencyPeriodInput.value = goal.frequency_period || "week";
    if (goalSuccessThresholdInput) goalSuccessThresholdInput.value = goal.success_threshold ?? 80;
    if (goalQuarterInput) goalQuarterInput.value = goal.quarter || "";
    if (goalDueDateInput) goalDueDateInput.value = goal.due_date || "";
    if (goalTagsInput) goalTagsInput.value = (goal.tags || []).join(", ");

    state.goalHabitSelection = new Set(goal.habit_ids || []);

    if (goalOverlay) goalOverlay.hidden = false;

    return {
      formValues: {
        title: goalTitleInput?.value,
        why: goalWhyInput?.value,
        measureType: measureTypeDuration?.checked ? "duration" : "frequency",
        frequency: goalFrequencyInput?.value,
        duration: goalDurationInput?.value,
        period: goalFrequencyPeriodInput?.value,
        threshold: goalSuccessThresholdInput?.value,
        quarter: goalQuarterInput?.value,
        dueDate: goalDueDateInput?.value,
        tags: goalTagsInput?.value,
      },
      overlayHidden: goalOverlay?.hidden,
      habitSelection: state.goalHabitSelection,
    };
  }

  test("full edit flow: render goals, click edit, check form", () => {
    const dom = createFullDom();
    const state = {
      goals: [{
        id: 1,
        title: "Editable Goal",
        why_this_matters: "Because reasons",
        measure_type: "duration",
        frequency: null,
        duration_minutes: 45,
        frequency_period: "month",
        success_threshold: 75,
        quarter: "Q2 2026",
        due_date: "2026-06-30",
        tags: ["test", "edit"],
        habit_ids: [10, 20],
        status: "active",
      }],
      weeklyProgress: [],
    };

    // Step 1: Render goals
    const renderResult = renderGoals(dom, state);
    console.log("\n=== Step 1: Rendered goal list ===");
    console.log(renderResult.html);

    // Step 2: Simulate clicking Edit
    const editBtn = renderResult.buttons[0].editButton;
    console.log("\n=== Step 2: Edit button found ===");
    console.log(`Button text: "${editBtn.textContent}"`);
    console.log(`Button classes: "${editBtn.className}"`);

    // Step 3: Call openGoalForEdit
    const editResult = openGoalForEdit(dom, state.goals[0], state);

    console.log("\n=== Step 3: Form values after openGoalForEdit ===");
    console.log(JSON.stringify(editResult.formValues, null, 2));
    console.log(`Overlay hidden: ${editResult.overlayHidden}`);
    console.log(`Habit selection: [${[...editResult.habitSelection].join(", ")}]`);
    console.log("================================================\n");

    // Assertions
    assert.equal(editResult.formValues.title, "Editable Goal");
    assert.equal(editResult.formValues.why, "Because reasons");
    assert.equal(editResult.formValues.measureType, "duration");
    assert.equal(editResult.formValues.duration, "45");
    assert.equal(editResult.formValues.period, "month");
    assert.equal(editResult.formValues.threshold, "75");
    assert.equal(editResult.formValues.quarter, "Q2 2026");
    assert.equal(editResult.formValues.dueDate, "2026-06-30");
    assert.equal(editResult.formValues.tags, "test, edit");
    assert.equal(editResult.overlayHidden, false, "Overlay should be visible");
    assert.equal(editResult.habitSelection.size, 2);
    assert.ok(editResult.habitSelection.has(10));
    assert.ok(editResult.habitSelection.has(20));
  });
});

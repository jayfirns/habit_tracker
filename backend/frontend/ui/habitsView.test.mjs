import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { renderHabitsView } from "./habitsView.js";

function setupDom() {
  const dom = new JSDOM(`
    <div id="container"></div>
    <template id="habit-template">
      <div class="habit-card">
        <div class="js-name"></div>
        <div class="js-last"></div>
        <div class="js-streak"></div>
        <div class="js-completions"></div>
        <div class="js-id"></div>
        <div class="js-tag-row"></div>
        <input class="complete-date" />
        <input class="complete-note" />
        <button class="js-complete"></button>
        <button class="js-adjust-time"></button>
        <button class="js-timer-toggle"></button>
        <button class="js-delete"></button>
        <button class="js-edit"></button>
        <button class="js-toggle"></button>
      </div>
    </template>
  `);
  global.window = dom.window;
  global.document = dom.window.document;
  return {
    dom,
    container: dom.window.document.querySelector("#container"),
    template: dom.window.document.querySelector("#habit-template"),
  };
}

test("renderHabitsView wires delete button with habit id", () => {
  const { container, template } = setupDom();
  const habits = [
    {
      id: 7,
      name: "Read",
      category: "Growth",
      streak: 3,
      last_completed: "2024-01-01",
      tags: [],
      completions: [],
    },
  ];
  const calls = [];

  renderHabitsView({
    container,
    template,
    activeTagEl: null,
    streakSummaryEl: null,
    habits,
    filterTag: null,
    formatDate: (value) => value || "Never",
    todayValue: () => "2024-01-02",
    onFilterTag: () => {},
    onComplete: () => {},
    onAdjustTime: () => {},
    onToggleTimer: () => {},
    onDelete: (id) => calls.push(id),
    onEdit: () => {},
    refreshHabitTimeDisplay: () => {},
  });

  const deleteBtn = container.querySelector(".js-delete");
  assert.ok(deleteBtn, "delete button is rendered");
  deleteBtn.click();
  assert.deepEqual(calls, [7]);
});

test("renderHabitsView wires delete buttons for each habit", () => {
  const { container, template } = setupDom();
  const habits = [
    {
      id: 1,
      name: "Read",
      category: "Growth",
      streak: 1,
      last_completed: "2024-01-01",
      tags: [],
      completions: [],
    },
    {
      id: 2,
      name: "Run",
      category: "Health",
      streak: 0,
      last_completed: null,
      tags: ["cardio"],
      completions: [],
    },
  ];
  const calls = [];

  renderHabitsView({
    container,
    template,
    activeTagEl: null,
    streakSummaryEl: null,
    habits,
    filterTag: null,
    formatDate: (value) => value || "Never",
    todayValue: () => "2024-01-02",
    onFilterTag: () => {},
    onComplete: () => {},
    onAdjustTime: () => {},
    onToggleTimer: () => {},
    onDelete: (id) => calls.push(id),
    onEdit: () => {},
    refreshHabitTimeDisplay: () => {},
  });

  const deleteBtns = Array.from(container.querySelectorAll(".js-delete"));
  assert.equal(deleteBtns.length, 2);
  deleteBtns[0].click();
  deleteBtns[1].click();
  assert.deepEqual(calls, [1, 2]);
});

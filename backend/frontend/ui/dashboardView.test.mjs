import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { createDashboardView } from "./dashboardView.js";

function setupDom() {
  const dom = new JSDOM(`
    <div id="period-label"></div>
    <div id="period-prompt"></div>
    <ul id="period-actions"></ul>
    <div id="habit-count"></div>
    <div id="streak-summary-card"></div>
    <div id="milestone-count"></div>
    <div id="milestone-highlight"></div>
    <div id="milestone-habits-linked"></div>
    <div id="milestone-habit-coverage"></div>
    <div id="milestone-due-count"></div>
    <div id="milestone-due-label"></div>
    <div id="milestone-scope-highlight"></div>
    <div id="milestone-next-step"></div>
    <div id="chart-total-pill"></div>
    <div id="chart-center-value"></div>
    <div id="chart-center-label"></div>
    <div id="category-chart"></div>
    <div id="category-legend"></div>
    <div id="energy-tabs"></div>
    <div id="energy-value-toggle"></div>
    <div id="time-summary-list"></div>
    <div id="time-workday-pill"></div>
    <div id="time-summary-percent"></div>
  `);
  global.window = dom.window;
  global.document = dom.window.document;
  return dom.window.document;
}

test("renderDashboard updates milestone insights and prompt copy", () => {
  // 1. Setup
  const doc = setupDom();
  const view = createDashboardView(
    {
      periodLabel: doc.querySelector("#period-label"),
      periodPrompt: doc.querySelector("#period-prompt"),
      periodActions: doc.querySelector("#period-actions"),
      habitCount: doc.querySelector("#habit-count"),
      streakSummaryCard: doc.querySelector("#streak-summary-card"),
      milestoneCountEl: doc.querySelector("#milestone-count"),
      milestoneHighlightEl: doc.querySelector("#milestone-highlight"),
      milestoneHabitsLinkedEl: doc.querySelector("#milestone-habits-linked"),
      milestoneHabitCoverageEl: doc.querySelector("#milestone-habit-coverage"),
      milestoneDueCountEl: doc.querySelector("#milestone-due-count"),
      milestoneDueLabelEl: doc.querySelector("#milestone-due-label"),
      milestoneScopeHighlightEl: doc.querySelector("#milestone-scope-highlight"),
      milestoneNextStepEl: doc.querySelector("#milestone-next-step"),
      chartTotalPill: doc.querySelector("#chart-total-pill"),
      chartCenterValue: doc.querySelector("#chart-center-value"),
      chartCenterLabel: doc.querySelector("#chart-center-label"),
      categoryChart: doc.querySelector("#category-chart"),
      categoryLegend: doc.querySelector("#category-legend"),
      energyTabs: doc.querySelector("#energy-tabs"),
      energyValueToggle: doc.querySelector("#energy-value-toggle"),
      timeSummaryList: doc.querySelector("#time-summary-list"),
      timeWorkdayPill: doc.querySelector("#time-workday-pill"),
      timeSummaryPercent: doc.querySelector("#time-summary-percent"),
    },
    {
      formatDate: () => "2025-01-15",
      formatMinutes: (value) => `${value}m`,
      computeWorkdayMinutes: () => ({ usedMinutes: 0, totalMinutes: 480 }),
      todayKey: () => "2025-01-15",
      getHabitMinutes: () => 0,
      getTodayFocusedMinutes: () => 0,
      collectHabitsWithTodayCompletions: () => [],
      latestCompletionNote: () => null,
    },
  );

  // 2. Act
  view.renderDashboard({
    now: new Date("2025-01-15T12:00:00Z"),
    habits: [{ id: 1, name: "Write", streak: 3 }],
    milestones: [
      { id: 1, title: "Publish", scope: "quarter", status: "active", habit_ids: [1] },
      { id: 2, title: "Archive", scope: "quarter", status: "complete", habit_ids: [] },
    ],
    reflections: [],
    workday: { start: "09:00", hours: 8, clockedOutAt: null, manualWorkedMinutes: null },
    timeLogs: {},
    activeTimers: {},
  });

  // 3. Assert
  assert.equal(doc.querySelector("#milestone-count").textContent, "1");
  assert.match(doc.querySelector("#milestone-scope-highlight").textContent, /milestones/);
  assert.match(doc.querySelector("#period-prompt").textContent, /milestones/);
  assert.match(doc.querySelector("#milestone-next-step").textContent, /milestone/);
});

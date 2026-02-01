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
    <div id="goal-count"></div>
    <div id="goal-highlight"></div>
    <div id="goal-habits-linked"></div>
    <div id="goal-habit-coverage"></div>
    <div id="goal-on-track-count"></div>
    <div id="goal-on-track-label"></div>
    <div id="goal-quarter-highlight"></div>
    <div id="goal-next-step"></div>
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

test("renderDashboard updates goal insights and prompt copy", () => {
  // 1. Setup
  const doc = setupDom();
  const view = createDashboardView(
    {
      periodLabel: doc.querySelector("#period-label"),
      periodPrompt: doc.querySelector("#period-prompt"),
      periodActions: doc.querySelector("#period-actions"),
      habitCount: doc.querySelector("#habit-count"),
      streakSummaryCard: doc.querySelector("#streak-summary-card"),
      goalCountEl: doc.querySelector("#goal-count"),
      goalHighlightEl: doc.querySelector("#goal-highlight"),
      goalHabitsLinkedEl: doc.querySelector("#goal-habits-linked"),
      goalHabitCoverageEl: doc.querySelector("#goal-habit-coverage"),
      goalOnTrackCountEl: doc.querySelector("#goal-on-track-count"),
      goalOnTrackLabelEl: doc.querySelector("#goal-on-track-label"),
      goalQuarterHighlightEl: doc.querySelector("#goal-quarter-highlight"),
      goalNextStepEl: doc.querySelector("#goal-next-step"),
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
      computeWorkdayMinutes: () => ({
        mode: "planned",
        clockState: "idle",
        plannedMinutes: 480,
        workedMinutes: 0,
        remainingMinutes: 480,
      }),
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
    goals: [
      { id: 1, title: "Publish", quarter: "Q1 2025", status: "active", frequency: 3, frequency_period: "week", habit_ids: [1] },
      { id: 2, title: "Archive", quarter: "Q1 2025", status: "complete", frequency: 1, frequency_period: "week", habit_ids: [] },
    ],
    weeklyProgress: [
      { goal_id: 1, title: "Publish", completed: 2, target: 3, percentage: 66.67, on_track: false },
    ],
    quarterlyPrompt: { quarter: "Q1 2025", message: "Q1 2025 in progress. 1 active goals." },
    reflections: [],
    workday: {
      plannedStart: "09:00",
      plannedMinutes: 480,
      clockInAt: null,
      clockOutAt: null,
      workedMinutesOverride: null,
    },
    timeLogs: {},
    activeTimers: {},
  });

  // 3. Assert
  assert.equal(doc.querySelector("#goal-count").textContent, "1");
  assert.match(doc.querySelector("#goal-quarter-highlight").textContent, /Q1 2025/);
  assert.match(doc.querySelector("#period-prompt").textContent, /Q1 2025/);
  assert.match(doc.querySelector("#goal-next-step").textContent, /goal/);
});

test("renderDashboard shows planned pill when plan exists", () => {
  // 1. Setup
  const doc = setupDom();
  const view = createDashboardView(
    {
      periodLabel: doc.querySelector("#period-label"),
      periodPrompt: doc.querySelector("#period-prompt"),
      periodActions: doc.querySelector("#period-actions"),
      habitCount: doc.querySelector("#habit-count"),
      streakSummaryCard: doc.querySelector("#streak-summary-card"),
      goalCountEl: doc.querySelector("#goal-count"),
      goalHighlightEl: doc.querySelector("#goal-highlight"),
      goalHabitsLinkedEl: doc.querySelector("#goal-habits-linked"),
      goalHabitCoverageEl: doc.querySelector("#goal-habit-coverage"),
      goalOnTrackCountEl: doc.querySelector("#goal-on-track-count"),
      goalOnTrackLabelEl: doc.querySelector("#goal-on-track-label"),
      goalQuarterHighlightEl: doc.querySelector("#goal-quarter-highlight"),
      goalNextStepEl: doc.querySelector("#goal-next-step"),
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
      computeWorkdayMinutes: () => ({
        mode: "planned",
        clockState: "idle",
        plannedMinutes: 480,
        workedMinutes: 0,
        remainingMinutes: 480,
      }),
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
    habits: [],
    goals: [],
    weeklyProgress: [],
    quarterlyPrompt: null,
    reflections: [],
    workday: {},
    timeLogs: {},
    activeTimers: {},
  });

  // 3. Assert
  assert.equal(doc.querySelector("#time-workday-pill").textContent, "Planned: 480m");
});

test("renderDashboard shows worked pill when clocked", () => {
  // 1. Setup
  const doc = setupDom();
  const view = createDashboardView(
    {
      periodLabel: doc.querySelector("#period-label"),
      periodPrompt: doc.querySelector("#period-prompt"),
      periodActions: doc.querySelector("#period-actions"),
      habitCount: doc.querySelector("#habit-count"),
      streakSummaryCard: doc.querySelector("#streak-summary-card"),
      goalCountEl: doc.querySelector("#goal-count"),
      goalHighlightEl: doc.querySelector("#goal-highlight"),
      goalHabitsLinkedEl: doc.querySelector("#goal-habits-linked"),
      goalHabitCoverageEl: doc.querySelector("#goal-habit-coverage"),
      goalOnTrackCountEl: doc.querySelector("#goal-on-track-count"),
      goalOnTrackLabelEl: doc.querySelector("#goal-on-track-label"),
      goalQuarterHighlightEl: doc.querySelector("#goal-quarter-highlight"),
      goalNextStepEl: doc.querySelector("#goal-next-step"),
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
      computeWorkdayMinutes: () => ({
        mode: "clocked",
        clockState: "completed",
        plannedMinutes: 480,
        workedMinutes: 210,
        remainingMinutes: 270,
      }),
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
    habits: [],
    goals: [],
    weeklyProgress: [],
    quarterlyPrompt: null,
    reflections: [],
    workday: {},
    timeLogs: {},
    activeTimers: {},
  });

  // 3. Assert
  assert.equal(doc.querySelector("#time-workday-pill").textContent, "Worked: 210m");
});

test("renderDashboard shows empty pill when no plan or clock", () => {
  // 1. Setup
  const doc = setupDom();
  const view = createDashboardView(
    {
      periodLabel: doc.querySelector("#period-label"),
      periodPrompt: doc.querySelector("#period-prompt"),
      periodActions: doc.querySelector("#period-actions"),
      habitCount: doc.querySelector("#habit-count"),
      streakSummaryCard: doc.querySelector("#streak-summary-card"),
      goalCountEl: doc.querySelector("#goal-count"),
      goalHighlightEl: doc.querySelector("#goal-highlight"),
      goalHabitsLinkedEl: doc.querySelector("#goal-habits-linked"),
      goalHabitCoverageEl: doc.querySelector("#goal-habit-coverage"),
      goalOnTrackCountEl: doc.querySelector("#goal-on-track-count"),
      goalOnTrackLabelEl: doc.querySelector("#goal-on-track-label"),
      goalQuarterHighlightEl: doc.querySelector("#goal-quarter-highlight"),
      goalNextStepEl: doc.querySelector("#goal-next-step"),
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
      computeWorkdayMinutes: () => ({
        mode: "empty",
        clockState: "idle",
        plannedMinutes: 0,
        workedMinutes: 0,
        remainingMinutes: null,
      }),
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
    habits: [],
    goals: [],
    weeklyProgress: [],
    quarterlyPrompt: null,
    reflections: [],
    workday: {},
    timeLogs: {},
    activeTimers: {},
  });

  // 3. Assert
  assert.equal(doc.querySelector("#time-workday-pill").textContent, "");
});

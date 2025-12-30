import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { createEnergyMixPanel } from "./energyMixPanel.js";

function setupPanel() {
  const dom = new JSDOM(`
    <div>
      <div class="chart-tabs">
        <button class="tab" data-chart-mode="pie"></button>
        <button class="tab" data-chart-mode="habit"></button>
        <button class="tab" data-chart-mode="grouped"></button>
      </div>
      <div class="chart-toggle">
        <button class="pill" data-value-mode="duration"></button>
        <button class="pill" data-value-mode="frequency"></button>
    </div>
      <div class="chart-container"></div>
      <div class="chart-updated"></div>
      <div class="chart-center">
        <div class="chart-center__value"></div>
        <div class="chart-center__label"></div>
      </div>
      <div class="chart-total-pill"></div>
      <div class="chart-legend"></div>
    </div>
  `);

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;

  const chartContainer = dom.window.document.querySelector(".chart-container");
  const chartCenterValue = dom.window.document.querySelector(".chart-center__value");
  const chartCenterLabel = dom.window.document.querySelector(".chart-center__label");
  const chartCenterContainer = dom.window.document.querySelector(".chart-center");
  const chartTotalPill = dom.window.document.querySelector(".chart-total-pill");
  const categoryLegend = dom.window.document.querySelector(".chart-legend");
  const tabsContainer = dom.window.document.querySelector(".chart-tabs");
  const valueToggleContainer = dom.window.document.querySelector(".chart-toggle");
  const chartUpdatedNote = dom.window.document.querySelector(".chart-updated");

  const panel = createEnergyMixPanel(
    {
      chartContainer,
      chartCenterValue,
      chartCenterLabel,
      chartCenterContainer,
      chartTotalPill,
      categoryLegend,
      tabsContainer,
      valueToggleContainer,
      chartUpdatedNote,
    },
    {
      formatMinutes: (v) => `${v}m`,
    },
  );

  return {
    dom,
    panel,
    chartContainer,
    chartCenterValue,
    chartCenterLabel,
    chartTotalPill,
    categoryLegend,
    tabsContainer,
    valueToggleContainer,
    chartUpdatedNote,
  };
}

const initialData = {
  habits: [
    { id: 1, name: "Alpha", category: "A", completions: [{}, {}] },
    { id: 2, name: "Beta", category: "B", completions: [{}] },
  ],
  timeLogs: {},
  activeTimers: {},
};

test("test_update_energy_mix_data_refreshes_chart", () => {
  const {
    panel,
    chartContainer,
    chartCenterValue,
    chartCenterLabel,
    chartTotalPill,
    tabsContainer,
    valueToggleContainer,
  } = setupPanel();

  panel.setChartMode("grouped");
  panel.setValueMode("frequency");
  panel.render(initialData);

  const updatedData = {
    habits: [
      { id: 1, name: "Alpha", category: "A", completions: [{}] },
      { id: 3, name: "Gamma", category: "C", completions: [{}] },
    ],
    timeLogs: {},
    activeTimers: {},
  };

  panel.updateEnergyMixData(updatedData);

  assert.equal(chartCenterValue.textContent, "2");
  assert.equal(chartCenterLabel.textContent, "sessions");
  assert.match(chartTotalPill.textContent, /2/);
  assert.ok(
    tabsContainer.querySelector('[data-chart-mode="grouped"]').classList.contains("active"),
  );
  assert.ok(
    valueToggleContainer.querySelector('[data-value-mode="frequency"]').classList.contains("active"),
  );
  assert.equal(chartContainer.querySelectorAll(".bar-group").length, 2);
});

test("test_update_energy_mix_data_with_empty_input_shows_empty_state", () => {
  const { panel, chartContainer, categoryLegend } = setupPanel();

  panel.render(initialData);
  panel.updateEnergyMixData({ habits: [], timeLogs: {}, activeTimers: {} });

  assert.match(chartContainer.textContent, /No data available/);
  assert.match(categoryLegend.textContent, /No data available/);
});

test("test_window_updateEnergyMixData_exposed_for_dev", () => {
  const { panel, chartCenterValue, chartContainer } = setupPanel();

  panel.render(initialData);
  const firstStamp = chartContainer.getAttribute("data-last-updated");

  assert.equal(typeof globalThis.updateEnergyMixData, "function");

  globalThis.updateEnergyMixData({
    habits: [{ id: 9, name: "Dev", category: "Debug", completions: [{}] }],
    timeLogs: {},
    activeTimers: {},
  });

  assert.equal(chartCenterValue.textContent, "1");
  const secondStamp = chartContainer.getAttribute("data-last-updated");
  assert.notEqual(firstStamp, secondStamp);
});

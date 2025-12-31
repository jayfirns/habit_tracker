import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { renderBarsDom, renderGroupedDom, renderPieDom } from "./energyMixPanel.js";

function setupDom() {
  const dom = new JSDOM(`<div id="chart"></div><div id="legend"></div>`);
  global.window = dom.window;
  global.document = dom.window.document;
  return {
    dom,
    chart: dom.window.document.querySelector("#chart"),
    legend: dom.window.document.querySelector("#legend"),
  };
}

test("renderPieDom draws segments and legend entries", () => {
  const { chart, legend } = setupDom();
  const series = [
    { label: "Focus", value: 40 },
    { label: "Health", value: 20 },
  ];
  const model = { valueMode: "duration" };

  renderPieDom({ categoryChart: chart, categoryLegend: legend }, series, 60, model, {
    formatValue: (v) => `${v}m`,
  });

  const circles = chart.querySelectorAll("svg circle");
  const legendItems = legend.querySelectorAll(".legend-item");
  assert.equal(circles.length, series.length + 1 /* background circle */);
  assert.equal(legendItems.length, series.length);
  assert.match(chart.innerHTML, /svg/);
});

test("renderBarsDom lays out bar rows with values", () => {
  const { chart, legend } = setupDom();
  const series = [
    { label: "Deep Work", value: 90 },
    { label: "Reading", value: 45 },
    { label: "Walk", value: 30 },
  ];
  const model = { valueMode: "duration", categorySeries: series };

  renderBarsDom({ categoryChart: chart, categoryLegend: legend }, series, model, {
    formatValue: (v) => `${v}m`,
  });

  const rows = chart.querySelectorAll(".bar-row");
  assert.equal(rows.length, series.length);
  assert.ok(rows[0].querySelector(".bar-row__fill").getAttribute("style").includes("width"));
  assert.equal(legend.querySelectorAll(".legend-item").length, series.length);
  const snapshot = chart.innerHTML.replace(/\s+/g, " ").trim();
  assert.match(snapshot, /bar-row__label/);
});

test("renderGroupedDom nests bars under category wrappers", () => {
  const { chart, legend } = setupDom();
  const groupedSeries = [
    {
      label: "Focus",
      value: 30,
      habits: [
        { label: "Write", value: 20 },
        { label: "Read", value: 10 },
      ],
    },
    {
      label: "Health",
      value: 15,
      habits: [{ label: "Stretch", value: 15 }],
    },
  ];
  const model = { valueMode: "frequency" };

  renderGroupedDom({ categoryChart: chart, categoryLegend: legend }, groupedSeries, model, {
    formatValue: (v) => `${v}`,
  });

  const groups = chart.querySelectorAll(".bar-group");
  const rows = chart.querySelectorAll(".bar-group .bar-row");
  assert.equal(groups.length, groupedSeries.length);
  assert.equal(rows.length, groupedSeries.reduce((sum, g) => sum + g.habits.length, 0));
  assert.match(chart.innerHTML, /bar-group__title/);
  assert.equal(legend.querySelectorAll(".legend-item").length, groupedSeries.length);
});

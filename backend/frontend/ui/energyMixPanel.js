const PALETTE = [
  "#ff6f61",
  "#36c2cf",
  "#8f7bff",
  "#ffd166",
  "#4ade80",
  "#f472b6",
  "#22d3ee",
  "#f97316",
];

export const CHART_MODES = ["pie", "habit", "grouped"];
export const VALUE_MODES = ["duration", "frequency"];

export const DEFAULT_MOCK_ENTRIES = [
  {
    habitId: "mock-1",
    habitName: "Deep Work",
    category: "Focus",
    durationMinutes: 90,
    sessionCount: 1,
    loggedAt: new Date().toISOString(),
  },
  {
    habitId: "mock-2",
    habitName: "Movement",
    category: "Health",
    durationMinutes: 45,
    sessionCount: 1,
    loggedAt: new Date().toISOString(),
  },
  {
    habitId: "mock-3",
    habitName: "Reading",
    category: "Growth",
    durationMinutes: 30,
    sessionCount: 2,
    loggedAt: new Date().toISOString(),
  },
];

export function coerceChartMode(mode) {
  return CHART_MODES.includes(mode) ? mode : "pie";
}

export function coerceValueMode(mode) {
  return VALUE_MODES.includes(mode) ? mode : "duration";
}

export function aggregateTimeLogs(timeLogs = {}, activeTimers = {}, now = new Date()) {
  const totals = {};
  Object.values(timeLogs || {}).forEach((dayLogs = {}) => {
    Object.entries(dayLogs).forEach(([habitId, minutes]) => {
      const key = String(habitId);
      totals[key] = (totals[key] || 0) + Math.max(0, minutes || 0);
    });
  });
  Object.entries(activeTimers || {}).forEach(([habitId, timer]) => {
    if (!timer?.start) return;
    const elapsedMinutes = Math.max(0, Math.floor((now - timer.start) / 60000));
    const key = String(habitId);
    totals[key] = (totals[key] || 0) + elapsedMinutes;
  });
  return totals;
}

export function normalizeEntries({
  habits = [],
  timeLogs = {},
  activeTimers = {},
  now = new Date(),
  mockEntries = DEFAULT_MOCK_ENTRIES,
}) {
  const totals = aggregateTimeLogs(timeLogs, activeTimers, now);
  const entries = habits
    .map((habit) => ({
      habitId: habit.id,
      name: habit.name || `Habit ${habit.id}`,
      category: habit.category || "Uncategorized",
      durationMinutes: totals[String(habit.id)] || 0,
      frequency: (habit.completions || []).length,
    }))
    .filter((entry) => entry.durationMinutes > 0 || entry.frequency > 0);

  if (entries.length || !mockEntries?.length) return entries;

  return mockEntries.map((entry, idx) => ({
    habitId: entry.habitId ?? `mock-${idx + 1}`,
    name: entry.habitName || entry.name || `Mock habit ${idx + 1}`,
    category: entry.category || "Mock",
    durationMinutes: entry.durationMinutes || entry.minutes || 0,
    frequency: entry.sessionCount || entry.frequency || 1,
  }));
}

function valueForEntry(entry, valueMode) {
  return valueMode === "frequency" ? entry.frequency : entry.durationMinutes;
}

export function buildCategorySeries(entries = [], valueMode = "duration") {
  const grouped = entries.reduce((acc, entry) => {
    const value = valueForEntry(entry, valueMode);
    const category = entry.category || "Uncategorized";
    acc[category] = (acc[category] || 0) + value;
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function buildHabitSeries(entries = [], valueMode = "duration") {
  return entries
    .map((entry) => ({
      label: entry.name,
      category: entry.category,
      value: valueForEntry(entry, valueMode),
      habitId: entry.habitId,
    }))
    .sort((a, b) => b.value - a.value);
}

export function buildGroupedSeries(entries = [], valueMode = "duration") {
  const grouped = {};
  buildHabitSeries(entries, valueMode).forEach((habit) => {
    const category = habit.category || "Uncategorized";
    if (!grouped[category]) {
      grouped[category] = { label: category, value: 0, habits: [] };
    }
    grouped[category].value += habit.value;
    grouped[category].habits.push(habit);
  });
  return Object.values(grouped)
    .map((group) => ({
      ...group,
      habits: group.habits.sort((a, b) => b.value - a.value),
    }))
    .sort((a, b) => b.value - a.value);
}

export function buildEnergyMixModel({
  habits = [],
  timeLogs = {},
  activeTimers = {},
  now = new Date(),
  mockEntries,
  chartMode = "pie",
  valueMode = "duration",
}) {
  const coercedChartMode = coerceChartMode(chartMode);
  const coercedValueMode = coerceValueMode(valueMode);
  const entries = normalizeEntries({ habits, timeLogs, activeTimers, now, mockEntries });
  const categorySeries = buildCategorySeries(entries, coercedValueMode);
  const habitSeries = buildHabitSeries(entries, coercedValueMode);
  const groupedSeries = buildGroupedSeries(entries, coercedValueMode);
  const total = habitSeries.reduce((sum, entry) => sum + entry.value, 0);

  return {
    entries,
    categorySeries,
    habitSeries,
    groupedSeries,
    total,
    chartMode: coercedChartMode,
    valueMode: coercedValueMode,
    hasData: entries.length > 0,
  };
}

export function renderLegendDom(
  categoryLegend,
  series,
  model,
  { formatValue = (value) => `${value}`, palette = PALETTE } = {},
) {
  if (!categoryLegend) return;
  categoryLegend.innerHTML = "";
  if (!series.length) {
    categoryLegend.innerHTML = `<p class="meta">No data yet. Log habits or use mock data to preview.</p>`;
    return;
  }
  series.forEach((item, idx) => {
    const legend = document.createElement("div");
    legend.className = "legend-item";
    legend.innerHTML = `
        <span class="legend-swatch"></span>
        <div class="legend-text">
          <span class="legend-title">${item.label}</span>
          <span class="meta">${formatValue(item.value)} ${
            model.valueMode === "duration" ? "focus" : "sessions"
          }</span>
        </div>
      `;
    const swatch = legend.querySelector(".legend-swatch");
    if (swatch) swatch.style.background = palette[idx % palette.length];
    categoryLegend.appendChild(legend);
  });
}

export function renderPieDom(
  { categoryChart, categoryLegend },
  series,
  total,
  model,
  { formatValue = (value) => `${value}`, palette = PALETTE } = {},
) {
  if (!categoryChart) return;
  categoryChart.innerHTML = "";
  categoryChart.classList.remove("bar-stack");
  categoryChart.classList.add("pie-chart");

  if (!series.length || total === 0) {
    categoryChart.innerHTML = `<p class="meta">Log completions or focus time to see your mix.</p>`;
    renderLegendDom(categoryLegend, [], model, { formatValue, palette });
    return;
  }

  const svgNS = "http://www.w3.org/2000/svg";
  const size = 220;
  const r = 90;
  const circumference = 2 * Math.PI * r;
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);

  const bgCircle = document.createElementNS(svgNS, "circle");
  bgCircle.setAttribute("cx", size / 2);
  bgCircle.setAttribute("cy", size / 2);
  bgCircle.setAttribute("r", r);
  bgCircle.setAttribute("fill", "none");
  bgCircle.setAttribute("stroke", "rgba(255,255,255,0.05)");
  bgCircle.setAttribute("stroke-width", "22");
  svg.appendChild(bgCircle);

  let offset = 0;

  series.forEach((item, idx) => {
    const share = item.value / Math.max(total, 1);
    const segment = Math.max(share * circumference, 2);
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", size / 2);
    circle.setAttribute("cy", size / 2);
    circle.setAttribute("r", r);
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", palette[idx % palette.length]);
    circle.setAttribute("stroke-width", "22");
    circle.setAttribute("stroke-dasharray", `${segment} ${circumference - segment}`);
    circle.setAttribute("stroke-dashoffset", `${-offset}`);
    circle.setAttribute("transform", `rotate(-90 ${size / 2} ${size / 2})`);
    circle.setAttribute("stroke-linecap", "butt");
    svg.appendChild(circle);
    offset += segment;
  });

  categoryChart.appendChild(svg);
  renderLegendDom(categoryLegend, series, model, { formatValue, palette });
}

export function renderBarsDom(
  { categoryChart, categoryLegend },
  series,
  model,
  { formatValue = (value) => `${value}`, palette = PALETTE } = {},
) {
  if (!categoryChart) return;
  categoryChart.innerHTML = "";
  categoryChart.classList.add("bar-stack");
  categoryChart.classList.remove("pie-chart");

  if (!series.length) {
    categoryChart.innerHTML = `<p class="meta">No chart data yet. Log some focus time to populate bars.</p>`;
    renderLegendDom(categoryLegend, [], model, { formatValue, palette });
    return;
  }

  const maxValue = Math.max(...series.map((item) => item.value), 1);
  const fragment = document.createDocumentFragment();

  series.forEach((item) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    const width = Math.max(6, Math.round((item.value / maxValue) * 100));
    row.innerHTML = `
        <div class="bar-row__label">${item.label}</div>
        <div class="bar-row__bar">
          <span class="bar-row__fill" style="width:${width}%"></span>
        </div>
        <div class="bar-row__value">${formatValue(item.value)}</div>
      `;
    fragment.appendChild(row);
  });

  categoryChart.appendChild(fragment);
  renderLegendDom(categoryLegend, model.categorySeries, model, { formatValue, palette });
}

export function renderGroupedDom(
  { categoryChart, categoryLegend },
  groupedSeries,
  model,
  { formatValue = (value) => `${value}`, palette = PALETTE } = {},
) {
  if (!categoryChart) return;
  categoryChart.innerHTML = "";
  categoryChart.classList.add("bar-stack");
  categoryChart.classList.remove("pie-chart");

  if (!groupedSeries.length) {
    categoryChart.innerHTML = `<p class="meta">Add habits with categories to compare them here.</p>`;
    renderLegendDom(categoryLegend, [], model, { formatValue, palette });
    return;
  }

  const maxValue = Math.max(...groupedSeries.map((group) => group.value), 1);
  const fragment = document.createDocumentFragment();

  groupedSeries.forEach((group) => {
    const wrapper = document.createElement("div");
    wrapper.className = "bar-group";
    wrapper.innerHTML = `<div class="bar-group__title">${group.label}</div>`;
    group.habits.forEach((habit) => {
      const width = Math.max(6, Math.round((habit.value / maxValue) * 100));
      const row = document.createElement("div");
      row.className = "bar-row";
      row.innerHTML = `
          <div class="bar-row__label meta">${habit.label}</div>
          <div class="bar-row__bar">
            <span class="bar-row__fill" style="width:${width}%"></span>
          </div>
          <div class="bar-row__value">${formatValue(habit.value)}</div>
        `;
      wrapper.appendChild(row);
    });
    fragment.appendChild(wrapper);
  });

  categoryChart.appendChild(fragment);
  renderLegendDom(categoryLegend, groupedSeries, model, { formatValue, palette });
}

export function createEnergyMixPanel(elements, helpers = {}) {
  const {
    chartTotalPill,
    chartCenterValue,
    chartCenterLabel,
    chartCenterContainer,
    categoryChart,
    categoryLegend,
    tabsContainer,
    valueToggleContainer,
  } = elements;
  const { formatMinutes = (value) => `${value}m` } = helpers;

  const state = {
    chartMode: "pie",
    valueMode: "duration",
    lastPayload: {},
  };
  const centerNode = chartCenterContainer || chartCenterLabel?.parentElement || chartCenterValue?.parentElement;

  if (tabsContainer) {
    tabsContainer.querySelectorAll("[data-chart-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.chartMode = coerceChartMode(btn.dataset.chartMode);
        render(state.lastPayload);
      });
    });
  }

  if (valueToggleContainer) {
    valueToggleContainer.querySelectorAll("[data-value-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.valueMode = coerceValueMode(btn.dataset.valueMode);
        render(state.lastPayload);
      });
    });
  }

  function formatValue(value) {
    return state.valueMode === "duration" ? formatMinutes(value) : `${value}`;
  }

  function updateControls(model) {
    if (tabsContainer) {
      tabsContainer.querySelectorAll("[data-chart-mode]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.chartMode === model.chartMode);
        btn.setAttribute("aria-selected", btn.dataset.chartMode === model.chartMode ? "true" : "false");
      });
    }
    if (valueToggleContainer) {
      valueToggleContainer.querySelectorAll("[data-value-mode]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.valueMode === model.valueMode);
        btn.setAttribute("aria-pressed", btn.dataset.valueMode === model.valueMode ? "true" : "false");
      });
    }
  }

  function updateTotals(total, model) {
    if (centerNode) {
      centerNode.classList.toggle("chart-center--inline", model.chartMode !== "pie");
    }
    const suffix = model.valueMode === "duration" ? "logged" : "sessions";
    if (chartCenterValue) {
      chartCenterValue.textContent = formatValue(total);
    }
    if (chartCenterLabel) {
      chartCenterLabel.textContent = model.valueMode === "duration" ? "minutes" : "sessions";
    }
    if (chartTotalPill) {
      chartTotalPill.textContent = `${formatValue(total)} ${suffix}`;
    }
  }

  function render(payload = {}) {
    state.lastPayload = payload;
    const model = buildEnergyMixModel({
      ...payload,
      chartMode: state.chartMode,
      valueMode: state.valueMode,
    });

    updateControls(model);
    updateTotals(model.total, model);

    if (model.chartMode === "pie") {
      renderPieDom({ categoryChart, categoryLegend }, model.categorySeries, model.total, model, {
        formatValue,
      });
    } else if (model.chartMode === "grouped") {
      renderGroupedDom({ categoryChart, categoryLegend }, model.groupedSeries, model, {
        formatValue,
      });
    } else {
      renderBarsDom(
        { categoryChart, categoryLegend },
        model.habitSeries,
        model,
        {
          formatValue,
        },
      );
    }
  }

  return {
    render,
    setChartMode: (mode) => (state.chartMode = coerceChartMode(mode)),
    setValueMode: (mode) => (state.valueMode = coerceValueMode(mode)),
  };
}

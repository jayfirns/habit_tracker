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

export const CHART_MODES = ["pie", "bars", "grouped"];
export const VALUE_MODES = ["duration", "frequency"];
const CHART_MODE_ALIASES = { habit: "bars" };

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
  const normalized = CHART_MODE_ALIASES[mode] || mode;
  return CHART_MODES.includes(normalized) ? normalized : "pie";
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
    }));

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
  const seriesEntries =
    coercedValueMode === "duration" ? entries.filter((entry) => entry.durationMinutes > 0) : entries;
  const categorySeries = buildCategorySeries(seriesEntries, coercedValueMode);
  const habitSeries = buildHabitSeries(seriesEntries, coercedValueMode);
  const groupedSeries = buildGroupedSeries(seriesEntries, coercedValueMode);
  const total = habitSeries.reduce((sum, entry) => sum + entry.value, 0);

  return {
    entries: seriesEntries,
    categorySeries,
    habitSeries,
    groupedSeries,
    total,
    chartMode: coercedChartMode,
    valueMode: coercedValueMode,
    hasData: seriesEntries.length > 0,
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
    categoryLegend.innerHTML = `<p class="meta">No data available</p>`;
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
    categoryChart.innerHTML = `<p class="meta">No data available</p>`;
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
    categoryChart.innerHTML = `<p class="meta">No data available</p>`;
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
  renderLegendDom(categoryLegend, series, model, { formatValue, palette });
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
    categoryChart.innerHTML = `<p class="meta">No data available</p>`;
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
      row.className = "bar-row grouped-row";
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

export function createEnergyMixPanel(elements = {}, helpers = {}) {
  const { root } = elements || {};
  const scopedRoot = root || (typeof document !== "undefined" ? document : null);
  const resolve = (explicit, selectors = []) => {
    if (explicit) return explicit;
    if (!scopedRoot) return null;
    for (const selector of selectors) {
      const node = scopedRoot.querySelector(selector);
      if (node) return node;
    }
    return null;
  };

  const chartContainer = resolve(elements.chartContainer || elements.categoryChart, [
    ".chart-container",
    "#category-chart",
  ]);
  const categoryLegend = resolve(elements.categoryLegend, [".chart-legend", "#category-legend"]);
  const chartTotalPill = resolve(elements.chartTotalPill, [".chart-total-pill", "#chart-total-pill"]);
  const chartCenterValue = resolve(elements.chartCenterValue, [".chart-center__value", "#chart-center-value"]);
  const chartCenterLabel = resolve(elements.chartCenterLabel, [".chart-center__label", "#chart-center-label"]);
  const chartCenterContainer = resolve(elements.chartCenterContainer, [".chart-center"]);
  const tabsContainer = resolve(elements.tabsContainer, [".chart-tabs", "#energy-tabs"]);
  const valueToggleContainer = resolve(elements.valueToggleContainer, [".chart-toggle", "#energy-value-toggle"]);
  const chartUpdatedNote = resolve(elements.chartUpdatedNote, [".chart-updated", "#chart-updated-note"]);
  const { formatMinutes = (value) => `${value}m` } = helpers;

  const state = {
    chartMode: "pie",
    valueMode: "duration",
    lastPayload: {},
    lastUpdatedAt: null,
    lastUpdatedTick: null,
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
        const btnMode = coerceChartMode(btn.dataset.chartMode);
        const isActive = btnMode === model.chartMode;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
      });
    }
    if (valueToggleContainer) {
      valueToggleContainer.querySelectorAll("[data-value-mode]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.valueMode === model.valueMode);
        btn.setAttribute("aria-pressed", btn.dataset.valueMode === model.valueMode ? "true" : "false");
      });
    }
  }

  function updateTotals(total, model, formatFn = formatValue) {
    if (centerNode) {
      centerNode.classList.toggle("chart-center--inline", model.chartMode !== "pie");
    }
    const suffix = model.valueMode === "duration" ? "logged" : "sessions";
    if (chartCenterValue) {
      chartCenterValue.textContent = formatFn(total);
    }
    if (chartCenterLabel) {
      chartCenterLabel.textContent = model.valueMode === "duration" ? "" : "sessions";
    }
    if (chartTotalPill) {
      chartTotalPill.textContent = `${formatFn(total)} ${suffix}`;
    }
    if (chartCenterValue) {
      if (model.valueMode === "duration") {
        const hours = Math.floor(total / 60);
        const minutes = Math.max(0, total - hours * 60);
        const parts = [];
        if (hours) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
        parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
        chartCenterValue.setAttribute("aria-label", parts.join(" "));
      } else {
        chartCenterValue.setAttribute("aria-label", `${total} sessions`);
      }
    }
  }

  function renderEmptyState(message = "No data available") {
    if (chartContainer) {
      chartContainer.innerHTML = `<p class="meta">${message}</p>`;
      chartContainer.classList.remove("pie-chart");
      chartContainer.classList.remove("bar-stack");
    }
    if (categoryLegend) {
      categoryLegend.innerHTML = `<p class="meta">${message}</p>`;
    }
    if (chartCenterValue) {
      chartCenterValue.textContent = "";
      chartCenterValue.removeAttribute("aria-label");
    }
    if (chartCenterLabel) {
      chartCenterLabel.textContent = "";
    }
    if (chartTotalPill) {
      chartTotalPill.textContent = "";
    }
  }

  function updateLastUpdated() {
    let tick = Date.now();
    if (state.lastUpdatedTick && tick === state.lastUpdatedTick) tick += 1;
    state.lastUpdatedTick = tick;
    state.lastUpdatedAt = new Date(tick).toISOString();
    if (chartUpdatedNote) {
      chartUpdatedNote.textContent = `Updated ${new Date(tick).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}`;
      chartUpdatedNote.setAttribute("data-last-updated", state.lastUpdatedAt);
    }
    if (chartContainer) chartContainer.setAttribute("data-last-updated", state.lastUpdatedAt);
    if (chartTotalPill) chartTotalPill.setAttribute("data-last-updated", state.lastUpdatedAt);
    const pulseTargets = [chartContainer, chartTotalPill];
    pulseTargets.forEach((node) => {
      if (!node) return;
      node.classList.remove("chart-refresh-pulse");
      void node.offsetWidth;
      node.classList.add("chart-refresh-pulse");
    });
  }

  function render(payload = {}) {
    state.lastPayload = payload;
    const baseConfig = {
      ...payload,
      chartMode: state.chartMode,
      valueMode: state.valueMode,
    };
    const model = buildEnergyMixModel(baseConfig);
    let renderModel = model;

    updateControls(model);
    updateLastUpdated();

    if (!model.hasData) {
      renderEmptyState("No data available");
      return;
    }

    const renderFormat = (value) =>
      renderModel.valueMode === "duration" ? formatMinutes(value) : `${value}`;

    updateTotals(renderModel.total, renderModel, renderFormat);

    if (renderModel.chartMode === "pie") {
      renderPieDom(
        { categoryChart: chartContainer, categoryLegend },
        renderModel.categorySeries,
        renderModel.total,
        renderModel,
        {
          formatValue: renderFormat,
        },
      );
    } else if (renderModel.chartMode === "grouped") {
      renderGroupedDom(
        { categoryChart: chartContainer, categoryLegend },
        renderModel.groupedSeries,
        renderModel,
        {
          formatValue: renderFormat,
        },
      );
    } else {
      renderBarsDom({ categoryChart: chartContainer, categoryLegend }, renderModel.habitSeries, renderModel, {
        formatValue: renderFormat,
      });
    }
  }

  function updateEnergyMixData(newData = {}) {
    const nextPayload =
      newData && typeof newData === "object"
        ? { ...newData, mockEntries: Array.isArray(newData.mockEntries) ? newData.mockEntries : [] }
        : { mockEntries: [] };
    render(nextPayload);
  }

  if (typeof globalThis !== "undefined") {
    globalThis.updateEnergyMixData = updateEnergyMixData;
  }

  return {
    render,
    setChartMode: (mode) => (state.chartMode = coerceChartMode(mode)),
    setValueMode: (mode) => (state.valueMode = coerceValueMode(mode)),
    updateEnergyMixData,
  };
}

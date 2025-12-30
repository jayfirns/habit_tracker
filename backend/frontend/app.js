import { parseFocusMinutes, formatMinutes, computeWorkdayMinutes } from "./time-utils.js";

const API_BASE = window.location.origin;
const HABITS_URL = `${API_BASE}/habits`;

const habitsContainer = document.querySelector("#habits");
const completionsContainer = document.querySelector("#completions");
const statusEl = document.querySelector("#status");
const streakSummary = document.querySelector("#streak-summary");
const form = document.querySelector("#habit-form");
const refreshBtn = document.querySelector("#refresh");
const habitTemplate = document.querySelector("#habit-template");
const editOverlay = document.querySelector("#edit-overlay");
const editForm = document.querySelector("#edit-form");
const closeEditBtn = document.querySelector("#close-edit");
const activeTag = document.querySelector("#active-tag");
const periodLabel = document.querySelector("#period-label");
const periodPrompt = document.querySelector("#period-prompt");
const periodActions = document.querySelector("#period-actions");
const habitCount = document.querySelector("#habit-count");
const streakSummaryCard = document.querySelector("#streak-summary-card");
const periodCta = document.querySelector("#period-cta");
const reflectionCta = document.querySelector("#reflection-cta");
const closeGoalBtn = document.querySelector("#close-goal");
const goalOverlay = document.querySelector("#goal-overlay");
const goalForm = document.querySelector("#goal-form");
const openReflectionBtn = document.querySelector("#open-reflection");
const closeReflectionBtn = document.querySelector("#close-reflection");
const reflectionOverlay = document.querySelector("#reflection-overlay");
const reflectionForm = document.querySelector("#reflection-form");
const goalsList = document.querySelector("#goals-list");
const newGoalBtn = document.querySelector("#new-goal");
const themeButtons = document.querySelectorAll("[data-theme]");
const optionsToggle = document.querySelector("#options-toggle");
const optionsPanel = document.querySelector("#options-panel");
const goalCountEl = document.querySelector("#goal-count");
const goalHighlightEl = document.querySelector("#goal-highlight");
const goalHabitsLinkedEl = document.querySelector("#goal-habits-linked");
const goalHabitCoverageEl = document.querySelector("#goal-habit-coverage");
const goalDueCountEl = document.querySelector("#goal-due-count");
const goalDueLabelEl = document.querySelector("#goal-due-label");
const goalScopeHighlightEl = document.querySelector("#goal-scope-highlight");
const goalNextStepEl = document.querySelector("#goal-next-step");
const chartTotalPill = document.querySelector("#chart-total-pill");
const chartCenterValue = document.querySelector("#chart-center-value");
const categoryChart = document.querySelector("#category-chart");
const categoryLegend = document.querySelector("#category-legend");
const goalHabitPicker = document.querySelector("#goal-habit-picker");
const goalHabitChips = document.querySelector("#goal-habit-chips");
const workdayStartInput = document.querySelector("#workday-start");
const workdayHoursInput = document.querySelector("#workday-hours");
const workdaySaveBtn = document.querySelector("#workday-save");
const workdayClockoutBtn = document.querySelector("#workday-clockout");
const workdayWorkedOverride = document.querySelector("#workday-worked-override");
const workdayApplyWorkedBtn = document.querySelector("#workday-apply-worked");
const workdayProgress = document.querySelector("#workday-progress");
const workdayLabel = document.querySelector("#workday-label");
const timeSummaryList = document.querySelector("#time-summary-list");
const timeWorkdayPill = document.querySelector("#time-workday-pill");
const timeSummaryPercent = document.querySelector("#time-summary-percent");
const habitCardRefs = new Map();

const state = {
  habits: [],
  editingId: null,
  filterTag: null,
  goals: [],
  reflections: [],
  editingGoalId: null,
  goalHabitSelection: new Set(),
  timeLogs: {},
  manualLogs: {},
  workday: {
    start: "09:00",
    hours: 8,
    setAt: new Date().toISOString(),
    clockedOutAt: null,
    manualWorkedMinutes: null,
  },
  activeTimers: {},
};

// Ensure overlay is hidden on load
if (editOverlay) {
  editOverlay.hidden = true;
}

const setStatus = (text, isError = false) => {
  statusEl.textContent = text;
  statusEl.style.color = isError ? "#ffb4a2" : "var(--muted)";
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadWorkdayConfig() {
  const saved = localStorage.getItem("focusos-workday");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state.workday = { ...state.workday, ...parsed };
    } catch (e) {
      console.warn("Failed to parse workday config", e);
    }
  }
  if (workdayStartInput) workdayStartInput.value = state.workday.start;
  if (workdayHoursInput) workdayHoursInput.value = state.workday.hours;
  if (workdayWorkedOverride && state.workday.manualWorkedMinutes != null) {
    workdayWorkedOverride.value = state.workday.manualWorkedMinutes;
  }
}

function saveWorkdayConfig() {
  state.workday.setAt = new Date().toISOString();
  localStorage.setItem("focusos-workday", JSON.stringify(state.workday));
}

function loadTimeLogs() {
  const saved = localStorage.getItem("focusos-time-logs");
  if (saved) {
    try {
      state.timeLogs = JSON.parse(saved);
    } catch (e) {
      console.warn("Failed to parse time logs", e);
    }
  }
  const today = todayKey();
  const todayLogs = state.timeLogs?.[today] || {};
  state.timeLogs = { [today]: todayLogs };
  saveTimeLogs();
}

function loadManualLogs() {
  const saved = localStorage.getItem("focusos-manual-logs");
  if (saved) {
    try {
      state.manualLogs = JSON.parse(saved);
    } catch (e) {
      console.warn("Failed to parse manual logs", e);
    }
  }
}

function saveManualLogs() {
  localStorage.setItem("focusos-manual-logs", JSON.stringify(state.manualLogs));
}

function saveTimeLogs() {
  localStorage.setItem("focusos-time-logs", JSON.stringify(state.timeLogs));
}

function loadActiveTimers() {
  const saved = localStorage.getItem("focusos-active-timers");
  if (saved) {
    try {
      state.activeTimers = JSON.parse(saved);
    } catch (e) {
      console.warn("Failed to parse active timers", e);
    }
  }
}

function saveActiveTimers() {
  localStorage.setItem("focusos-active-timers", JSON.stringify(state.activeTimers));
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

async function loadHabits() {
  setStatus("Loading...");
  try {
    const data = await api(HABITS_URL);
    state.habits = data;
    rebuildTimeLogsFromCompletions();
    populateHabitOptions();
    renderHabits();
    renderCompletions();
    renderDashboard();
    setStatus("Synced");
  } catch (err) {
    console.error(err);
    setStatus("Failed to load habits", true);
  }
}

async function loadGoals() {
  try {
    const goals = await api(`${API_BASE}/goals`);
    state.goals = goals;
    renderGoals();
    renderGoalInsights();
  } catch (err) {
    console.error("Failed to load goals", err);
  }
}

async function loadReflections() {
  try {
    const data = await api(`${API_BASE}/reflections`);
    state.reflections = data;
    renderGoalInsights();
  } catch (err) {
    console.error("Failed to load reflections", err);
  }
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}

function updateWorkdayProgress() {
  if (!workdayProgress || !workdayLabel) return;
  const now = new Date();
  const { usedMinutes, totalMinutes } = computeWorkdayMinutes(state.workday, now);
  const pct = totalMinutes > 0 ? Math.min(100, Math.max(0, (usedMinutes / totalMinutes) * 100)) : 0;
  workdayProgress.style.width = `${pct}%`;

  const remainingMinutes = Math.max(0, totalMinutes - usedMinutes);
  workdayLabel.textContent = `${formatMinutes(remainingMinutes)} left · ${formatMinutes(usedMinutes)} used of ${formatMinutes(totalMinutes)}`;

  const startColor = [74, 222, 128]; // green
  const endColor = [239, 68, 68]; // red
  const mix = pct / 100;
  const color = startColor.map((c, idx) => Math.round(c + (endColor[idx] - c) * mix));
  workdayProgress.style.background = `rgb(${color.join(",")})`;
}

function renderHabits() {
  habitsContainer.innerHTML = "";
  let totalStreak = 0;
  habitCardRefs.clear();

  const habits = state.filterTag
    ? state.habits.filter((h) => (h.tags || []).includes(state.filterTag))
    : state.habits;

  if (state.filterTag) {
    activeTag.hidden = false;
    activeTag.textContent = `Filter: #${state.filterTag}`;
  } else {
    activeTag.hidden = true;
  }

  // Group by category
  const byCategory = habits.reduce((acc, habit) => {
    acc[habit.category] = acc[habit.category] || [];
    acc[habit.category].push(habit);
    return acc;
  }, {});

  Object.entries(byCategory).forEach(([category, items]) => {
    const block = document.createElement("section");
    block.className = "category-block";
    const heading = document.createElement("h2");
    heading.className = "category-title";
    heading.textContent = category;
    block.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "habits-grid";
    items.forEach((habit) => {
      totalStreak += habit.streak || 0;
      const node = habitTemplate.content.firstElementChild.cloneNode(true);
      node.dataset.id = habit.id;
      habitCardRefs.set(habit.id, node);
      node.querySelector(".js-name").textContent = habit.name;
      node.querySelector(".js-category").textContent = habit.name;
      node.querySelector(".js-name").textContent = "";
      node.querySelector(".js-last").textContent = `Last: ${formatDate(habit.last_completed)}`;
      node.querySelector(".js-streak").textContent = habit.streak ?? 0;
      node.querySelector(".js-completions").textContent = `${habit.completions.length} completions`;
      node.querySelector(".js-id").textContent = `ID ${habit.id}`;
      refreshHabitTimeDisplay(habit.id, node);

      const tagRow = node.querySelector(".js-tag-row");
      (habit.tags || []).forEach((tag) => {
        const chip = document.createElement("span");
        chip.className = "pill";
        chip.textContent = `#${tag}`;
        chip.addEventListener("click", () => setTagFilter(tag));
        tagRow.appendChild(chip);
      });
      if (!habit.tags || habit.tags.length === 0) {
        const chip = document.createElement("span");
        chip.className = "pill subtle";
        chip.textContent = "No tags";
        tagRow.appendChild(chip);
      }

      const dateInput = node.querySelector(".complete-date");
      const noteInput = node.querySelector(".complete-note");
      dateInput.value = todayValue();

      node.querySelector(".js-complete").addEventListener("click", () =>
        completeHabit(habit.id, {
          note: noteInput.value,
          date: dateInput.value,
        }),
      );
      node.querySelector(".js-adjust-time").addEventListener("click", () => adjustHabitMinutes(habit.id));
      node.querySelector(".js-timer-toggle").addEventListener("click", () => toggleHabitTimer(habit.id));
      node.querySelector(".js-delete").addEventListener("click", () => deleteHabit(habit.id));
      node.querySelector(".js-edit").addEventListener("click", () => openEdit(habit));
      node.querySelector(".js-toggle").addEventListener("click", () => {
        node.classList.toggle("collapsed");
      });

      grid.appendChild(node);
    });

    block.appendChild(grid);
    habitsContainer.appendChild(block);
  });

  streakSummary.textContent = totalStreak;
}

function renderCompletions() {
  completionsContainer.innerHTML = "";
  const all = state.habits
    .flatMap((h) => (h.completions || []).map((c) => ({ ...c, habitName: h.name })))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 12);

  if (!all.length) {
    completionsContainer.innerHTML = `<p class="meta">No completions yet. Log your first one!</p>`;
    return;
  }

  all.forEach((item) => {
    const row = document.createElement("div");
    row.className = "timeline__row";
    row.innerHTML = `
      <div>
        <div class="pill">${formatDate(item.date)}</div>
      </div>
      <div>
        <strong>${item.habitName}</strong>
        <div class="meta">${item.note || "No note"}</div>
      </div>
      <div class="pill subtle">#${item.id}</div>
    `;
    completionsContainer.appendChild(row);
  });
}

async function createHabit(formData) {
  const name = formData.get("name").trim();
  const category = formData.get("category").trim();
  const tagsRaw = formData.get("tags") || "";
  const tags = parseTags(tagsRaw);
  if (!name || !category) {
    setStatus("Name and category are required", true);
    return;
  }

  setStatus("Creating...");
  await api(HABITS_URL, {
    method: "POST",
    body: JSON.stringify({ name, category, tags }),
  });
  setStatus("Created");
  form.reset();
  await loadHabits();
}

async function completeHabit(id, { note, date }) {
  const bankedMinutes = stopHabitTimer(id);
  const timeLabel = bankedMinutes > 0 ? `${formatMinutes(bankedMinutes)} focus` : null;
  const noteWithTime = timeLabel ? (note ? `${note} · ${timeLabel}` : timeLabel) : note;
  const payload = {};
  if (noteWithTime) payload.note = noteWithTime;
  if (date) payload.date = date;
  setStatus("Completing...");
  await api(`${HABITS_URL}/${id}/complete`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setStatus("Logged");
  await loadHabits();
}

async function deleteHabit(id) {
  const ok = confirm("Delete this habit? This will remove its completions.");
  if (!ok) return;
  setStatus("Deleting...");
  await api(`${HABITS_URL}/${id}`, { method: "DELETE" });
  setStatus("Deleted");
  await loadHabits();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await createHabit(new FormData(form));
  } catch (err) {
    console.error(err);
    setStatus("Could not create habit", true);
  }
});

refreshBtn.addEventListener("click", loadHabits);

function openEdit(habit) {
  state.editingId = habit.id;
  document.querySelector("#edit-id").value = habit.id;
  document.querySelector("#edit-name").value = habit.name;
  document.querySelector("#edit-category").value = habit.category;
  document.querySelector("#edit-tags").value = (habit.tags || []).join(", ");
  editOverlay.hidden = false;
}

function closeEdit() {
  state.editingId = null;
  editOverlay.hidden = true;
}

closeEditBtn.addEventListener("click", closeEdit);
editOverlay.addEventListener("click", (e) => {
  if (e.target === editOverlay) closeEdit();
});

editForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.editingId) return;
  const name = document.querySelector("#edit-name").value.trim();
  const category = document.querySelector("#edit-category").value.trim();
  const tags = parseTags(document.querySelector("#edit-tags").value);
  if (!name || !category) {
    setStatus("Name and category are required", true);
    return;
  }

  setStatus("Saving...");
  try {
    await api(`${HABITS_URL}/${state.editingId}`, {
      method: "PUT",
      body: JSON.stringify({ name, category, tags }),
    });
    setStatus("Updated");
    closeEdit();
    await loadHabits();
  } catch (err) {
    console.error(err);
    setStatus("Failed to update habit", true);
  }
});

function parseTags(raw) {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function setTagFilter(tag) {
  if (state.filterTag === tag) {
    state.filterTag = null;
  } else {
    state.filterTag = tag;
  }
  loadHabits();
}

function renderDashboard() {
  const now = new Date();
  const month = now.toLocaleString("default", { month: "long" });
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  periodLabel.textContent = `Q${quarter} · ${month}`;

  const actions = [
    "Review top 3 habits for this quarter.",
    "Add or adjust tags to align with focus areas.",
    "Log a completion with a note reflecting intent.",
  ];
  periodActions.innerHTML = "";
  actions.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    periodActions.appendChild(li);
  });
  periodPrompt.textContent = `How do your habits today support your Q${quarter} goals?`;

  habitCount.textContent = state.habits.length;
  streakSummaryCard.textContent = `${state.habits.reduce((sum, h) => sum + (h.streak || 0), 0)} streak days total`;
  renderGoalInsights();
  renderCategoryChart();
  renderTimeSummary();
}

function renderGoalInsights() {
  if (!goalCountEl) return;
  const goals = state.goals || [];
  const habits = state.habits || [];
  const today = new Date();
  const activeGoals = goals.filter((g) => (g.status || "active").toLowerCase() !== "complete");
  const completedGoals = goals.length - activeGoals.length;
  goalCountEl.textContent = activeGoals.length;

  const scopeCounts = activeGoals.reduce((acc, goal) => {
    acc[goal.scope] = (acc[goal.scope] || 0) + 1;
    return acc;
  }, {});
  const topScope = Object.entries(scopeCounts).sort((a, b) => b[1] - a[1])[0];
  if (goalScopeHighlightEl) {
    goalScopeHighlightEl.textContent = topScope ? `${topScope[1]} ${topScope[0]} goals` : "Quarter focus";
  }

  const linkedHabitIds = new Set();
  goals.forEach((goal) => (goal.habit_ids || []).forEach((id) => linkedHabitIds.add(id)));
  if (goalHabitsLinkedEl) {
    goalHabitsLinkedEl.textContent = linkedHabitIds.size;
  }
  const coverage = habits.length ? Math.round((linkedHabitIds.size / habits.length) * 100) : 0;
  if (goalHabitCoverageEl) {
    goalHabitCoverageEl.textContent = habits.length ? `${coverage}% coverage` : "No habits yet";
  }

  const dueSoon = activeGoals
    .map((goal) => ({
      ...goal,
      dueDate: goal.due_date ? new Date(goal.due_date) : null,
    }))
    .filter((goal) => goal.dueDate && !Number.isNaN(goal.dueDate.getTime()))
    .sort((a, b) => a.dueDate - b.dueDate);
  const windowDate = new Date();
  windowDate.setDate(windowDate.getDate() + 30);
  const dueThisMonth = dueSoon.filter((goal) => goal.dueDate <= windowDate);
  if (goalDueCountEl) {
    goalDueCountEl.textContent = dueThisMonth.length;
  }
  if (goalDueLabelEl) {
    if (dueThisMonth.length) {
      const nearest = dueThisMonth[0];
      const daysLeft = Math.max(0, Math.round((nearest.dueDate - today) / (1000 * 60 * 60 * 24)));
      goalDueLabelEl.textContent = `${nearest.title} · ${formatDate(nearest.due_date)} (${daysLeft}d)`;
    } else if (dueSoon.length) {
      goalDueLabelEl.textContent = `${dueSoon.length} with dates · next ${formatDate(dueSoon[0].due_date)}`;
    } else {
      goalDueLabelEl.textContent = "No deadlines";
    }
  }

  if (goalHighlightEl) {
    if (activeGoals.length) {
      const measurable = activeGoals.filter((goal) => goal.outcome).length;
      goalHighlightEl.textContent = `${measurable}/${activeGoals.length} have measurable outcomes · ${completedGoals} completed`;
    } else if (goals.length) {
      goalHighlightEl.textContent = `${goals.length} archived or complete`;
    } else {
      goalHighlightEl.textContent = "Set your first target";
    }
  }

  const latestReflection =
    state.reflections
      .slice()
      .sort(
        (a, b) =>
          (new Date(b.submitted_at || b.period_label).getTime() || 0) -
          (new Date(a.submitted_at || a.period_label).getTime() || 0),
      )[0] || null;

  if (goalNextStepEl) {
    if (latestReflection) {
      const detail = latestReflection.responses?.[0] || "Keep momentum.";
      goalNextStepEl.textContent = `Last reflection ${latestReflection.period_label}: ${detail}`;
    } else if (habits.length) {
      const topHabit = habits.slice().sort((a, b) => (b.streak || 0) - (a.streak || 0))[0];
      goalNextStepEl.textContent = `Link ${topHabit.name} to a goal to lock intent.`;
    } else {
      goalNextStepEl.textContent = "Use SMART to define one measurable outcome this week.";
    }
  }
}

function getHabitMinutes(habitId) {
  const logs = state.timeLogs || {};
  const today = todayKey();
  let todayMinutes = 0;
  const todaysHabits = logs[today] || {};
  todayMinutes = todaysHabits?.[habitId] || 0;
  const active = state.activeTimers?.[habitId];
  if (active?.start) {
    const elapsedMinutes = Math.max(0, Math.floor((Date.now() - active.start) / 60000));
    todayMinutes += elapsedMinutes;
  }
  return { todayMinutes };
}

function addHabitMinutes(habitId, minutes) {
  const key = todayKey();
  if (!state.timeLogs[key]) state.timeLogs[key] = {};
  state.timeLogs[key][habitId] = (state.timeLogs[key][habitId] || 0) + minutes;
  saveTimeLogs();
}

function toggleHabitTimer(habitId) {
  const timer = state.activeTimers[habitId];
  if (timer?.start) {
    const minutes = Math.max(1, Math.round((Date.now() - timer.start) / 60000));
    addHabitMinutes(habitId, minutes);
    delete state.activeTimers[habitId];
    saveActiveTimers();
    const node = habitCardRefs.get(habitId);
    if (node) refreshHabitTimeDisplay(habitId, node);
    return;
  }
  state.activeTimers[habitId] = { start: Date.now() };
  saveActiveTimers();
  const node = habitCardRefs.get(habitId);
  if (node) refreshHabitTimeDisplay(habitId, node);
}

function stopHabitTimer(habitId) {
  const timer = state.activeTimers[habitId];
  if (!timer?.start) return 0;
  const minutes = Math.max(1, Math.round((Date.now() - timer.start) / 60000));
  addHabitMinutes(habitId, minutes);
  delete state.activeTimers[habitId];
  saveActiveTimers();
  const node = habitCardRefs.get(habitId);
  if (node) refreshHabitTimeDisplay(habitId, node);
  return minutes;
}

function refreshHabitTimeDisplay(habitId, node) {
  if (!node) return;
  const { todayMinutes } = getHabitMinutes(habitId);
  const todayEl = node.querySelector(".js-time-today");
  const indicator = node.querySelector(".js-timer-indicator");
  const toggleBtn = node.querySelector(".js-timer-toggle");
  if (todayEl) todayEl.textContent = `${formatMinutes(todayMinutes)} today`;
  const active = state.activeTimers?.[habitId];
  node.classList.toggle("timer-active", Boolean(active));
  if (indicator) {
    indicator.hidden = false;
    if (active) {
      const elapsedMs = Date.now() - active.start;
      indicator.textContent = `Timer running · ${formatDuration(elapsedMs)}`;
      indicator.classList.add("running");
    } else {
      indicator.textContent = "Timer off";
      indicator.classList.remove("running");
    }
  }
  if (toggleBtn) {
    toggleBtn.textContent = state.activeTimers?.[habitId] ? "Stop timer" : "Start timer";
    toggleBtn.classList.add("button", "ghost", "small");
  }
}

function adjustHabitMinutes(habitId) {
  const current = getHabitMinutes(habitId).todayMinutes;
  const input = prompt("Set focus minutes for today", current.toString());
  if (input === null) return;
  const value = parseInt(input, 10);
  if (Number.isNaN(value) || value < 0) return;
  stopHabitTimer(habitId);
  const today = todayKey();
  if (!state.manualLogs[today]) state.manualLogs[today] = {};
  state.manualLogs[today][habitId] = value;
  saveManualLogs();
  if (!state.timeLogs[today]) state.timeLogs[today] = {};
  state.timeLogs[today][habitId] = value;
  saveTimeLogs();
  const node = habitCardRefs.get(habitId);
  if (node) refreshHabitTimeDisplay(habitId, node);
  renderTimeSummary();
}

function updateRunningTimersUI() {
  if (!state.activeTimers) return;
  habitCardRefs.forEach((node, habitId) => {
    if (state.activeTimers[habitId]) {
      refreshHabitTimeDisplay(habitId, node);
    }
  });
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (hours) parts.push(`${hours}h`);
  parts.push(`${String(minutes).padStart(2, "0")}m`);
  parts.push(`${String(seconds).padStart(2, "0")}s`);
  return parts.join(" ");
}

function getTodayTotalMinutes() {
  const today = todayKey();
  const logs = state.timeLogs[today] || {};
  let total = 0;
  const habitIds = new Set([
    ...Object.keys(logs),
    ...Object.keys(state.activeTimers || {}),
    ...collectHabitsWithTodayCompletions(),
  ]);
  habitIds.forEach((habitId) => {
    total += getHabitMinutes(Number(habitId)).todayMinutes;
  });
  return total;
}

function getTodayFocusedMinutes() {
  const today = todayKey();
  let total = 0;
  const logs = state.timeLogs[today] || {};
  Object.values(logs).forEach((m) => (total += m || 0));
  Object.entries(state.activeTimers || {}).forEach(([habitId, timer]) => {
    if (timer?.start) {
      const elapsed = Math.max(0, Math.floor((Date.now() - timer.start) / 60000));
      total += elapsed;
    }
  });
  return total;
}

function collectHabitsWithTodayCompletions() {
  const today = todayKey();
  const ids = new Set();
  state.habits.forEach((habit) => {
    (habit.completions || []).forEach((c) => {
      if (c.date === today && parseFocusMinutes(c.note) > 0) {
        ids.add(String(habit.id));
      }
    });
  });
  return ids;
}

function rebuildTimeLogsFromCompletions() {
  const today = todayKey();
  const logs = {};
  state.habits.forEach((habit) => {
    (habit.completions || []).forEach((c) => {
      if (c.date === today) {
        const minutes = parseFocusMinutes(c.note);
        if (minutes > 0) {
          logs[habit.id] = (logs[habit.id] || 0) + minutes;
        }
      }
    });
  });
  const manual = state.manualLogs?.[today] || {};
  Object.entries(manual).forEach(([habitId, minutes]) => {
    logs[habitId] = minutes;
  });
  state.timeLogs[today] = logs;
  saveTimeLogs();
}

function latestCompletionNote(habitId, dateKey) {
  const habit = state.habits.find((h) => h.id === habitId);
  if (!habit) return null;
  const todayCompletions = (habit.completions || [])
    .filter((c) => c.date === dateKey)
    .sort((a, b) => (a.id || 0) - (b.id || 0));
  const last = todayCompletions[todayCompletions.length - 1];
  return last?.note || null;
}

function renderCategoryChart() {
  if (!categoryChart || !categoryLegend) return;

  const stats = state.habits.reduce((acc, habit) => {
    const category = habit.category || "Uncategorized";
    const completions = (habit.completions || []).length;
    if (!acc[category]) {
      acc[category] = { completions: 0, habits: 0 };
    }
    acc[category].completions += completions;
    acc[category].habits += 1;
    return acc;
  }, {});
  const entries = Object.entries(stats).sort((a, b) => b[1].completions - a[1].completions);
  const totalCompletions = entries.reduce((sum, [, data]) => sum + data.completions, 0);

  if (chartCenterValue) {
    chartCenterValue.textContent = totalCompletions;
  }
  if (chartTotalPill) {
    chartTotalPill.textContent = `${totalCompletions} logged`;
  }

  categoryChart.innerHTML = "";
  categoryLegend.innerHTML = "";

  if (!entries.length || totalCompletions === 0) {
    categoryChart.innerHTML = `<p class="meta">Log completions to see your mix.</p>`;
    categoryLegend.innerHTML = `<p class="meta">No completions yet. Add a note to your next one.</p>`;
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

  const palette = ["#ff6f61", "#36c2cf", "#8f7bff", "#ffd166", "#4ade80", "#f472b6", "#22d3ee", "#f97316"];
  let offset = 0;

  entries.forEach(([category, data], idx) => {
    const share = data.completions / totalCompletions;
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

    const legend = document.createElement("div");
    legend.className = "legend-item";
    legend.innerHTML = `
      <span class="legend-swatch" style="background:${palette[idx % palette.length]}"></span>
      <div class="legend-text">
        <span class="legend-title">${category}</span>
        <span class="meta">${data.completions} completions · ${data.habits} habits</span>
      </div>
    `;
    categoryLegend.appendChild(legend);
  });

  categoryChart.appendChild(svg);
}

function renderTimeSummary() {
  if (!timeSummaryList) return;
  const today = todayKey();
  const todayLogs = state.timeLogs[today] || {};
  const { usedMinutes: computedWorked, totalMinutes: plannedMinutes } = computeWorkdayMinutes(
    state.workday,
    new Date(),
  );
  const actualMinutes =
    state.workday.manualWorkedMinutes != null
      ? Math.max(0, Math.floor(state.workday.manualWorkedMinutes))
      : computedWorked;
  const focusedMinutes = getTodayFocusedMinutes();
  if (timeWorkdayPill) {
    const label = state.workday.clockedOutAt ? "Clocked out" : "Planned";
    timeWorkdayPill.textContent = `${label}: ${formatMinutes(plannedMinutes)}`;
  }

  const habitIds = new Set([
    ...Object.keys(todayLogs),
    ...Object.keys(state.activeTimers || {}),
    ...collectHabitsWithTodayCompletions(),
  ]);

  const entries = Array.from(habitIds)
    .map((habitId) => {
      const minutes = getHabitMinutes(Number(habitId)).todayMinutes;
      const habit = state.habits.find((h) => h.id === Number(habitId));
      const note = latestCompletionNote(Number(habitId), today);
      return {
        habitId: Number(habitId),
        minutes,
        name: habit ? habit.name : `Habit ${habitId}`,
        note,
      };
    })
    .filter((e) => e.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);

  const percentOfPlan = plannedMinutes > 0 ? Math.round((actualMinutes / plannedMinutes) * 100) : 0;
  const focusVsWorked = actualMinutes > 0 ? Math.round((focusedMinutes / actualMinutes) * 100) : 0;

  if (entries.length === 0) {
    timeSummaryList.innerHTML = `<p class="meta">No focus time logged yet today.</p>`;
  } else {
    const header = `
      <div class="time-row header">
        <div class="time-cell">Planned</div>
        <div class="time-cell">Worked</div>
        <div class="time-cell">% Plan</div>
        <div class="time-cell">Focused</div>
        <div class="time-cell">% Focused</div>
      </div>`;
    const totalRow = `
      <div class="time-row">
        <div class="time-cell meta">${formatMinutes(plannedMinutes)}</div>
        <div class="time-cell meta">${formatMinutes(actualMinutes)}</div>
        <div class="time-cell meta">${percentOfPlan}%</div>
        <div class="time-cell meta">${formatMinutes(focusedMinutes)}</div>
        <div class="time-cell meta">${focusVsWorked}% of worked</div>
      </div>`;
    const habitRows = entries
      .map(
        (entry) => `
          <div class="time-row">
            <div class="time-cell meta" style="grid-column: span 2;">${entry.name}</div>
            <div class="time-cell meta">${formatMinutes(entry.minutes)}</div>
            <div class="time-cell meta" style="grid-column: span 2;">${entry.note || "No note"}</div>
          </div>`,
      )
      .join("");
    const habitsHeader = `
      <div class="time-row header">
        <div class="time-cell" style="grid-column: span 2;">Task</div>
        <div class="time-cell">Focused</div>
        <div class="time-cell" style="grid-column: span 2;">Closure note</div>
      </div>`;
    timeSummaryList.innerHTML = `<div class="time-table">${header}${totalRow}${habitsHeader}${habitRows}</div>`;
  }

  if (timeSummaryPercent) {
    timeSummaryPercent.textContent = "";
  }
}

loadTimeLogs();
loadWorkdayConfig();
loadManualLogs();
loadActiveTimers();
loadHabits();
loadGoals();
loadReflections();
initThemePicker();
initOptionsMenu();
updateWorkdayProgress();
setInterval(updateWorkdayProgress, 60000);
setInterval(updateRunningTimersUI, 1000);

function openOverlay(el) {
  el.hidden = false;
}

function closeOverlay(el) {
  el.hidden = true;
}

periodCta?.addEventListener("click", () => {
  state.editingGoalId = null;
  goalForm.reset();
  resetGoalHabitSelection();
  openOverlay(goalOverlay);
});
reflectionCta?.addEventListener("click", () => {
  reflectionForm.querySelector("#reflection-period").value = autoPeriodLabel(new Date());
  openOverlay(reflectionOverlay);
});
newGoalBtn?.addEventListener("click", () => {
  state.editingGoalId = null;
  goalForm.reset();
  resetGoalHabitSelection();
  openOverlay(goalOverlay);
});
closeGoalBtn?.addEventListener("click", () => closeOverlay(goalOverlay));
goalOverlay?.addEventListener("click", (e) => {
  if (e.target === goalOverlay) closeOverlay(goalOverlay);
});

workdaySaveBtn?.addEventListener("click", () => {
  const startVal = workdayStartInput.value || "09:00";
  const hoursVal = parseFloat(workdayHoursInput.value) || 8;
  state.workday = { start: startVal, hours: Math.max(1, Math.min(16, hoursVal)) };
  state.workday.clockedOutAt = null;
  saveWorkdayConfig();
  updateWorkdayProgress();
  renderTimeSummary();
});

workdayClockoutBtn?.addEventListener("click", () => {
  state.workday.clockedOutAt = new Date().toISOString();
  state.workday.manualWorkedMinutes = null;
  saveWorkdayConfig();
  updateWorkdayProgress();
  renderTimeSummary();
});

workdayApplyWorkedBtn?.addEventListener("click", () => {
  const mins = parseInt(workdayWorkedOverride.value, 10);
  if (!Number.isNaN(mins) && mins >= 0) {
    state.workday.manualWorkedMinutes = mins;
    state.workday.clockedOutAt = null;
    saveWorkdayConfig();
    updateWorkdayProgress();
    renderTimeSummary();
  }
});

goalHabitPicker?.addEventListener("change", (event) => {
  const selectedId = parseInt(event.target.value, 10);
  if (!Number.isNaN(selectedId)) {
    state.goalHabitSelection.add(selectedId);
    populateHabitOptions();
    renderGoalHabitChips();
  }
  goalHabitPicker.value = "";
});

goalForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = goalForm.querySelector("#goal-title").value.trim();
  const scope = goalForm.querySelector("#goal-scope").value;
  const outcome = goalForm.querySelector("#goal-outcome").value.trim();
  const due_date = goalForm.querySelector("#goal-due").value || null;
  const tags = parseTags(goalForm.querySelector("#goal-tags").value);
  const habit_ids = getGoalHabitSelection();
  if (!title) {
    setStatus("Goal title required", true);
    return;
  }
  try {
    const payload = { title, scope, outcome, due_date, tags, habit_ids };
    if (state.editingGoalId) {
      await api(`${API_BASE}/goals/${state.editingGoalId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setStatus("Goal updated");
    } else {
      await api(`${API_BASE}/goals`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setStatus("Goal saved");
    }
    closeOverlay(goalOverlay);
    goalForm.reset();
    state.editingGoalId = null;
    await loadGoals();
    await loadHabits();
  } catch (err) {
    console.error(err);
    setStatus("Failed to save goal", true);
  }
});

openReflectionBtn?.addEventListener("click", () => {
  const now = new Date();
  reflectionForm.querySelector("#reflection-period").value = autoPeriodLabel(now);
  openOverlay(reflectionOverlay);
});
closeReflectionBtn?.addEventListener("click", () => closeOverlay(reflectionOverlay));
reflectionOverlay?.addEventListener("click", (e) => {
  if (e.target === reflectionOverlay) closeOverlay(reflectionOverlay);
});

reflectionForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const reflection_type = reflectionForm.querySelector("#reflection-type").value;
  const period_label = reflectionForm.querySelector("#reflection-period").value.trim();
  const responses = [reflectionForm.querySelector("#reflection-responses").value.trim()].filter(Boolean);
  const goal_id = parseInt(reflectionForm.querySelector("#reflection-goal")?.value || "0", 10) || null;
  const rating = reflectionForm.querySelector("#reflection-rating")?.value || null;
  if (!period_label) {
    setStatus("Period label required", true);
    return;
  }
  try {
    await api(`${API_BASE}/reflections`, {
      method: "POST",
      body: JSON.stringify({
        reflection_type,
        period_label,
        responses,
        prompts: [],
        goal_id,
        rating,
      }),
    });
    setStatus("Reflection saved");
    closeOverlay(reflectionOverlay);
    reflectionForm.reset();
  } catch (err) {
    console.error(err);
    setStatus("Failed to save reflection", true);
  }
});

function parseIds(raw) {
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => parseInt(v, 10))
    .filter((n) => !Number.isNaN(n));
}

function populateHabitOptions() {
  if (!goalHabitPicker) return;
  goalHabitPicker.innerHTML = `<option value="">Select a habit to link</option>`;
  state.habits.forEach((habit) => {
    const opt = document.createElement("option");
    opt.value = habit.id;
    opt.textContent = `${habit.name} (${habit.category})`;
    if (state.goalHabitSelection.has(habit.id)) {
      opt.disabled = true;
    }
    goalHabitPicker.appendChild(opt);
  });
}

function renderGoalHabitChips() {
  if (!goalHabitChips) return;
  goalHabitChips.innerHTML = "";
  if (state.goalHabitSelection.size === 0) {
    goalHabitChips.innerHTML = `<span class="meta">No habits linked</span>`;
    return;
  }
  const byId = Object.fromEntries(state.habits.map((h) => [h.id, h]));
  Array.from(state.goalHabitSelection).forEach((id) => {
    const habit = byId[id];
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.innerHTML = `
      <span>${habit ? habit.name : `Habit ${id}`}</span>
      <button type="button" class="chip-remove" data-id="${id}" aria-label="Remove linked habit">×</button>
    `;
    goalHabitChips.appendChild(chip);
  });
  goalHabitChips.querySelectorAll(".chip-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id, 10);
      state.goalHabitSelection.delete(id);
      populateHabitOptions();
      renderGoalHabitChips();
    });
  });
}

function resetGoalHabitSelection(ids = []) {
  state.goalHabitSelection = new Set(ids);
  populateHabitOptions();
  renderGoalHabitChips();
}

function getGoalHabitSelection() {
  return Array.from(state.goalHabitSelection);
}

function populateReflectionGoalOptions() {
  const select = document.querySelector("#reflection-goal");
  if (!select) return;
  select.innerHTML = `<option value="">(Optional) Link to goal</option>`;
  state.goals.forEach((goal) => {
    const opt = document.createElement("option");
    opt.value = goal.id;
    opt.textContent = goal.title;
    select.appendChild(opt);
  });
}

function renderGoals() {
  if (!goalsList) return;
  goalsList.innerHTML = "";
  populateHabitOptions();
  populateReflectionGoalOptions();
  if (state.goals.length === 0) {
    goalsList.innerHTML = `<p class="meta">No goals yet. Tap the period pill to create one.</p>`;
    return;
  }
  state.goals.forEach((goal) => {
    const line = document.createElement("div");
    line.className = "goal-line";
    const left = document.createElement("div");
    left.innerHTML = `<strong>${goal.title}</strong><div class="meta">${goal.scope} · ${goal.status || "active"}</div>`;
    const actions = document.createElement("div");
    actions.className = "goal-actions";
    const editBtn = document.createElement("button");
    editBtn.className = "ghost small";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => openGoalForEdit(goal));
    const reflectBtn = document.createElement("button");
    reflectBtn.className = "ghost small";
    reflectBtn.textContent = "Reflect";
    reflectBtn.addEventListener("click", () => openReflectionForGoal(goal));
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "ghost small";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteGoal(goal.id));
    actions.appendChild(editBtn);
    actions.appendChild(reflectBtn);
    actions.appendChild(deleteBtn);
    line.appendChild(left);
    line.appendChild(actions);
    goalsList.appendChild(line);
  });
}

function openGoalForEdit(goal) {
  state.editingGoalId = goal.id;
  goalForm.querySelector("#goal-title").value = goal.title;
  goalForm.querySelector("#goal-scope").value = goal.scope;
  goalForm.querySelector("#goal-outcome").value = goal.outcome || "";
  goalForm.querySelector("#goal-due").value = goal.due_date || "";
  goalForm.querySelector("#goal-tags").value = (goal.tags || []).join(", ");
  const ids = goal.habit_ids || [];
  resetGoalHabitSelection(ids);
  openOverlay(goalOverlay);
}

function openReflectionForGoal(goal) {
  reflectionForm.querySelector("#reflection-period").value = autoPeriodLabel(new Date());
  const goalSelect = reflectionForm.querySelector("#reflection-goal");
  if (goalSelect) {
    goalSelect.value = goal.id;
  }
  openOverlay(reflectionOverlay);
}

function autoPeriodLabel(dateObj) {
  const month = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();
  const quarter = Math.floor((month - 1) / 3) + 1;
  return `${year}-Q${quarter}`;
}

async function deleteGoal(goalId) {
  const ok = confirm("Delete this goal? Linked habits will remain.");
  if (!ok) return;
  try {
    await api(`${API_BASE}/goals/${goalId}`, { method: "DELETE" });
    setStatus("Goal deleted");
    await loadGoals();
    await loadHabits();
  } catch (err) {
    console.error(err);
    setStatus("Failed to delete goal", true);
  }
}

function initThemePicker() {
  const palettes = {
    default: {
      "--bg": "#0f1b2c",
      "--panel": "#111f33",
      "--muted": "#a6b7d4",
      "--text": "#e6edf7",
      "--accent": "#ff6f61",
      "--accent-2": "#36c2cf",
      "--border": "#23344e",
      "--pill": "#1e2d44",
    },
    cyberpunk: {
      "--bg": "#0b0416",
      "--panel": "#1a0f2e",
      "--muted": "#e0b3ff",
      "--text": "#f7f7ff",
      "--accent": "#ff3fd8",
      "--accent-2": "#42fff5",
      "--border": "#351b52",
      "--pill": "#221136",
    },
    enterprise: {
      "--bg": "#0d1a26",
      "--panel": "#11263a",
      "--muted": "#9db3c9",
      "--text": "#f0f4f8",
      "--accent": "#2f80ed",
      "--accent-2": "#27ae60",
      "--border": "#1c3550",
      "--pill": "#163049",
    },
  };

  const root = document.documentElement;
  function applyTheme(name) {
    const palette = palettes[name] || palettes.default;
    Object.entries(palette).forEach(([k, v]) => root.style.setProperty(k, v));
    localStorage.setItem("focusos-theme", name);
  }

  const saved = localStorage.getItem("focusos-theme") || "default";
  applyTheme(saved);

  themeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      applyTheme(btn.dataset.theme);
    });
  });
}

function initOptionsMenu() {
  if (!optionsToggle || !optionsPanel) return;
  optionsToggle.addEventListener("click", () => {
    optionsPanel.hidden = !optionsPanel.hidden;
  });
  document.addEventListener("click", (e) => {
    if (!optionsPanel.hidden && !optionsPanel.contains(e.target) && e.target !== optionsToggle) {
      optionsPanel.hidden = true;
    }
  });
}

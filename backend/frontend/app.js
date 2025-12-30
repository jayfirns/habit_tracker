import { parseFocusMinutes, formatMinutes, computeWorkdayMinutes } from "./time-utils.js";
import { todayKey, todayValue, formatDate } from "./date-utils.js";
import { loadJson, saveJson } from "./storage.js";
import { makeApi } from "./api.js";
import { renderHabitsView } from "./ui/habitsView.js";
import { createDashboardView } from "./ui/dashboardView.js";

const API_BASE = window.location.origin;

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
const goalSpecificTitleInput = document.querySelector("#goal-specific-title");
const goalSpecificDescriptionInput = document.querySelector("#goal-specific-description");
const goalMeasurableInput = document.querySelector("#goal-measurable");
const goalAchievableInput = document.querySelector("#goal-achievable");
const goalRelevantInput = document.querySelector("#goal-relevant");
const goalDueInput = document.querySelector("#goal-due");
const goalTagsInput = document.querySelector("#goal-tags");
const goalFormError = document.querySelector("#goal-form-error");
const openReflectionBtn = document.querySelector("#open-reflection");
const closeReflectionBtn = document.querySelector("#close-reflection");
const reflectionOverlay = document.querySelector("#reflection-overlay");
const reflectionForm = document.querySelector("#reflection-form");
const goalsList = document.querySelector("#goals-list");
const newGoalBtn = document.querySelector("#new-goal");
const themeButtons = document.querySelectorAll("button[data-theme]");
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
const chartCenterLabel = document.querySelector("#chart-center-label");
const categoryChart = document.querySelector("#category-chart");
const categoryLegend = document.querySelector("#category-legend");
const energyTabs = document.querySelector("#energy-tabs");
const energyValueToggle = document.querySelector("#energy-value-toggle");
const goalHabitPicker = document.querySelector("#goal-habit-picker");
const goalHabitChips = document.querySelector("#goal-habit-chips");
const goalDashboardSection = document.querySelector("#goal-dashboard");
const goalHomeSlot = document.querySelector("#goal-home-slot");
const goalManagerSlot = document.querySelector("#goal-manager-slot");
const hero = document.querySelector(".hero");
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
  editingGoalScope: "quarter",
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

const apiClient = makeApi(API_BASE);
const dashboardView = createDashboardView(
  {
    periodLabel,
    periodPrompt,
    periodActions,
    habitCount,
    streakSummaryCard,
    goalCountEl,
    goalHighlightEl,
    goalHabitsLinkedEl,
    goalHabitCoverageEl,
    goalDueCountEl,
    goalDueLabelEl,
    goalScopeHighlightEl,
    goalNextStepEl,
    chartTotalPill,
    chartCenterValue,
    chartCenterLabel,
    categoryChart,
    categoryLegend,
    energyTabs,
    energyValueToggle,
    timeSummaryList,
    timeWorkdayPill,
    timeSummaryPercent,
  },
  {
    formatDate,
    formatMinutes,
    computeWorkdayMinutes,
    todayKey,
    getHabitMinutes,
    getTodayFocusedMinutes,
    collectHabitsWithTodayCompletions,
    latestCompletionNote,
  },
);

// Ensure overlay is hidden on load
if (editOverlay) {
  editOverlay.hidden = true;
}

const setStatus = (text, isError = false) => {
  statusEl.textContent = text;
  statusEl.style.color = isError ? "var(--accent)" : "var(--muted)";
};

function loadWorkdayConfig() {
  const saved = loadJson("focusos-workday", null);
  if (saved) {
    state.workday = { ...state.workday, ...saved };
  }
  if (workdayStartInput) workdayStartInput.value = state.workday.start;
  if (workdayHoursInput) workdayHoursInput.value = state.workday.hours;
  if (workdayWorkedOverride && state.workday.manualWorkedMinutes != null) {
    workdayWorkedOverride.value = state.workday.manualWorkedMinutes;
  }
}

function saveWorkdayConfig() {
  state.workday.setAt = new Date().toISOString();
  saveJson("focusos-workday", state.workday);
}

function loadTimeLogs() {
  state.timeLogs = loadJson("focusos-time-logs", {});
  const today = todayKey();
  const todayLogs = state.timeLogs?.[today] || {};
  state.timeLogs = { [today]: todayLogs };
  saveTimeLogs();
}

function loadManualLogs() {
  state.manualLogs = loadJson("focusos-manual-logs", {});
}

function saveManualLogs() {
  saveJson("focusos-manual-logs", state.manualLogs);
}

function saveTimeLogs() {
  saveJson("focusos-time-logs", state.timeLogs);
}

function loadActiveTimers() {
  state.activeTimers = loadJson("focusos-active-timers", {});
}

function saveActiveTimers() {
  saveJson("focusos-active-timers", state.activeTimers);
}

async function loadHabits() {
  setStatus("Loading...");
  try {
    const data = await apiClient.listHabits();
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
    const goals = await apiClient.listGoals();
    state.goals = goals;
    renderGoals();
    renderDashboard();
  } catch (err) {
    console.error("Failed to load goals", err);
  }
}

async function loadReflections() {
  try {
    const data = await apiClient.listReflections();
    state.reflections = data;
    renderDashboard();
  } catch (err) {
    console.error("Failed to load reflections", err);
  }
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
  renderHabitsView({
    container: habitsContainer,
    template: habitTemplate,
    activeTagEl: activeTag,
    streakSummaryEl: streakSummary,
    habits: state.habits,
    filterTag: state.filterTag,
    formatDate,
    todayValue,
    onFilterTag: setTagFilter,
    onComplete: completeHabit,
    onAdjustTime: adjustHabitMinutes,
    onToggleTimer: toggleHabitTimer,
    onDelete: deleteHabit,
    onEdit: openEdit,
    refreshHabitTimeDisplay,
    habitCardRefs,
  });
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
  await apiClient.createHabit({ name, category, tags });
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
  await apiClient.completeHabit(id, payload);
  setStatus("Logged");
  await loadHabits();
}

async function deleteHabit(id) {
  const ok = confirm("Delete this habit? This will remove its completions.");
  if (!ok) return;
  setStatus("Deleting...");
  await apiClient.deleteHabit(id);
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
    await apiClient.updateHabit(state.editingId, { name, category, tags });
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
  dashboardView.renderDashboard({
    now: new Date(),
    habits: state.habits,
    goals: state.goals,
    reflections: state.reflections,
    workday: state.workday,
    timeLogs: state.timeLogs,
    activeTimers: state.activeTimers,
  });
  updateGoalPriority(state.goals, state.reflections);
}

function updateGoalPriority(goals = [], reflections = []) {
  if (!goalDashboardSection || !goalHomeSlot || !goalManagerSlot) return;
  const quarterGoals = goals.filter((goal) => (goal.scope || "").toLowerCase() === "quarter");
  const activeQuarterGoals = quarterGoals.filter(
    (goal) => (goal.status || "active").toLowerCase() !== "complete",
  );
  const hasQuarterReflection = reflections.some(
    (reflection) => (reflection.reflection_type || "").toLowerCase() === "quarter",
  );
  const needsPriority =
    activeQuarterGoals.length > 0 || quarterGoals.length === 0 || !hasQuarterReflection;
  const target = needsPriority ? goalHomeSlot : goalManagerSlot;
  if (target && goalDashboardSection.parentElement !== target) {
    target.appendChild(goalDashboardSection);
  }
  goalDashboardSection.classList.toggle("demoted", !needsPriority);
  if (hero) {
    hero.classList.toggle("hero--single", !needsPriority);
  }
  if (goalHomeSlot) {
    goalHomeSlot.hidden = !needsPriority;
  }
}

function getHabitMinutes(habitId, timeLogs = state.timeLogs, activeTimers = state.activeTimers) {
  const logs = timeLogs || {};
  const today = todayKey();
  let todayMinutes = 0;
  const todaysHabits = logs[today] || {};
  todayMinutes = todaysHabits?.[habitId] || 0;
  const active = activeTimers?.[habitId];
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
  renderDashboard();
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

function getTodayFocusedMinutes(timeLogs = state.timeLogs, activeTimers = state.activeTimers) {
  const today = todayKey();
  let total = 0;
  const logs = timeLogs[today] || {};
  Object.values(logs).forEach((m) => (total += m || 0));
  Object.entries(activeTimers || {}).forEach(([_habitId, timer]) => {
    if (timer?.start) {
      const elapsed = Math.max(0, Math.floor((Date.now() - timer.start) / 60000));
      total += elapsed;
    }
  });
  return total;
}

function collectHabitsWithTodayCompletions(habits = state.habits) {
  const today = todayKey();
  const ids = new Set();
  habits.forEach((habit) => {
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

function latestCompletionNote(habitId, dateKey, habits = state.habits) {
  const habit = habits.find((h) => h.id === habitId);
  if (!habit) return null;
  const todayCompletions = (habit.completions || [])
    .filter((c) => c.date === dateKey)
    .sort((a, b) => (a.id || 0) - (b.id || 0));
  const last = todayCompletions[todayCompletions.length - 1];
  return last?.note || null;
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

function setGoalFormError(message = "") {
  if (!goalFormError) return;
  if (message) {
    goalFormError.textContent = message;
    goalFormError.hidden = false;
  } else {
    goalFormError.textContent = "";
    goalFormError.hidden = true;
  }
}

periodCta?.addEventListener("click", () => {
  state.editingGoalId = null;
  state.editingGoalScope = "quarter";
  goalForm.reset();
  resetGoalHabitSelection();
  setGoalFormError();
  openOverlay(goalOverlay);
});
reflectionCta?.addEventListener("click", () => {
  reflectionForm.querySelector("#reflection-period").value = autoPeriodLabel(new Date());
  openOverlay(reflectionOverlay);
});
newGoalBtn?.addEventListener("click", () => {
  state.editingGoalId = null;
  state.editingGoalScope = "quarter";
  goalForm.reset();
  resetGoalHabitSelection();
  setGoalFormError();
  openOverlay(goalOverlay);
});
closeGoalBtn?.addEventListener("click", () => {
  setGoalFormError();
  closeOverlay(goalOverlay);
});
goalOverlay?.addEventListener("click", (e) => {
  if (e.target === goalOverlay) {
    setGoalFormError();
    closeOverlay(goalOverlay);
  }
});

workdaySaveBtn?.addEventListener("click", () => {
  const startVal = workdayStartInput.value || "09:00";
  const hoursVal = parseFloat(workdayHoursInput.value) || 8;
  state.workday = { start: startVal, hours: Math.max(1, Math.min(16, hoursVal)) };
  state.workday.clockedOutAt = null;
  saveWorkdayConfig();
  updateWorkdayProgress();
  renderDashboard();
});

workdayClockoutBtn?.addEventListener("click", () => {
  state.workday.clockedOutAt = new Date().toISOString();
  state.workday.manualWorkedMinutes = null;
  saveWorkdayConfig();
  updateWorkdayProgress();
  renderDashboard();
});

workdayApplyWorkedBtn?.addEventListener("click", () => {
  const mins = parseInt(workdayWorkedOverride.value, 10);
  if (!Number.isNaN(mins) && mins >= 0) {
    state.workday.manualWorkedMinutes = mins;
    state.workday.clockedOutAt = null;
    saveWorkdayConfig();
    updateWorkdayProgress();
    renderDashboard();
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
  setGoalFormError();
  const specific_title = goalSpecificTitleInput?.value.trim() || "";
  const specific_description = goalSpecificDescriptionInput?.value.trim() || "";
  const measurable = goalMeasurableInput?.value.trim() || "";
  const achievable = goalAchievableInput?.value.trim() || "";
  const relevant = goalRelevantInput?.value.trim() || "";
  const due_date = goalDueInput?.value || null;
  const tags = parseTags(goalTagsInput?.value || "");
  const habit_ids = getGoalHabitSelection();
  if (!specific_title) {
    setGoalFormError("Add a clear, specific title before saving.");
    return;
  }
  if (!measurable) {
    setGoalFormError("Describe the measurable criteria so progress can be tracked.");
    return;
  }
  if (!due_date) {
    setGoalFormError("Choose a due date to keep this goal time-bound.");
    return;
  }
  try {
    const descriptionParts = [
      specific_description,
      achievable ? `Achievable: ${achievable}` : null,
      relevant ? `Relevant: ${relevant}` : null,
    ].filter(Boolean);
    const payload = {
      title: specific_title,
      description: descriptionParts.length ? descriptionParts.join("\n\n") : null,
      outcome: measurable,
      scope: state.editingGoalScope || "quarter",
      due_date,
      tags,
      habit_ids,
    };
    if (state.editingGoalId) {
      await apiClient.updateGoal(state.editingGoalId, payload);
      setStatus("Goal updated");
    } else {
      await apiClient.createGoal(payload);
      setStatus("Goal saved");
    }
    closeOverlay(goalOverlay);
    goalForm.reset();
    state.editingGoalId = null;
    state.editingGoalScope = "quarter";
    setGoalFormError();
    await loadGoals();
    await loadHabits();
  } catch (err) {
    console.error(err);
    const msg = err?.message || "Could not save goal. Please try again.";
    setStatus("Failed to save goal", true);
    setGoalFormError(msg);
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
  const responses = [reflectionForm.querySelector("#reflection-responses").value.trim()].filter(
    Boolean,
  );
  const goal_id =
    parseInt(reflectionForm.querySelector("#reflection-goal")?.value || "0", 10) || null;
  const rating = reflectionForm.querySelector("#reflection-rating")?.value || null;
  if (!period_label) {
    setStatus("Period label required", true);
    return;
  }
  try {
    await apiClient.createReflection({
      reflection_type,
      period_label,
      responses,
      prompts: [],
      goal_id,
      rating,
    });
    setStatus("Reflection saved");
    closeOverlay(reflectionOverlay);
    reflectionForm.reset();
  } catch (err) {
    console.error(err);
    setStatus("Failed to save reflection", true);
  }
});

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
  state.editingGoalScope = goal.scope || "quarter";
  if (goalSpecificTitleInput) goalSpecificTitleInput.value = goal.title || "";
  if (goalSpecificDescriptionInput) {
    goalSpecificDescriptionInput.value =
      goal.specific_description || goal.description || "";
  }
  if (goalMeasurableInput) {
    goalMeasurableInput.value = goal.measurable || goal.outcome || "";
  }
  if (goalAchievableInput) goalAchievableInput.value = goal.achievable || "";
  if (goalRelevantInput) goalRelevantInput.value = goal.relevant || "";
  if (goalDueInput) goalDueInput.value = goal.due_date || "";
  if (goalTagsInput) goalTagsInput.value = (goal.tags || []).join(", ");
  const ids = goal.habit_ids || [];
  resetGoalHabitSelection(ids);
  setGoalFormError();
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
    await apiClient.deleteGoal(goalId);
    setStatus("Goal deleted");
    await loadGoals();
    await loadHabits();
  } catch (err) {
    console.error(err);
    setStatus("Failed to delete goal", true);
  }
}

function initThemePicker() {
  const root = document.documentElement;
  const supportedThemes = ["default", "cyberpunk", "enterprise", "terminal"];

  function applyTheme(name) {
    const theme = supportedThemes.includes(name) ? name : "default";
    root.setAttribute("data-theme", theme);
    localStorage.setItem("focusos-theme", theme);
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

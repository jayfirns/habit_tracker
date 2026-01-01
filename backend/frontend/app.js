import { parseFocusMinutes, formatMinutes, computeWorkdayMinutes } from "./time-utils.js";
import { applyWorkdayEvent, getWorkdayUiState } from "./workday-state.js";
import { todayKey, todayValue, formatDate } from "./date-utils.js";
import { loadJson, saveJson } from "./storage.js";
import { makeApi } from "./api.js";
import { renderHabitsView } from "./ui/habitsView.js";
import { createDashboardView } from "./ui/dashboardView.js";
import { DELETE_HABIT_CONFIRMATION, deleteHabitFlow } from "./ui/deleteHabitFlow.js";
import { purgeHabitState } from "./ui/habitState.js";
import { removeHabitFromMilestoneSelection } from "./ui/milestoneSelection.js";

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
const closeMilestoneBtn = document.querySelector("#close-milestone");
const milestoneOverlay = document.querySelector("#milestone-overlay");
const milestoneForm = document.querySelector("#milestone-form");
const milestoneSpecificTitleInput = document.querySelector("#milestone-specific-title");
const milestoneSpecificDescriptionInput = document.querySelector("#milestone-specific-description");
const milestoneMeasurableInput = document.querySelector("#milestone-measurable");
const milestoneAchievableInput = document.querySelector("#milestone-achievable");
const milestoneRelevantInput = document.querySelector("#milestone-relevant");
const milestoneDueInput = document.querySelector("#milestone-due");
const milestoneTagsInput = document.querySelector("#milestone-tags");
const milestoneFormError = document.querySelector("#milestone-form-error");
const openReflectionBtn = document.querySelector("#open-reflection");
const closeReflectionBtn = document.querySelector("#close-reflection");
const reflectionOverlay = document.querySelector("#reflection-overlay");
const reflectionForm = document.querySelector("#reflection-form");
const milestonesList = document.querySelector("#milestones-list");
const newMilestoneBtn = document.querySelector("#new-milestone");
const themeButtons = document.querySelectorAll("button[data-theme]");
const optionsToggle = document.querySelector("#options-toggle");
const optionsPanel = document.querySelector("#options-panel");
const milestoneCountEl = document.querySelector("#milestone-count");
const milestoneHighlightEl = document.querySelector("#milestone-highlight");
const milestoneHabitsLinkedEl = document.querySelector("#milestone-habits-linked");
const milestoneHabitCoverageEl = document.querySelector("#milestone-habit-coverage");
const milestoneDueCountEl = document.querySelector("#milestone-due-count");
const milestoneDueLabelEl = document.querySelector("#milestone-due-label");
const milestoneScopeHighlightEl = document.querySelector("#milestone-scope-highlight");
const milestoneNextStepEl = document.querySelector("#milestone-next-step");
const chartTotalPill = document.querySelector("#chart-total-pill");
const chartCenterValue = document.querySelector("#chart-center-value");
const chartCenterLabel = document.querySelector("#chart-center-label");
const categoryChart = document.querySelector("#category-chart");
const categoryLegend = document.querySelector("#category-legend");
const energyTabs = document.querySelector("#energy-tabs");
const energyValueToggle = document.querySelector("#energy-value-toggle");
const milestoneHabitPicker = document.querySelector("#milestone-habit-picker");
const milestoneHabitChips = document.querySelector("#milestone-habit-chips");
const milestoneDashboardSection = document.querySelector("#milestone-dashboard");
const milestoneHomeSlot = document.querySelector("#milestone-home-slot");
const milestoneManagerSlot = document.querySelector("#milestone-manager-slot");
const hero = document.querySelector(".hero");
const workdayStartInput = document.querySelector("#workday-start");
const workdayHoursInput = document.querySelector("#workday-hours");
const workdaySaveBtn = document.querySelector("#workday-save");
const workdayClockinBtn = document.querySelector("#workday-clockin");
const workdayClockoutBtn = document.querySelector("#workday-clockout");
const workdayResetBtn = document.querySelector("#workday-reset");
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
  milestones: [],
  reflections: [],
  editingMilestoneId: null,
  editingMilestoneScope: "quarter",
  milestoneHabitSelection: new Set(),
  timeLogs: {},
  workday: {
    workdayDate: null,
    plannedStart: "09:00",
    plannedMinutes: null,
    clockInAt: null,
    clockOutAt: null,
    workedMinutesOverride: null,
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
    milestoneCountEl,
    milestoneHighlightEl,
    milestoneHabitsLinkedEl,
    milestoneHabitCoverageEl,
    milestoneDueCountEl,
    milestoneDueLabelEl,
    milestoneScopeHighlightEl,
    milestoneNextStepEl,
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

function normalizeWorkdayConfig(saved) {
  const normalized = {
    workdayDate: null,
    plannedStart: "09:00",
    plannedMinutes: null,
    clockInAt: null,
    clockOutAt: null,
    workedMinutesOverride: null,
  };
  if (!saved) return normalized;
  if (saved.workdayDate) normalized.workdayDate = saved.workdayDate;
  if (saved.workday_date) normalized.workdayDate = saved.workday_date;
  if (saved.plannedStart) normalized.plannedStart = saved.plannedStart;
  if (saved.planned_start) normalized.plannedStart = saved.planned_start;
  if (Number.isFinite(saved.plannedMinutes)) {
    normalized.plannedMinutes = Math.floor(saved.plannedMinutes);
  }
  if (Number.isFinite(saved.planned_minutes)) {
    normalized.plannedMinutes = Math.floor(saved.planned_minutes);
  }
  if (saved.clockInAt) normalized.clockInAt = saved.clockInAt;
  if (saved.clockOutAt) normalized.clockOutAt = saved.clockOutAt;
  if (saved.clock_in_at) normalized.clockInAt = saved.clock_in_at;
  if (saved.clock_out_at) normalized.clockOutAt = saved.clock_out_at;
  if (saved.workedMinutesOverride != null) {
    normalized.workedMinutesOverride = Math.floor(saved.workedMinutesOverride);
  }
  if (saved.worked_minutes_override != null) {
    normalized.workedMinutesOverride = Math.floor(saved.worked_minutes_override);
  }
  if (!saved.plannedStart && saved.start) normalized.plannedStart = saved.start;
  if (normalized.plannedMinutes == null && Number.isFinite(saved.hours)) {
    normalized.plannedMinutes = Math.floor(saved.hours * 60);
  }
  return normalized;
}

function resetWorkdayActuals() {
  state.workday = {
    ...state.workday,
    workdayDate: todayKey(),
    clockInAt: null,
    clockOutAt: null,
    workedMinutesOverride: null,
  };
}

function applyWorkdayInputs() {
  if (workdayStartInput) workdayStartInput.value = state.workday.plannedStart || "09:00";
  if (workdayHoursInput) {
    workdayHoursInput.value =
      state.workday.plannedMinutes != null ? String(state.workday.plannedMinutes / 60) : "";
  }
  if (workdayWorkedOverride && state.workday.workedMinutesOverride != null) {
    workdayWorkedOverride.value = state.workday.workedMinutesOverride;
  }
}

function serializeWorkdayForApi(workday) {
  return {
    workday_date: workday.workdayDate || todayKey(),
    planned_start: workday.plannedStart || "09:00",
    planned_minutes:
      Number.isFinite(workday.plannedMinutes) && workday.plannedMinutes > 0
        ? Math.floor(workday.plannedMinutes)
        : null,
    clock_in_at: workday.clockInAt || null,
    clock_out_at: workday.clockOutAt || null,
    worked_minutes_override:
      workday.workedMinutesOverride != null
        ? Math.floor(workday.workedMinutesOverride)
        : null,
  };
}

async function loadWorkdayConfig() {
  const saved = loadJson("focusos-workday", null);
  state.workday = { ...state.workday, ...normalizeWorkdayConfig(saved) };
  if (!state.workday.workdayDate) state.workday.workdayDate = todayKey();
  applyWorkdayInputs();
  updateWorkdayProgress();
  renderDashboard();

  try {
    const remote = await apiClient.getWorkdayState();
    const normalizedRemote = normalizeWorkdayConfig(remote);
    state.workday = { ...state.workday, ...normalizedRemote };
    if (state.workday.workdayDate !== todayKey()) {
      resetWorkdayActuals();
      void saveWorkdayConfig();
    }
    saveJson("focusos-workday", state.workday);
    applyWorkdayInputs();
    updateWorkdayProgress();
    renderDashboard();
  } catch (err) {
    console.warn("Failed to load workday state", err);
  }
}

async function saveWorkdayConfig() {
  state.workday.workdayDate = todayKey();
  saveJson("focusos-workday", state.workday);
  try {
    await apiClient.saveWorkdayState(serializeWorkdayForApi(state.workday));
  } catch (err) {
    console.warn("Failed to sync workday state", err);
  }
}

async function loadTimeLogs() {
  const today = todayKey();
  try {
    const logs = await apiClient.listTimeLogs({ startDate: today, endDate: today });
    const dayLogs = {};
    logs.forEach((log) => {
      const habitId = Number(log.habit_id);
      dayLogs[habitId] = (dayLogs[habitId] || 0) + Math.max(0, log.minutes || 0);
    });
    state.timeLogs = { [today]: dayLogs };
  } catch (err) {
    console.warn("Failed to load time logs", err);
    state.timeLogs = { [today]: {} };
  }
}

function saveTimeLogs() {}

function saveManualLogs() {}

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
    await loadTimeLogs();
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

async function loadMilestones() {
  try {
    const milestones = await apiClient.listMilestones();
    state.milestones = milestones;
    renderMilestones();
    renderDashboard();
  } catch (err) {
    console.error("Failed to load milestones", err);
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
  const metrics = computeWorkdayMinutes(state.workday, now);
  const uiState = getWorkdayUiState(state.workday);
  let pct = 0;

  if (metrics.mode === "clocked") {
    const plannedBase = metrics.plannedMinutes > 0 ? metrics.plannedMinutes : 480;
    pct =
      metrics.workedMinutes > 0
        ? Math.min(100, Math.max(0, (metrics.workedMinutes / plannedBase) * 100))
        : 0;
  }
  workdayProgress.style.width = `${pct}%`;

  if (metrics.mode === "planned") {
    workdayLabel.textContent = `Planned ${formatMinutes(metrics.plannedMinutes)} · ${formatMinutes(metrics.remainingMinutes)} remaining`;
  } else if (metrics.mode === "clocked") {
    const suffix = metrics.clockState === "running" ? " (running)" : "";
    workdayLabel.textContent = `${uiState.workedLabel}: ${formatMinutes(metrics.workedMinutes)}${suffix}`;
  } else {
    workdayLabel.textContent = "No workday data yet";
  }

  const startColor = [74, 222, 128]; // green
  const endColor = [239, 68, 68]; // red
  const mix = pct / 100;
  const color = startColor.map((c, idx) => Math.round(c + (endColor[idx] - c) * mix));
  workdayProgress.style.background = `rgb(${color.join(",")})`;

  if (workdayStartInput) workdayStartInput.disabled = !uiState.canPlan;
  if (workdayHoursInput) workdayHoursInput.disabled = !uiState.canPlan;
  if (workdaySaveBtn) workdaySaveBtn.disabled = !uiState.canPlan;
  if (workdayClockinBtn) workdayClockinBtn.disabled = !uiState.canClockIn;
  if (workdayClockoutBtn) workdayClockoutBtn.disabled = !uiState.canClockOut;
  if (workdayWorkedOverride) workdayWorkedOverride.disabled = !uiState.canOverride;
  if (workdayApplyWorkedBtn) workdayApplyWorkedBtn.disabled = !uiState.canOverride;
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
  await deleteHabitFlow({
    id,
    confirmDelete: (message) => confirm(message),
    confirmMessage: DELETE_HABIT_CONFIRMATION,
    apiClient,
    setStatus,
    purgeHabitState,
    state,
    onAfterDelete: (habitId) => {
      removeHabitFromMilestoneSelection({
        selection: state.milestoneHabitSelection,
        habitId,
        onRefreshOptions: populateHabitOptions,
        onRefreshChips: renderMilestoneHabitChips,
      });
    },
    saveTimeLogs,
    saveManualLogs,
    saveActiveTimers,
    loadHabits,
  });
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
    milestones: state.milestones,
    reflections: state.reflections,
    workday: state.workday,
    timeLogs: state.timeLogs,
    activeTimers: state.activeTimers,
  });
  updateMilestonePriority(state.milestones, state.reflections);
}

function updateMilestonePriority(milestones = [], reflections = []) {
  if (!milestoneDashboardSection || !milestoneHomeSlot || !milestoneManagerSlot) return;
  const quarterMilestones = milestones.filter((milestone) => (milestone.scope || "").toLowerCase() === "quarter");
  const activeQuarterMilestones = quarterMilestones.filter(
    (milestone) => (milestone.status || "active").toLowerCase() !== "complete",
  );
  const hasQuarterReflection = reflections.some(
    (reflection) => (reflection.reflection_type || "").toLowerCase() === "quarter",
  );
  const needsPriority =
    activeQuarterMilestones.length > 0 || quarterMilestones.length === 0 || !hasQuarterReflection;
  const target = needsPriority ? milestoneHomeSlot : milestoneManagerSlot;
  if (target && milestoneDashboardSection.parentElement !== target) {
    target.appendChild(milestoneDashboardSection);
  }
  milestoneDashboardSection.classList.toggle("demoted", !needsPriority);
  if (hero) {
    hero.classList.toggle("hero--single", !needsPriority);
  }
  if (milestoneHomeSlot) {
    milestoneHomeSlot.hidden = !needsPriority;
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
  void persistTimeLog(habitId, state.timeLogs[key][habitId], "timer");
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
  if (!state.timeLogs[today]) state.timeLogs[today] = {};
  state.timeLogs[today][habitId] = value;
  void persistTimeLog(habitId, value, "manual");
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

async function persistTimeLog(habitId, minutes, source) {
  const payload = {
    log_date: todayKey(),
    minutes: Math.max(0, Math.floor(minutes)),
    source,
  };
  try {
    await apiClient.createTimeLog(habitId, payload);
  } catch (err) {
    console.warn("Failed to persist time log", err);
  }
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

loadWorkdayConfig();
loadActiveTimers();
loadHabits();
loadMilestones();
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

function setMilestoneFormError(message = "") {
  if (!milestoneFormError) return;
  if (message) {
    milestoneFormError.textContent = message;
    milestoneFormError.hidden = false;
  } else {
    milestoneFormError.textContent = "";
    milestoneFormError.hidden = true;
  }
}

periodCta?.addEventListener("click", () => {
  state.editingMilestoneId = null;
  state.editingMilestoneScope = "quarter";
  milestoneForm.reset();
  resetMilestoneHabitSelection();
  setMilestoneFormError();
  openOverlay(milestoneOverlay);
});
reflectionCta?.addEventListener("click", () => {
  reflectionForm.querySelector("#reflection-period").value = autoPeriodLabel(new Date());
  openOverlay(reflectionOverlay);
});
newMilestoneBtn?.addEventListener("click", () => {
  state.editingMilestoneId = null;
  state.editingMilestoneScope = "quarter";
  milestoneForm.reset();
  resetMilestoneHabitSelection();
  setMilestoneFormError();
  openOverlay(milestoneOverlay);
});
closeMilestoneBtn?.addEventListener("click", () => {
  setMilestoneFormError();
  closeOverlay(milestoneOverlay);
});
milestoneOverlay?.addEventListener("click", (e) => {
  if (e.target === milestoneOverlay) {
    setMilestoneFormError();
    closeOverlay(milestoneOverlay);
  }
});

workdaySaveBtn?.addEventListener("click", () => {
  const startVal = workdayStartInput?.value || "09:00";
  const hoursVal = parseFloat(workdayHoursInput?.value);
  const plannedMinutes =
    Number.isFinite(hoursVal) && hoursVal > 0 ? Math.round(hoursVal * 60) : null;
  const result = applyWorkdayEvent(state.workday, {
    type: "plan",
    plannedStart: startVal,
    plannedMinutes,
  });
  if (result.ignored) return;
  state.workday = result.workday;
  void saveWorkdayConfig();
  updateWorkdayProgress();
  renderDashboard();
});

workdayClockinBtn?.addEventListener("click", () => {
  const result = applyWorkdayEvent(state.workday, {
    type: "clock_in",
    at: new Date().toISOString(),
  });
  if (result.ignored) return;
  state.workday = result.workday;
  void saveWorkdayConfig();
  updateWorkdayProgress();
  renderDashboard();
});

workdayClockoutBtn?.addEventListener("click", () => {
  const result = applyWorkdayEvent(state.workday, {
    type: "clock_out",
    at: new Date().toISOString(),
  });
  if (result.ignored) return;
  state.workday = result.workday;
  void saveWorkdayConfig();
  updateWorkdayProgress();
  renderDashboard();
});

workdayResetBtn?.addEventListener("click", () => {
  const startVal = workdayStartInput?.value || "09:00";
  const hoursVal = parseFloat(workdayHoursInput?.value);
  const plannedMinutes =
    Number.isFinite(hoursVal) && hoursVal > 0 ? Math.round(hoursVal * 60) : null;
  state.workday = {
    ...state.workday,
    workdayDate: todayKey(),
    plannedStart: startVal,
    plannedMinutes,
    clockInAt: null,
    clockOutAt: null,
    workedMinutesOverride: null,
  };
  void saveWorkdayConfig();
  applyWorkdayInputs();
  updateWorkdayProgress();
  renderDashboard();
});

workdayApplyWorkedBtn?.addEventListener("click", () => {
  const mins = parseInt(workdayWorkedOverride?.value, 10);
  if (Number.isNaN(mins) || mins < 0) return;
  const result = applyWorkdayEvent(state.workday, {
    type: "override_worked",
    minutes: mins,
  });
  if (result.ignored) return;
  state.workday = result.workday;
  void saveWorkdayConfig();
  updateWorkdayProgress();
  renderDashboard();
});

milestoneHabitPicker?.addEventListener("change", (event) => {
  const selectedId = parseInt(event.target.value, 10);
  if (!Number.isNaN(selectedId)) {
    state.milestoneHabitSelection.add(selectedId);
    populateHabitOptions();
    renderMilestoneHabitChips();
  }
  milestoneHabitPicker.value = "";
});

milestoneForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMilestoneFormError();
  const specific_title = milestoneSpecificTitleInput?.value.trim() || "";
  const specific_description = milestoneSpecificDescriptionInput?.value.trim() || "";
  const measurable = milestoneMeasurableInput?.value.trim() || "";
  const achievable = milestoneAchievableInput?.value.trim() || "";
  const relevant = milestoneRelevantInput?.value.trim() || "";
  const due_date = milestoneDueInput?.value || null;
  const tags = parseTags(milestoneTagsInput?.value || "");
  const habit_ids = getMilestoneHabitSelection();
  if (!specific_title) {
    setMilestoneFormError("Add a clear, specific title before saving.");
    return;
  }
  if (!measurable) {
    setMilestoneFormError("Describe the measurable criteria so progress can be tracked.");
    return;
  }
  if (!due_date) {
    setMilestoneFormError("Choose a due date to keep this milestone time-bound.");
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
      scope: state.editingMilestoneScope || "quarter",
      due_date,
      tags,
      habit_ids,
    };
    if (state.editingMilestoneId) {
      await apiClient.updateMilestone(state.editingMilestoneId, payload);
      setStatus("Milestone updated");
    } else {
      await apiClient.createMilestone(payload);
      setStatus("Milestone saved");
    }
    closeOverlay(milestoneOverlay);
    milestoneForm.reset();
    state.editingMilestoneId = null;
    state.editingMilestoneScope = "quarter";
    setMilestoneFormError();
    await loadMilestones();
    await loadHabits();
  } catch (err) {
    console.error(err);
    const msg = err?.message || "Could not save milestone. Please try again.";
    setStatus("Failed to save milestone", true);
    setMilestoneFormError(msg);
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
  const milestone_id =
    parseInt(reflectionForm.querySelector("#reflection-milestone")?.value || "0", 10) || null;
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
      milestone_id,
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
  if (!milestoneHabitPicker) return;
  milestoneHabitPicker.innerHTML = `<option value="">Select a habit to link</option>`;
  state.habits.forEach((habit) => {
    const opt = document.createElement("option");
    opt.value = habit.id;
    opt.textContent = `${habit.name} (${habit.category})`;
    if (state.milestoneHabitSelection.has(habit.id)) {
      opt.disabled = true;
    }
    milestoneHabitPicker.appendChild(opt);
  });
}

function renderMilestoneHabitChips() {
  if (!milestoneHabitChips) return;
  milestoneHabitChips.innerHTML = "";
  if (state.milestoneHabitSelection.size === 0) {
    milestoneHabitChips.innerHTML = `<span class="meta">No habits linked</span>`;
    return;
  }
  const byId = Object.fromEntries(state.habits.map((h) => [h.id, h]));
  Array.from(state.milestoneHabitSelection).forEach((id) => {
    const habit = byId[id];
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.innerHTML = `
      <span>${habit ? habit.name : `Habit ${id}`}</span>
      <button type="button" class="chip-remove" data-id="${id}" aria-label="Remove linked habit">×</button>
    `;
    milestoneHabitChips.appendChild(chip);
  });
  milestoneHabitChips.querySelectorAll(".chip-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id, 10);
      state.milestoneHabitSelection.delete(id);
      populateHabitOptions();
      renderMilestoneHabitChips();
    });
  });
}

function resetMilestoneHabitSelection(ids = []) {
  state.milestoneHabitSelection = new Set(ids);
  populateHabitOptions();
  renderMilestoneHabitChips();
}

function getMilestoneHabitSelection() {
  return Array.from(state.milestoneHabitSelection);
}

function populateReflectionMilestoneOptions() {
  const select = document.querySelector("#reflection-milestone");
  if (!select) return;
  select.innerHTML = `<option value="">(Optional) Link to milestone</option>`;
  state.milestones.forEach((milestone) => {
    const opt = document.createElement("option");
    opt.value = milestone.id;
    opt.textContent = milestone.title;
    select.appendChild(opt);
  });
}

function renderMilestones() {
  if (!milestonesList) return;
  milestonesList.innerHTML = "";
  populateHabitOptions();
  populateReflectionMilestoneOptions();
  if (state.milestones.length === 0) {
    milestonesList.innerHTML = `<p class="meta">No milestones yet. Tap the period pill to create one.</p>`;
    return;
  }
  state.milestones.forEach((milestone) => {
    const line = document.createElement("div");
    line.className = "milestone-line";
    const left = document.createElement("div");
    left.innerHTML = `<strong>${milestone.title}</strong><div class="meta">${milestone.scope} · ${milestone.status || "active"}</div>`;
    const actions = document.createElement("div");
    actions.className = "milestone-actions";
    const editBtn = document.createElement("button");
    editBtn.className = "ghost small";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => openMilestoneForEdit(milestone));
    const reflectBtn = document.createElement("button");
    reflectBtn.className = "ghost small";
    reflectBtn.textContent = "Reflect";
    reflectBtn.addEventListener("click", () => openReflectionForMilestone(milestone));
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "ghost small";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteMilestone(milestone.id));
    actions.appendChild(editBtn);
    actions.appendChild(reflectBtn);
    actions.appendChild(deleteBtn);
    line.appendChild(left);
    line.appendChild(actions);
    milestonesList.appendChild(line);
  });
}

function openMilestoneForEdit(milestone) {
  state.editingMilestoneId = milestone.id;
  state.editingMilestoneScope = milestone.scope || "quarter";
  if (milestoneSpecificTitleInput) milestoneSpecificTitleInput.value = milestone.title || "";
  if (milestoneSpecificDescriptionInput) {
    milestoneSpecificDescriptionInput.value =
      milestone.specific_description || milestone.description || "";
  }
  if (milestoneMeasurableInput) {
    milestoneMeasurableInput.value = milestone.measurable || milestone.outcome || "";
  }
  if (milestoneAchievableInput) milestoneAchievableInput.value = milestone.achievable || "";
  if (milestoneRelevantInput) milestoneRelevantInput.value = milestone.relevant || "";
  if (milestoneDueInput) milestoneDueInput.value = milestone.due_date || "";
  if (milestoneTagsInput) milestoneTagsInput.value = (milestone.tags || []).join(", ");
  const ids = milestone.habit_ids || [];
  resetMilestoneHabitSelection(ids);
  setMilestoneFormError();
  openOverlay(milestoneOverlay);
}

function openReflectionForMilestone(milestone) {
  reflectionForm.querySelector("#reflection-period").value = autoPeriodLabel(new Date());
  const milestoneSelect = reflectionForm.querySelector("#reflection-milestone");
  if (milestoneSelect) {
    milestoneSelect.value = milestone.id;
  }
  openOverlay(reflectionOverlay);
}

function autoPeriodLabel(dateObj) {
  const month = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();
  const quarter = Math.floor((month - 1) / 3) + 1;
  return `${year}-Q${quarter}`;
}

async function deleteMilestone(milestoneId) {
  const ok = confirm("Delete this milestone? Linked habits will remain.");
  if (!ok) return;
  try {
    await apiClient.deleteMilestone(milestoneId);
    setStatus("Milestone deleted");
    await loadMilestones();
    await loadHabits();
  } catch (err) {
    console.error(err);
    setStatus("Failed to delete milestone", true);
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

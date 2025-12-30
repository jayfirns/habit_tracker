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

const state = {
  habits: [],
  editingId: null,
  filterTag: null,
  goals: [],
  reflections: [],
  editingGoalId: null,
};

// Ensure overlay is hidden on load
if (editOverlay) {
  editOverlay.hidden = true;
}

const setStatus = (text, isError = false) => {
  statusEl.textContent = text;
  statusEl.style.color = isError ? "#ffb4a2" : "var(--muted)";
};

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
  } catch (err) {
    console.error("Failed to load goals", err);
  }
}

async function loadReflections() {
  try {
    const data = await api(`${API_BASE}/reflections`);
    state.reflections = data;
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

function renderHabits() {
  habitsContainer.innerHTML = "";
  let totalStreak = 0;

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
      node.querySelector(".js-name").textContent = habit.name;
      node.querySelector(".js-category").textContent = habit.name;
      node.querySelector(".js-name").textContent = "";
      node.querySelector(".js-last").textContent = `Last: ${formatDate(habit.last_completed)}`;
      node.querySelector(".js-streak").textContent = habit.streak ?? 0;
      node.querySelector(".js-completions").textContent = `${habit.completions.length} completions`;
      node.querySelector(".js-id").textContent = `ID ${habit.id}`;

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
  const payload = {};
  if (note) payload.note = note;
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
}

loadHabits();
loadGoals();
loadReflections();
initThemePicker();
initOptionsMenu();

function openOverlay(el) {
  el.hidden = false;
}

function closeOverlay(el) {
  el.hidden = true;
}

periodCta?.addEventListener("click", () => openOverlay(goalOverlay));
reflectionCta?.addEventListener("click", () => {
  reflectionForm.querySelector("#reflection-period").value = autoPeriodLabel(new Date());
  openOverlay(reflectionOverlay);
});
newGoalBtn?.addEventListener("click", () => {
  state.editingGoalId = null;
  goalForm.reset();
  openOverlay(goalOverlay);
});
closeGoalBtn?.addEventListener("click", () => closeOverlay(goalOverlay));
goalOverlay?.addEventListener("click", (e) => {
  if (e.target === goalOverlay) closeOverlay(goalOverlay);
});

goalForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = goalForm.querySelector("#goal-title").value.trim();
  const scope = goalForm.querySelector("#goal-scope").value;
  const outcome = goalForm.querySelector("#goal-outcome").value.trim();
  const due_date = goalForm.querySelector("#goal-due").value || null;
  const tags = parseTags(goalForm.querySelector("#goal-tags").value);
  const habit_ids = Array.from(goalForm.querySelector("#goal-habits").selectedOptions).map((o) =>
    parseInt(o.value, 10),
  );
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
  const select = document.querySelector("#goal-habits");
  if (!select) return;
  select.innerHTML = "";
  state.habits.forEach((habit) => {
    const opt = document.createElement("option");
    opt.value = habit.id;
    opt.textContent = `${habit.name} (${habit.category})`;
    select.appendChild(opt);
  });
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
    actions.appendChild(editBtn);
    actions.appendChild(reflectBtn);
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
  const select = goalForm.querySelector("#goal-habits");
  const ids = goal.habit_ids || [];
  Array.from(select.options).forEach((opt) => {
    opt.selected = ids.includes(parseInt(opt.value, 10));
  });
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

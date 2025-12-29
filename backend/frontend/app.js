const API_BASE = window.location.origin;
const HABITS_URL = `${API_BASE}/habits`;

const habitsContainer = document.querySelector("#habits");
const completionsContainer = document.querySelector("#completions");
const statusEl = document.querySelector("#status");
const streakSummary = document.querySelector("#streak-summary");
const form = document.querySelector("#habit-form");
const refreshBtn = document.querySelector("#refresh");
const habitTemplate = document.querySelector("#habit-template");

const state = {
  habits: [],
};

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
    renderHabits();
    renderCompletions();
    setStatus("Synced");
  } catch (err) {
    console.error(err);
    setStatus("Failed to load habits", true);
  }
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

  state.habits.forEach((habit) => {
    totalStreak += habit.streak || 0;
    const node = habitTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.id = habit.id;
    node.querySelector(".js-name").textContent = habit.name;
    node.querySelector(".js-category").textContent = habit.category;
    node.querySelector(".js-last").textContent = `Last: ${formatDate(habit.last_completed)}`;
    node.querySelector(".js-streak").textContent = habit.streak ?? 0;
    node.querySelector(".js-completions").textContent = `${habit.completions.length} completions`;
    node.querySelector(".js-id").textContent = `ID ${habit.id}`;

    node.querySelector(".js-complete").addEventListener("click", () => completeHabit(habit.id));
    node.querySelector(".js-delete").addEventListener("click", () => deleteHabit(habit.id));

    habitsContainer.appendChild(node);
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
  if (!name || !category) {
    setStatus("Name and category are required", true);
    return;
  }

  setStatus("Creating...");
  await api(HABITS_URL, {
    method: "POST",
    body: JSON.stringify({ name, category }),
  });
  setStatus("Created");
  form.reset();
  await loadHabits();
}

async function completeHabit(id) {
  const note = prompt("Add a note (optional):") ?? "";
  setStatus("Completing...");
  await api(`${HABITS_URL}/${id}/complete`, {
    method: "POST",
    body: JSON.stringify({ note }),
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

loadHabits();

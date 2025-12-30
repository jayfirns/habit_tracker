export function renderHabitsView({
  container,
  template,
  activeTagEl,
  streakSummaryEl,
  habits,
  filterTag,
  formatDate,
  todayValue,
  onFilterTag,
  onComplete,
  onAdjustTime,
  onToggleTimer,
  onDelete,
  onEdit,
  refreshHabitTimeDisplay,
  habitCardRefs = new Map(),
}) {
  if (!container || !template) return { totalStreak: 0, habitCardRefs };

  container.innerHTML = "";
  habitCardRefs.clear();

  const visibleHabits = filterTag
    ? habits.filter((h) => (h.tags || []).includes(filterTag))
    : habits;
  if (activeTagEl) {
    if (filterTag) {
      activeTagEl.hidden = false;
      activeTagEl.textContent = `Filter: #${filterTag}`;
    } else {
      activeTagEl.hidden = true;
    }
  }

  const byCategory = visibleHabits.reduce((acc, habit) => {
    const categoryName = habit.category || "Uncategorized";
    acc[categoryName] = acc[categoryName] || [];
    acc[categoryName].push(habit);
    return acc;
  }, {});

  let totalStreak = 0;
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
      const node = template.content.firstElementChild.cloneNode(true);
      node.dataset.id = habit.id;
      habitCardRefs.set(habit.id, node);
      node.querySelector(".js-name").textContent = habit.name;
      node.querySelector(".js-last").textContent = `Last: ${formatDate(habit.last_completed)}`;
      node.querySelector(".js-streak").textContent = habit.streak ?? 0;
      node.querySelector(".js-completions").textContent = `${habit.completions.length} completions`;
      node.querySelector(".js-id").textContent = `ID ${habit.id}`;
      refreshHabitTimeDisplay?.(habit.id, node);

      const tagRow = node.querySelector(".js-tag-row");
      if (tagRow) {
        (habit.tags || []).forEach((tag) => {
          const chip = document.createElement("span");
          chip.className = "pill";
          chip.textContent = `#${tag}`;
          chip.addEventListener("click", () => onFilterTag?.(tag));
          tagRow.appendChild(chip);
        });
        if (!habit.tags || habit.tags.length === 0) {
          const chip = document.createElement("span");
          chip.className = "pill subtle";
          chip.textContent = "No tags";
          tagRow.appendChild(chip);
        }
      }

      const dateInput = node.querySelector(".complete-date");
      const noteInput = node.querySelector(".complete-note");
      if (dateInput) dateInput.value = todayValue();

      node.querySelector(".js-complete")?.addEventListener("click", () =>
        onComplete?.(habit.id, {
          note: noteInput?.value,
          date: dateInput?.value,
        }),
      );
      node
        .querySelector(".js-adjust-time")
        ?.addEventListener("click", () => onAdjustTime?.(habit.id));
      node
        .querySelector(".js-timer-toggle")
        ?.addEventListener("click", () => onToggleTimer?.(habit.id));
      node.querySelector(".js-delete")?.addEventListener("click", () => onDelete?.(habit.id));
      node.querySelector(".js-edit")?.addEventListener("click", () => onEdit?.(habit));
      node.querySelector(".js-toggle")?.addEventListener("click", () => {
        node.classList.toggle("collapsed");
      });

      grid.appendChild(node);
    });

    block.appendChild(grid);
    container.appendChild(block);
  });

  if (streakSummaryEl) {
    streakSummaryEl.textContent = totalStreak;
  }

  return { totalStreak, habitCardRefs };
}

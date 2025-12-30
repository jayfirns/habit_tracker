export function createDashboardView(elements, helpers) {
  const {
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
    categoryChart,
    categoryLegend,
    timeSummaryList,
    timeWorkdayPill,
    timeSummaryPercent,
  } = elements;

  const {
    formatDate,
    formatMinutes,
    computeWorkdayMinutes,
    todayKey,
    getHabitMinutes,
    getTodayFocusedMinutes,
    collectHabitsWithTodayCompletions,
    latestCompletionNote,
  } = helpers;

  function renderDashboard({ now, habits, goals, reflections, workday, timeLogs, activeTimers }) {
    if (!periodLabel || !periodPrompt || !periodActions || !habitCount || !streakSummaryCard)
      return;

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

    habitCount.textContent = habits.length;
    streakSummaryCard.textContent = `${habits.reduce((sum, h) => sum + (h.streak || 0), 0)} streak days total`;
    renderGoalInsights(goals, habits, reflections);
    renderCategoryChart(habits);
    renderTimeSummary({ habits, workday, timeLogs, activeTimers });
  }

  function renderGoalInsights(goals = [], habits = [], reflections = []) {
    if (!goalCountEl) return;
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
      goalScopeHighlightEl.textContent = topScope
        ? `${topScope[1]} ${topScope[0]} goals`
        : "Quarter focus";
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
      reflections
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

  function renderCategoryChart(habits = []) {
    if (!categoryChart || !categoryLegend) return;

    const stats = habits.reduce((acc, habit) => {
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

    const palette = [
      "#ff6f61",
      "#36c2cf",
      "#8f7bff",
      "#ffd166",
      "#4ade80",
      "#f472b6",
      "#22d3ee",
      "#f97316",
    ];
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

  function renderTimeSummary({ habits, workday, timeLogs, activeTimers }) {
    if (!timeSummaryList) return;
    const today = todayKey();
    const todayLogs = timeLogs[today] || {};
    const { usedMinutes: computedWorked, totalMinutes: plannedMinutes } = computeWorkdayMinutes(
      workday,
      new Date(),
    );
    const actualMinutes =
      workday.manualWorkedMinutes != null
        ? Math.max(0, Math.floor(workday.manualWorkedMinutes))
        : computedWorked;
    const focusedMinutes = getTodayFocusedMinutes(timeLogs, activeTimers);
    if (timeWorkdayPill) {
      const label = workday.clockedOutAt ? "Clocked out" : "Planned";
      timeWorkdayPill.textContent = `${label}: ${formatMinutes(plannedMinutes)}`;
    }

    const habitIds = new Set([
      ...Object.keys(todayLogs),
      ...Object.keys(activeTimers || {}),
      ...collectHabitsWithTodayCompletions(habits),
    ]);

    const entries = Array.from(habitIds)
      .map((habitId) => {
        const minutes = getHabitMinutes(Number(habitId), timeLogs, activeTimers);
        const habit = habits.find((h) => h.id === Number(habitId));
        const note = latestCompletionNote(Number(habitId), today, habits);
        return {
          habitId: Number(habitId),
          minutes,
          name: habit ? habit.name : `Habit ${habitId}`,
          note,
        };
      })
      .filter((e) => e.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);

    const percentOfPlan =
      plannedMinutes > 0 ? Math.round((actualMinutes / plannedMinutes) * 100) : 0;
    const focusVsWorked =
      actualMinutes > 0 ? Math.round((focusedMinutes / actualMinutes) * 100) : 0;

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

  return { renderDashboard };
}

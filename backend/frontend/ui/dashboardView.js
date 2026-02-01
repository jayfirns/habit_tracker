import { createEnergyMixPanel } from "./energyMixPanel.js";

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
    goalOnTrackCountEl,
    goalOnTrackLabelEl,
    goalQuarterHighlightEl,
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

  const energyMixPanel = createEnergyMixPanel(
    {
      chartTotalPill,
      chartCenterValue,
      chartCenterLabel,
      categoryChart,
      categoryLegend,
      tabsContainer: energyTabs,
      valueToggleContainer: energyValueToggle,
    },
    { formatMinutes },
  );

  function renderDashboard({ now, habits, goals, weeklyProgress, quarterlyPrompt, reflections, workday, timeLogs, activeTimers }) {
    if (!periodLabel || !periodPrompt || !periodActions || !habitCount || !streakSummaryCard)
      return;

    const month = now.toLocaleString("default", { month: "long" });
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    periodLabel.textContent = quarterlyPrompt?.quarter || `Q${quarter} · ${month}`;

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
    periodPrompt.textContent = quarterlyPrompt?.message || `How do your habits today support your Q${quarter} goals?`;

    habitCount.textContent = habits.length;
    streakSummaryCard.textContent = `${habits.reduce((sum, h) => sum + (h.streak || 0), 0)} streak days total`;
    renderGoalInsights(goals, weeklyProgress, habits, reflections);
    energyMixPanel.render({ habits, timeLogs, activeTimers, now });
    renderTimeSummary({ habits, workday, timeLogs, activeTimers });
  }

  function renderGoalInsights(goals = [], weeklyProgress = [], habits = [], reflections = []) {
    if (!goalCountEl) return;
    const activeGoals = goals.filter(
      (goal) => (goal.status || "active").toLowerCase() === "active",
    );
    const completedGoals = goals.filter(
      (goal) => (goal.status || "").toLowerCase() === "complete",
    ).length;
    goalCountEl.textContent = activeGoals.length;

    // Count goals by quarter
    const quarterCounts = activeGoals.reduce((acc, goal) => {
      const q = goal.quarter || "Unknown";
      acc[q] = (acc[q] || 0) + 1;
      return acc;
    }, {});
    const topQuarter = Object.entries(quarterCounts).sort((a, b) => b[1] - a[1])[0];
    if (goalQuarterHighlightEl) {
      goalQuarterHighlightEl.textContent = topQuarter
        ? `${topQuarter[1]} goals in ${topQuarter[0]}`
        : "Quarter focus";
    }

    // Linked habits
    const linkedHabitIds = new Set();
    goals.forEach((goal) => (goal.habit_ids || []).forEach((id) => linkedHabitIds.add(id)));
    if (goalHabitsLinkedEl) {
      goalHabitsLinkedEl.textContent = linkedHabitIds.size;
    }
    const coverage = habits.length ? Math.round((linkedHabitIds.size / habits.length) * 100) : 0;
    if (goalHabitCoverageEl) {
      goalHabitCoverageEl.textContent = habits.length ? `${coverage}% coverage` : "No habits yet";
    }

    // On track count from weekly progress
    const onTrack = weeklyProgress.filter((p) => p.on_track).length;
    if (goalOnTrackCountEl) {
      goalOnTrackCountEl.textContent = onTrack;
    }
    if (goalOnTrackLabelEl) {
      if (weeklyProgress.length) {
        goalOnTrackLabelEl.textContent = `${onTrack}/${weeklyProgress.length} goals on track this week`;
      } else {
        goalOnTrackLabelEl.textContent = "No weekly progress yet";
      }
    }

    if (goalHighlightEl) {
      if (activeGoals.length) {
        const withFrequency = activeGoals.filter((goal) => goal.frequency > 0).length;
        goalHighlightEl.textContent = `${withFrequency}/${activeGoals.length} have frequency targets · ${completedGoals} completed`;
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

  function renderTimeSummary({ habits, workday, timeLogs, activeTimers }) {
    if (!timeSummaryList) return;
    const today = todayKey();
    const todayLogs = timeLogs[today] || {};
    const metrics = computeWorkdayMinutes(workday, new Date());
    const plannedMinutes = metrics.mode === "planned" ? metrics.plannedMinutes : 0;
    const actualMinutes = metrics.mode === "clocked" ? metrics.workedMinutes : 0;
    const focusedMinutes = getTodayFocusedMinutes(timeLogs, activeTimers);
    if (timeWorkdayPill) {
      if (metrics.mode === "planned") {
        timeWorkdayPill.textContent = `Planned: ${formatMinutes(metrics.plannedMinutes)}`;
      } else if (metrics.mode === "clocked") {
        timeWorkdayPill.textContent = `Worked: ${formatMinutes(metrics.workedMinutes)}`;
      } else {
        timeWorkdayPill.textContent = "";
      }
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
      plannedMinutes > 0 && actualMinutes > 0
        ? Math.round((actualMinutes / plannedMinutes) * 100)
        : null;
    const focusVsWorked =
      actualMinutes > 0 ? Math.round((focusedMinutes / actualMinutes) * 100) : null;

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
      const plannedLabel = plannedMinutes > 0 ? formatMinutes(plannedMinutes) : "—";
      const workedLabel = actualMinutes > 0 ? formatMinutes(actualMinutes) : "—";
      const percentLabel = percentOfPlan != null ? `${percentOfPlan}%` : "—";
      const focusLabel = actualMinutes > 0 ? formatMinutes(focusedMinutes) : "—";
      const focusPercentLabel = focusVsWorked != null ? `${focusVsWorked}% of worked` : "—";
      const totalRow = `
        <div class="time-row">
          <div class="time-cell meta">${plannedLabel}</div>
          <div class="time-cell meta">${workedLabel}</div>
          <div class="time-cell meta">${percentLabel}</div>
          <div class="time-cell meta">${focusLabel}</div>
          <div class="time-cell meta">${focusPercentLabel}</div>
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
          <div class="time-cell" style="grid-column: span 2;">Habit</div>
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

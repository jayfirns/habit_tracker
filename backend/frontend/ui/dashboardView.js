import { createEnergyMixPanel } from "./energyMixPanel.js";

export function createDashboardView(elements, helpers) {
  const {
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

  function renderDashboard({ now, habits, milestones, reflections, workday, timeLogs, activeTimers }) {
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
    periodPrompt.textContent = `How do your habits today support your Q${quarter} milestones?`;

    habitCount.textContent = habits.length;
    streakSummaryCard.textContent = `${habits.reduce((sum, h) => sum + (h.streak || 0), 0)} streak days total`;
    renderMilestoneInsights(milestones, habits, reflections);
    energyMixPanel.render({ habits, timeLogs, activeTimers, now });
    renderTimeSummary({ habits, workday, timeLogs, activeTimers });
  }

  function renderMilestoneInsights(milestones = [], habits = [], reflections = []) {
    if (!milestoneCountEl) return;
    const today = new Date();
    const activeMilestones = milestones.filter(
      (milestone) => (milestone.status || "active").toLowerCase() !== "complete",
    );
    const completedMilestones = milestones.length - activeMilestones.length;
    milestoneCountEl.textContent = activeMilestones.length;

    const scopeCounts = activeMilestones.reduce((acc, milestone) => {
      acc[milestone.scope] = (acc[milestone.scope] || 0) + 1;
      return acc;
    }, {});
    const topScope = Object.entries(scopeCounts).sort((a, b) => b[1] - a[1])[0];
    if (milestoneScopeHighlightEl) {
      milestoneScopeHighlightEl.textContent = topScope
        ? `${topScope[1]} ${topScope[0]} milestones`
        : "Quarter focus";
    }

    const linkedHabitIds = new Set();
    milestones.forEach((milestone) => (milestone.habit_ids || []).forEach((id) => linkedHabitIds.add(id)));
    if (milestoneHabitsLinkedEl) {
      milestoneHabitsLinkedEl.textContent = linkedHabitIds.size;
    }
    const coverage = habits.length ? Math.round((linkedHabitIds.size / habits.length) * 100) : 0;
    if (milestoneHabitCoverageEl) {
      milestoneHabitCoverageEl.textContent = habits.length ? `${coverage}% coverage` : "No habits yet";
    }

    const dueSoon = activeMilestones
      .map((milestone) => ({
        ...milestone,
        dueDate: milestone.due_date ? new Date(milestone.due_date) : null,
      }))
      .filter((milestone) => milestone.dueDate && !Number.isNaN(milestone.dueDate.getTime()))
      .sort((a, b) => a.dueDate - b.dueDate);
    const windowDate = new Date();
    windowDate.setDate(windowDate.getDate() + 30);
    const dueThisMonth = dueSoon.filter((milestone) => milestone.dueDate <= windowDate);
    if (milestoneDueCountEl) {
      milestoneDueCountEl.textContent = dueThisMonth.length;
    }
    if (milestoneDueLabelEl) {
      if (dueThisMonth.length) {
        const nearest = dueThisMonth[0];
        const daysLeft = Math.max(0, Math.round((nearest.dueDate - today) / (1000 * 60 * 60 * 24)));
        milestoneDueLabelEl.textContent = `${nearest.title} · ${formatDate(nearest.due_date)} (${daysLeft}d)`;
      } else if (dueSoon.length) {
        milestoneDueLabelEl.textContent = `${dueSoon.length} with dates · next ${formatDate(dueSoon[0].due_date)}`;
      } else {
        milestoneDueLabelEl.textContent = "No deadlines";
      }
    }

    if (milestoneHighlightEl) {
      if (activeMilestones.length) {
        const measurable = activeMilestones.filter((milestone) => milestone.outcome).length;
        milestoneHighlightEl.textContent = `${measurable}/${activeMilestones.length} have measurable outcomes · ${completedMilestones} completed`;
      } else if (milestones.length) {
        milestoneHighlightEl.textContent = `${milestones.length} archived or complete`;
      } else {
        milestoneHighlightEl.textContent = "Set your first target";
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

    if (milestoneNextStepEl) {
      if (latestReflection) {
        const detail = latestReflection.responses?.[0] || "Keep momentum.";
        milestoneNextStepEl.textContent = `Last reflection ${latestReflection.period_label}: ${detail}`;
      } else if (habits.length) {
        const topHabit = habits.slice().sort((a, b) => (b.streak || 0) - (a.streak || 0))[0];
        milestoneNextStepEl.textContent = `Link ${topHabit.name} to a milestone to lock intent.`;
      } else {
        milestoneNextStepEl.textContent = "Use SMART to define one measurable outcome this week.";
      }
    }
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

---
created: 2025-12-30T20:19
updated: 2025-12-30T23:56
---
# Energy Mix Panel

## Purpose
Dashboard panel that translates logged habit sessions into quick visual insight. It highlights how time is split across categories and habits, helps users spot imbalance (e.g., over-indexing on one category), and lets users switch chart modes without leaving the main dashboard.

## Objectives
- Visualize time allocation by category (pie chart) with a neutral empty state.
- Tabs switch between chart modes (pie, bars, grouped) without reloading data.
- Show bar charts for habit-level time logs (per-habit aggregation).
- Enable grouped bar views by category for side-by-side habit comparison.
- Support toggle between count vs duration views so users can see sessions vs minutes.

## Features
- [x] Category pie chart
- [x] Tab interface for switching chart modes
- [x] Habit-level bar chart (tab: Habits)
- [x] Grouped bar chart (tab: Grouped)
- [x] Toggle: duration vs frequency
- [ ] Hover tooltips with % breakdown
- [ ] Dark mode styling
- [ ] Responsive layout for mobile/desktop

## Enhancement Matrix

| Feature                     | Description                                              | TDD Spec          | UI Prototype      |
|-----------------------------|----------------------------------------------------------|-------------------|-------------------|
| Category Pie Chart         | Visualizes time spent per category                       | ✅ Implemented     | ✅ Complete        |
| Tabbed Chart View          | Switch between pie, bar, grouped bar                     | 🚧 TODO            | 🚧 TODO            |
| Habit-Level Breakdown      | Bar chart per habit with total time                      | 🚧 TODO            | 🚧 TODO            |
| Grouped Bar by Category    | Group habits by category for comparison                  | 🚧 TODO            | 🚧 TODO            |
| Duration vs Frequency View | Toggle between time and count                            | 🚧 TODO            | 🚧 TODO            |
| Hover Interactions         | Show tooltip with time, %, and count                     | 🚧 TODO            | 🚧 TODO            |
| Mobile Layout              | Reflow chart layout for small screens                    | 🚧 TODO            | 🚧 TODO            |

## Data Requirements

Expected data structure (example in JSON schema format):

```json
{
  "habitId": "uuid-1234",
  "habitName": "Meditate",
  "category": "Mindfulness",
  "durationMinutes": 15,
  "frequency": 1,
  "loggedAt": "2025-12-30T09:15:00Z"
}
```

Additional derived fields:
- dayOfWeek
- hourOfDay
- sessionCount (frequency fallback)
- categoryColor

## Persistence + Data Sources (Current)

- **Habits + completions** come from the backend API (SQLite tables `habits`, `completions`).
- **Duration minutes are not stored in the database.** There is no duration column in `habits` or `completions`.
- **Time logs** are stored client-side in local storage under `focusos-time-logs` (per-day minutes by habit id).
- **Manual overrides** are stored in local storage under `focusos-manual-logs`.
- **Active timers** are stored in local storage under `focusos-active-timers` until stopped.
- **Completion notes** may include focus durations (e.g., “20m focus”) and are parsed for duration unless a time log exists for the same date.

If local storage contains prior time logs for the same habit id, the Duration view will display those minutes even after a refresh. This can appear disconnected from the most recently completed habit when the new habit has no time logs or note minutes yet.

## Metric Definitions (Current + Intended)

**Frequency**
- Measures: total completion count per habit (`habit.completions.length`).
- Aggregation: totals are computed across all completions attached to a habit record, regardless of time logs.

**Duration**
- Intended to measure: accumulated focus minutes per habit.
- Current sources: `timeLogs` (manual/timer minutes) plus `activeTimers` elapsed minutes, aggregated per habit.
- Completion notes that include focus time (e.g., “20m focus”, “1h 05m focus”) are also included unless a time log exists for the same date.
- Habits without time tracking contribute `0` duration minutes; there is no explicit “time-enabled” flag in the habit model.
- **Clarified intent:** Duration views should exclude habits with zero minutes; zero-minute habits should appear only in Frequency views.

## Duration Scope + Workday Time Glide Relationship

- Energy Mix duration uses habit focus minutes (time logs + active timers). It does **not** read from Workday Time Glide state.
- Workday Time Glide tracks planned/clocked workday minutes for the whole day; Energy Mix tracks per-habit focus minutes. There is no documented data join between these panels.

## Duration vs Frequency: Current UI Behavior

- Duration does **not** display a zero-valued series. If no time minutes are logged, the panel shows an empty state (“No data available”) with cleared totals.
- The Duration toggle remains active while the empty state is shown; no frequency fallback is applied.

## Documentation Conflicts / Ambiguities

- `EnergyMixPanel.md` describes the panel as a time-allocation view, while `UI_PANELS_DOCUMENTATION.md` describes it as a completions distribution panel. This creates ambiguity about whether Frequency or Duration should be the primary metric.
- No doc defines a “time-enabled” habit model; duration currently treats all habits as eligible, with `0` duration when no time logs exist.

Development Notes
- Backed by tests in `backend/frontend/ui/energyMixPanel.test.mjs` and `energyMixPanel.dom.test.mjs`; keep new features covered.
- UI architecture: EnergyMixPanel (state + DOM bindings) renders pie/bars/grouped DOM and legend; tabs (`data-chart-mode` pie/habit/grouped) and value toggle (`data-value-mode` duration/frequency) drive client-side state.
- Starts with mock data if no habits exist and `mockEntries` are available; shows “No data available” for empty filtered series.
- Use chart containers that degrade gracefully if no data is available (fallback meta text, empty legend).
- Tabs and toggles are client-side only, driven by internal state.
- Add utility functions for grouping, sorting, and formatting time (e.g., minutes to HH:MM).
- Consider accessibility: color contrast and ARIA labels for tabbed interface; ensure tooltips are keyboard-triggerable and charts have text summaries.

## Debug Notes
- Ghost habits in the Energy Mix originate from `DEFAULT_MOCK_ENTRIES` in `backend/frontend/ui/energyMixPanel.js`.
- `normalizeEntries()` returns the mock entries when the `habits` array is empty and `mockEntries` is non-empty (defaults to `DEFAULT_MOCK_ENTRIES`).
- The dashboard calls `energyMixPanel.render({ habits, timeLogs, activeTimers, now })` without overriding `mockEntries`, so mock habits appear whenever `habits` is empty.

## Duration Behavior Analysis (Current State)

### How duration is currently calculated
- `aggregateTimeLogs()` sums minutes across all `timeLogs` day buckets and adds elapsed minutes from `activeTimers`.
- `normalizeEntries()` assigns `durationMinutes` per habit from aggregated time logs; `frequency` is the completion count.
- Completion notes with focus time are included unless a time log exists for the same date.
- `buildEnergyMixModel()` aggregates totals from `durationMinutes` (duration mode) or `frequency` (frequency mode).

### Why Duration shows an empty state today
- The duration model excludes zero-minute entries, so totals reach `0` when no time is logged.
- The render path does not rebuild in frequency mode; it renders the empty state instead.

### Where duration should logically diverge
- Any habit with time logs, active timers, or completion notes containing focus minutes should increase duration independently of completion counts.
- Habits without time tracking should be excluded from duration series entirely (unless a future “time-enabled” flag changes eligibility).

# Energy Mix Panel

## Purpose
Dashboard panel that translates logged habit sessions into quick visual insight. It highlights how time is split across categories and habits, helps users spot imbalance (e.g., over-indexing on one category), and will expand into tabbed chart modes for deeper comparisons without leaving the main dashboard.

## Goals
- Visualize time allocation by category (pie chart) with a neutral empty state.
- Add tabs to switch between chart modes (pie, bar, grouped bar) without reloading data.
- Show bar charts for habit-level time logs (per habit aggregation).
- Enable grouped bar views by category for side-by-side habit comparison.
- Support toggle between count vs duration views so users can see sessions vs minutes.

## Features
- [x] Category pie chart
- [ ] Tab interface for switching chart modes
- [ ] Habit-level bar chart
- [ ] Grouped bar chart (by category)
- [ ] Toggle: duration vs frequency
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
  "loggedAt": "2025-12-30T09:15:00Z"
}
```

Additional derived fields:
- dayOfWeek
- hourOfDay
- sessionCount
- categoryColor

Development Notes
- This panel must be built with TDD. No query logic or UI should be added without accompanying tests.
- UI architecture will modularize into: EnergyMixPanel, EnergyMixTabs, CategoryPieChart, HabitBarChart, and possibly a DashboardLegend.
- Start with mock data until queries are fully tested and validated.
- Use chart containers that degrade gracefully if no data is available (fallback meta text, empty legend).
- Tabs should be client-side only, driven by internal state.
- Add utility functions for grouping, sorting, and formatting time (e.g., minutes to HH:MM).
- Consider accessibility: color contrast and ARIA labels for tabbed interface; ensure tooltips are keyboard-triggerable and charts have text summaries.

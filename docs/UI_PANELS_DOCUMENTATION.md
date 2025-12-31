---
created: 2025-12-30T20:19
updated: 2025-12-31T11:12
---
# EnergyMixPanel
- Panel Title: Category Completions
- Semantic ID: EnergyMixPanel
- Location in app: Main layout after `#milestone-manager-slot`, rendered as `<section class="card chart-card wide">` in `backend/frontend/index.html`.
- Purpose: Visualize the distribution of habit completions by category, show total completions, and list category-level legend details.
For detailed design, development notes, and enhancement matrix, see [EnergyMixPanel.md](docs/panels/EnergyMixPanel.md).

| Element Name | Description | Example content | CSS class | Notes |
| --- | --- | --- | --- | --- |
| ChartCardShell | Gradient card container with border, radius, and shadow framing the chart and legend. | — | `card chart-card wide` | Uses the card surface instead of PanelShell; spans full grid width. |
| PanelHeader ([glossary](DESIGN_GLOSSARY.md#ui-design-glossary-new-habit--habit-board)) | Header row aligning eyebrow/title with the total pill. | — | `panel__header` | Inherits flex layout and spacing from shared header style. |
| Eyebrow ([glossary](DESIGN_GLOSSARY.md#glossary-legend)) | Upper label introducing the panel. | Energy mix | `eyebrow` | Accent2-colored label preceding the title. |
| PanelTitle ([glossary](DESIGN_GLOSSARY.md#ui-design-glossary-new-habit--habit-board)) | Section title for the panel. | Category Completions | `<h3>` | Uses heading defaults; sits under eyebrow. |
| Pill ([glossary](DESIGN_GLOSSARY.md#glossary-legend)) | Subtle pill showing total completions. | 0 logged | `pill subtle` (`#chart-total-pill`) | Updated dynamically with total completions count. |
| PieCanvas | SVG container for the donut chart. | Segmented donut by category | `pie-chart` (`#category-chart`) | Populated at runtime; falls back to meta text when empty. |
| ChartCenterBadge (glossary: [Badge](DESIGN_GLOSSARY.md#glossary-legend)) | Center-aligned total completions figure with muted label. | 12 / completions | `chart-center` with `badge__value`, `meta` | Badge number updates with total completions. |
| LegendGrid | Grid of category legend rows rendered per category. | Focus · 4 completions · 2 habits | `chart-legend` hosting `legend-item`, `legend-swatch`, `legend-title`, `meta` | Rows are generated from data; swatch color matches chart palette. |

- Interactions: Tab buttons (`data-chart-mode="pie" | "habit" | "grouped"`) and metric toggle buttons (`data-value-mode="duration" | "frequency"`) switch views and recalc totals client-side; render is driven by `createEnergyMixPanel` in `backend/frontend/ui/dashboardView.js`. Shows a “No data available” meta fallback when the active series is empty; uses mock entries on first load when no data exists.
- Design tokens used: Card surface/gradient uses `--bg1`, `--panel`, `--bg0`; border `--border`; radius `--radius-sm`; shadow `--shadow`; eyebrow uses `--accent2`; pill uses `--pill`, `--border`, `--muted`, `--text`; badge text uses theme typography defaults. Chart segments use a fixed JS palette (`#ff6f61`, `#36c2cf`, `#8f7bff`, `#ffd166`, `#4ade80`, `#f472b6`, `#22d3ee`, `#f97316`).
- References to relevant JS/HTML files: `backend/frontend/index.html` (markup), `backend/frontend/components.css` (card, pie, legend, pill, badge styling), `backend/frontend/base.css` + `backend/frontend/themes.css` (tokens), `backend/frontend/ui/dashboardView.js` (render logic and palette).

# MilestoneDashboardPanel
- Panel Title: Milestone Dashboard
- Semantic ID: MilestoneDashboardPanel
- Location in app: Hero insights column (`#milestone-home-slot`) as `<section class="panel insight-panel" id="milestone-dashboard">` in `backend/frontend/index.html`.
- Purpose: Summarize active SMART milestones, habit linkage, and upcoming deadlines with a next-step note.

| Element Name | Description | Example content | CSS class | Notes |
| --- | --- | --- | --- | --- |
| PanelShell ([glossary](DESIGN_GLOSSARY.md#ui-design-glossary-new-habit--habit-board)) | Panel container with panel surface, border, radius, and shadow. | — | `panel insight-panel` | Uses insight-panel styling for padding and shadow. |
| PanelHeader ([glossary](DESIGN_GLOSSARY.md#ui-design-glossary-new-habit--habit-board)) | Flex header row for eyebrow/title and scope pill. | — | `panel__header` | Shared layout spacing. |
| Eyebrow ([glossary](DESIGN_GLOSSARY.md#glossary-legend)) | Context eyebrow preceding title. | SMART pulse | `eyebrow` | Accent2 color label. |
| PanelTitle ([glossary](DESIGN_GLOSSARY.md#ui-design-glossary-new-habit--habit-board)) | Panel heading. | Milestone Dashboard | `<h3>` | Display font, default heading size. |
| ScopePill (glossary: [Pill](DESIGN_GLOSSARY.md#glossary-legend)) | Subtle pill showing dominant milestone scope. | Quarter focus | `pill subtle` (`#milestone-scope-highlight`) | Text updated by JS based on top scope count. |
| InsightGrid | Grid wrapper for the stat cards. | — | `insight-grid` | Responsive auto-fit columns. |
| InsightStatCard | Individual stat tile with border and subtle background. | Active milestones | `insight-stat` | Three instances for active milestones, linked habits, due soon. |
| StatLabel | Muted label for each stat. | Active milestones | `stat-label` | 12px, muted. |
| StatValue (glossary: [Badge](DESIGN_GLOSSARY.md#glossary-legend)) | Bold numeric value for the stat. | 3 | `stat-value` with IDs `milestone-count`, `milestone-habits-linked`, `milestone-due-count` | Populated dynamically. |
| StatNote | Supporting meta line under each stat. | Set your first target | `meta` with IDs `milestone-highlight`, `milestone-habit-coverage`, `milestone-due-label` | JS fills contextual text (coverage %, deadlines, highlights). |
| NextStepNote | Callout note suggesting next action. | Use SMART to define one measurable outcome this week. | `smart-note` (`#milestone-next-step`) | Border dashed, muted color-mix background. |

- Interactions: No direct user inputs. Content updates via `renderMilestoneInsights` in `backend/frontend/ui/dashboardView.js`, invoked from `renderDashboard` after habit/milestone/reflection data load. Scope pill text, stat values, coverage %, due labels, and next-step note are all data-driven.
- Design tokens used: Panel uses `--panel`, `--border`, `--radius`, `--shadow`; stat cards use color-mix on `--bg1` with `--border`; labels use `--muted`; stat values use theme text; pill uses `--pill`, `--border`, `--muted`, `--text`; next-step note uses dashed `--border` and color-mix on `--bg1`.
- References to relevant JS/HTML files: `backend/frontend/index.html` (markup), `backend/frontend/components.css` (insight-panel, insight-grid, insight-stat, smart-note, pill, eyebrow), `backend/frontend/base.css` + `backend/frontend/themes.css` (tokens), `backend/frontend/ui/dashboardView.js` (milestone insights logic), `backend/frontend/app.js` (dashboard view wiring).

# WorkdayTimeGlidePanel
- Panel Title: Workday Time Glide
- Semantic ID: WorkdayTimeGlidePanel
- Location in app: Hero dashboard row, first column `<section class="panel day-timer">` in `backend/frontend/index.html`.
- Purpose: Configure workday start/time window, view remaining vs used time, and update/apply manual worked minutes.
For detailed design, development notes, and enhancement matrix, see [panels/WorkdayTimeGlidePanel.md](docs/panels/WorkdayTimeGlidePanel.md).

| Element Name | Description | Example content | CSS class | Notes |
| --- | --- | --- | --- | --- |
| PanelShell ([glossary](DESIGN_GLOSSARY.md#ui-design-glossary-new-habit--habit-board)) | Panel container framing controls and progress bar. | — | `panel day-timer` | Uses panel surface/border/shadow. |
| PanelHeader ([glossary](DESIGN_GLOSSARY.md#ui-design-glossary-new-habit--habit-board)) | Header row with eyebrow/title and control cluster. | — | `panel__header` | Flex align center. |
| Eyebrow ([glossary](DESIGN_GLOSSARY.md#glossary-legend)) | Context label. | Workday | `eyebrow` | Accent2 color. |
| PanelTitle ([glossary](DESIGN_GLOSSARY.md#ui-design-glossary-new-habit--habit-board)) | Panel heading. | Time Glide | `<h3>` | Display font. |
| WorkdayControls | Inline control row for planned inputs and clock actions. | Start 09:00 / Planned hours 8 / Save plan / Clock in / Clock out / Reset day / Adjusted worked time | `day-controls` with inputs `#workday-start`, `#workday-hours`, `#workday-worked-override`; buttons `#workday-save`, `#workday-clockin`, `#workday-clockout`, `#workday-reset`, `#workday-apply-worked` | Inputs use global input styling; ghost/small buttons use `.button.ghost.small` and inherit focus ring tokens. |
| WorkdayBar | Horizontal bar showing worked vs planned. | Gradient bar with inner fill | `workday-bar` containing `workday-progress` and `workday-label` | Progress fill width and color animate with usage; label overlays center. |

- Interactions: Button clicks update workday state (`workday-save`, `clockout`, `apply-worked`) via listeners in `backend/frontend/app.js`, persisting to the backend `/workday` API (with local storage fallback) and re-rendering dashboard/progress. Backend state is the source of truth; local storage is cache only. Progress bar auto-updates every 60s (`setInterval(updateWorkdayProgress)`) and on workday changes; label shows remaining/used minutes computed in `computeWorkdayMinutes`.
- Design tokens used: Panel uses `--panel`, `--border`, `--radius`, `--shadow`; controls use input/button tokens (`--border`, `--radius-sm`, `--focus-ring`, `--accent`); progress bar gradients use `--accent`, `--accent2`; label text uses `--text`.
- References to relevant JS/HTML files: `backend/frontend/index.html` (markup), `backend/frontend/components.css` (day-controls, workday-bar/progress/label, panel, eyebrow), `backend/frontend/base.css` + `backend/frontend/themes.css` (tokens), `backend/frontend/app.js` (workday state, progress updates).

# TodaysFocusPanel
- Panel Title: Today’s Focus
- Semantic ID: TodaysFocusPanel
- Location in app: Hero dashboard row, second column `<section class="panel dashboard" id="dashboard">` in `backend/frontend/index.html`.
- Purpose: Present current period context with actions and quick stats (habits count, time summary, active milestones).

| Element Name | Description | Example content | CSS class | Notes |
| --- | --- | --- | --- | --- |
| PanelShell ([glossary](DESIGN_GLOSSARY.md#ui-design-glossary-new-habit--habit-board)) | Panel container housing the focus grid. | — | `panel dashboard` | Uses panel surface/border/shadow. |
| PanelHeader ([glossary](DESIGN_GLOSSARY.md#ui-design-glossary-new-habit--habit-board)) | Header row with eyebrow/title and CTA pills. | — | `panel__header` | Flex layout. |
| Eyebrow ([glossary](DESIGN_GLOSSARY.md#glossary-legend)) | Context label. | Alignment | `eyebrow` | Accent2 color. |
| PanelTitle ([glossary](DESIGN_GLOSSARY.md#ui-design-glossary-new-habit--habit-board)) | Main heading. | Today’s Focus | `<h2>` | Display font. |
| PillRow (glossary: [Pill](DESIGN_GLOSSARY.md#glossary-legend)) | Action pills to open milestone/reflection overlays. | Q1 · March / Reflection | `pill subtle period-cta` (`#period-cta`), `pill subtle` (`#reflection-cta`) | Click handlers open respective overlays; text populated by JS. |
| PeriodPrompt | Prompt text describing alignment question. | How do your habits today support your Q1 milestones? | `meta` (`#period-prompt`) | Filled by dashboard render. |
| PeriodActionsList | Bullet list of suggested actions. | Review top 3 habits... | `meta` list (`#period-actions`) | Items injected by JS. |
| HabitsSummaryBadge | Numeric badge card showing total habits and streak sum. | 5 Habits tracked | `badge card` with `badge__value`, `badge__label`, `meta` (`#habit-count`, `#streak-summary-card`) | Uses card gradient surface. |
| TimeSummaryCard | Card showing planned/worked/focus table and per-habit notes. | Planned/Worked/% Focused rows | `card time-summary` with `panel__header`, `time-summary-list` (`#time-summary-list`), `time-summary-percent` | Populated by `renderTimeSummary` (dashboardView). |
| ActiveMilestonesCard | Card listing active SMART milestones. | Active SMART Milestones, pills | `card milestones-card` with `panel__header`, `milestone-list` (`#milestones-list`) | Milestones rendered by `renderMilestones` in app.js. |

- Interactions: Pill buttons open overlays (`period-cta` opens milestone form, `reflection-cta` opens reflection form). Milestone creation button inside milestones card (`#new-milestone`) opens milestone overlay. Dashboard data refreshes on habit/milestone/reflection load via `renderDashboard` in `backend/frontend/app.js` using `dashboardView.renderDashboard`.
- Design tokens used: Panel uses `--panel`, `--border`, `--radius`, `--shadow`; cards use gradient surface with `--bg1`/`--bg0`, `--border`, `--radius-sm`, `--shadow`; pills use `--pill`, `--border`, `--muted`, `--text`; badges use display font and `--text`/`--muted`; time summary/table rows use `--border`, `--muted`.
- References to relevant JS/HTML files: `backend/frontend/index.html` (markup), `backend/frontend/components.css` (panel, pill, card, time-summary, milestone-list), `backend/frontend/base.css` + `backend/frontend/themes.css` (tokens), `backend/frontend/ui/dashboardView.js` (period text, time summary logic), `backend/frontend/app.js` (event handlers, milestone list render).

# NewHabitPanel
- Panel Title: New Habit
- Semantic ID: NewHabitPanel
- Location in app: Main layout, first panel in `<main>` (`backend/frontend/index.html`).
- Purpose: Create new habits with category, name, and tags inputs; display status feedback.

| Element Name | Description | Example content | CSS class | Notes |
| --- | --- | --- | --- | --- |
| PanelShell ([glossary](DESIGN_GLOSSARY.md#ui-design-glossary-new-habit--habit-board)) | Form container with panel styling. | — | `panel` | Standard panel surface. |
| PanelHeader ([glossary](DESIGN_GLOSSARY.md#ui-design-glossary-new-habit--habit-board)) | Header with eyebrow/title and status text. | Create / Ready | `panel__header` with `eyebrow`, `status` (`#status`) | Status color shifts on errors via inline style. |
| PanelTitle ([glossary](DESIGN_GLOSSARY.md#ui-design-glossary-new-habit--habit-board)) | Section heading. | New Habit | `<h2>` | Display font. |
| FormGrid | Responsive form layout for fields. | — | `form` (`#habit-form`) | Auto-fit minmax columns. |
| FieldLabel (glossary) | Muted label above each input. | Category | `<label>` | Uses global label styling. |
| TextInput (glossary) | Inputs for category, name, tags. | Focus, Health, Growth | `<input>` fields | Inherit focus ring, radius-sm, border tokens. |
| PrimaryCTAButton (glossary) | Full-width submit button. | Add Habit | `button full` | Accent background, strong shadow. |

- Interactions: Form submit triggers `createHabit` in `backend/frontend/app.js`, posting to API and reloading habits; validation enforces category/name; status text updates during actions. Inputs reset on success.
- Design tokens used: Panel uses `--panel`, `--border`, `--radius`, `--shadow`; labels use `--muted`; inputs use `--border`, `--radius-sm`, `--focus-ring`, `--bg1`/`--bg0`; primary button uses `--accent`, `--bg0`, `--shadow-strong`.
- References to relevant JS/HTML files: `backend/frontend/index.html` (markup), `backend/frontend/components.css` (panel, form, field, label, button), `backend/frontend/base.css` + `backend/frontend/themes.css` (tokens), `backend/frontend/app.js` (submit handling, status updates).

# HabitBoardPanel
- Panel Title: Habit Board
- Semantic ID: HabitBoardPanel
- Location in app: Main layout after New Habit (`<section class="panel" id="habit-board-panel">`) in `backend/frontend/index.html`.
- Purpose: Display all habits grouped by category with filtering, streak summary, and inline actions per habit card.

| Element Name | Description | Example content | CSS class | Notes |
| --- | --- | --- | --- | --- |
| PanelShell ([glossary](DESIGN_GLOSSARY.md#ui-design-glossary-new-habit--habit-board)) | Container for filters and habit grid. | — | `panel` | Standard panel styling. |
| PanelHeader ([glossary](DESIGN_GLOSSARY.md#ui-design-glossary-new-habit--habit-board)) | Header with eyebrow/title and filter row. | Track / Refresh | `panel__header` | Contains filters on right. |
| Eyebrow ([glossary](DESIGN_GLOSSARY.md#glossary-legend)) | Context label. | Track | `eyebrow` | Accent2 color. |
| PanelTitle ([glossary](DESIGN_GLOSSARY.md#ui-design-glossary-new-habit--habit-board)) | Section heading. | Habit Board | `<h2>` | Display font. |
| ActiveTagPill (glossary: [Pill](DESIGN_GLOSSARY.md#glossary-legend)) | Shows active tag filter. | Filter: #focus | `pill subtle` (`#active-tag`) | Hidden when no filter. |
| RefreshButton | Ghost small button to reload data. | Refresh | `ghost small` (`#refresh`) | Lacks `.button` class; renders as pill-like button. |
| CategoryBlock | Group per category containing title and habit cards grid. | Focus | `category-block` with `category-title` | Created dynamically in JS. |
| HabitsGrid | Responsive grid for habit cards. | — | `habits-grid` | Auto-fit columns. |

- Interactions: Refresh button calls `loadHabits`. Tag chips inside habit cards filter via `setTagFilter` (toggle behavior). Category/grouping generated in `renderHabitsView` (`backend/frontend/ui/habitsView.js`).
- Design tokens used: Panel uses `--panel`, `--border`, `--radius`, `--shadow`; pills use `--pill`, `--border`, `--muted`; category title text uses theme fonts; grid spacing inherits layout gap tokens.
- References to relevant JS/HTML files: `backend/frontend/index.html` (markup), `backend/frontend/components.css` (panel, habit-filters, category-block/title, pills), `backend/frontend/base.css` + `backend/frontend/themes.css` (tokens), `backend/frontend/ui/habitsView.js` (render logic), `backend/frontend/app.js` (event wiring).

# HabitCardPanel
- Panel Title: Habit Card
- Semantic ID: HabitCardPanel
- Location in app: Repeated inside Habit Board; template defined in `<template id="habit-template">` in `backend/frontend/index.html`.
- Purpose: Show individual habit details, streak, tags, timer controls, and completion inputs.

| Element Name | Description | Example content | CSS class | Notes |
| --- | --- | --- | --- | --- |
| CardShell | Habit card container with border, radius, shadow. | — | `habit-card` | Collapsible via `collapsed` modifier. |
| CardHeader | Clickable top row toggling body visibility. | Habit name, streak badge, chevron | `habit-card__top` with `.js-toggle` | Chevron rotates on collapse. |
| HabitNameTitle (glossary) | Habit title text. | Daily write | `.js-name` inside `<h3>` | Display font. |
| LastCompletedMeta | Last completion date. | Last: 2024-05-01 | `meta js-last` | Muted text. |
| StreakBadge (glossary: [Badge](DESIGN_GLOSSARY.md#glossary-legend)) | Gradient badge showing streak days. | 12 | `streak js-streak` | Fixed size, accent gradient. |
| HabitMetaRow | Inline pills for completions and ID. | 8 completions / ID 3 | `habit-card__meta` with `pill`, `pill subtle js-id` | Pills inherit pill tokens. |
| TagRow | Clickable tag chips for filtering. | #focus | `tag-row js-tag-row` with `pill` | Chips add filter via `onFilterTag`. |
| CompletionInline | Inputs to log completion with optional note. | Date + Mark done | `complete-inline` with `.complete-date`, `.complete-note`, `.js-complete` | Button uses `.button.small`. |
| FocusTimeMeta | Today focus minutes text. | Focus time: 25m today | `habit-time` containing `.meta .js-time-today` | Updated by timer/manual logs. |
| TimeActions | Timer and adjust buttons plus indicator pill. | Start timer / Adjust / Timer running | `time-actions` with `.button.ghost.small`, `.timer-indicator js-timer-indicator` | Indicator gains `.running` class when active. |
| CardActions | Edit/Delete ghost buttons. | Edit / Delete | `habit-card__actions` with `.button.ghost.small` | Delete triggers confirm. |

- Interactions: Header toggles collapse. Complete button posts completion (`onComplete`), timer toggle starts/stops active timer (`toggleHabitTimer`), adjust opens prompt (`adjustHabitMinutes`), edit/delete trigger overlay or API calls. Timer indicator updates every second via `updateRunningTimersUI`.
- Design tokens used: Card uses `--panel`, `--bg1`, `--border`, `--radius`, `--shadow`; pills use `--pill`, `--border`, `--muted`; badge uses `--accent`, `--accent2`, `--bg0`; buttons use accent/ghost tokens; focus indicator uses `--accent`.
- References to relevant JS/HTML files: `backend/frontend/index.html` (habit template markup), `backend/frontend/components.css` (habit-card, streak, pill, timer-indicator, buttons), `backend/frontend/base.css` + `backend/frontend/themes.css` (tokens), `backend/frontend/ui/habitsView.js` (render/build logic), `backend/frontend/app.js` (event handlers, timers, completions).

# RecentCompletionsPanel
- Panel Title: Recent Completions
- Semantic ID: RecentCompletionsPanel
- Location in app: Main layout after Energy Mix chart `<section class="panel wide">` in `backend/frontend/index.html`.
- Purpose: Timeline of recent habit completions with date, habit name, and note/reference.

| Element Name | Description | Example content | CSS class | Notes |
| --- | --- | --- | --- | --- |
| PanelShell ([glossary](DESIGN_GLOSSARY.md#ui-design-glossary-new-habit--habit-board)) | Wide panel container. | — | `panel wide` | Spans grid width. |
| PanelHeader ([glossary](DESIGN_GLOSSARY.md#ui-design-glossary-new-habit--habit-board)) | Header with eyebrow/title. | Reflect / Recent Completions | `panel__header` with `eyebrow` and `<h2>` | No actions in header. |
| Timeline | Container for completion rows. | — | `timeline` (`#completions`) | Rows inserted by JS. |
| TimelineRow | Individual completion entry with date pill, habit name, note, ID. | 2024-05-01 / Daily write / No note / #12 | `timeline__row` containing `pill`, `pill subtle`, `meta` | Uses border/radius background. |

- Interactions: None directly; rows are static. Populated by `renderCompletions` in `backend/frontend/app.js`, showing latest 12 completions sorted by date; shows meta fallback when empty.
- Design tokens used: Panel uses `--panel`, `--border`, `--radius`, `--shadow`; pills use `--pill`, `--border`, `--muted`; timeline rows use color-mix on `--bg1` with `--border`; text uses `--text`/`--muted`.
- References to relevant JS/HTML files: `backend/frontend/index.html` (markup), `backend/frontend/components.css` (panel, timeline__row, pill), `backend/frontend/base.css` + `backend/frontend/themes.css` (tokens), `backend/frontend/app.js` (renderCompletions logic).

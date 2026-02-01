---
created: 2025-12-30T21:52
updated: 2026-02-01T16:30
---
# HABIT_ARCHITECTURE.md

## Purpose

This document defines the conceptual hierarchy and naming semantics of the `habit_tracker` system. It is intended to clarify the differences between core entities (such as Habit, Milestone, Task, and To-Do), eliminate ambiguity in naming and architecture, and serve as a long-term reference for maintainability and user experience consistency.

This is a design philosophy document. It guides naming, relationships, and system boundaries, but does not describe implementation logic (see `LOGIC_RULES.md` for that).

---

## Terminology Philosophy

> **Everything begins and ends with the habit.**

The system does **not** treat legacy goals as primary entities. Rather, **habits are the atomic unit of transformation**, and all supporting concepts exist to help structure, measure, or encourage them. SMART Goals replace the legacy Goal/Milestone concepts and provide structured, measurable targets tied to habits.

---

## Concept Hierarchy (Top Down)

### 1. **Intention (Not Persisted)**

- A user's *intention* to build a habit is often framed using SMART criteria: Specific, Measurable, Achievable, Relevant, Time-bound.
- This may be presented in the UI as a structured “new habit” onboarding wizard.
- **This is not a persisted object.** Instead, it informs the creation of a Habit with structured metadata.

### 2. **Habit (Core Entity)**

- A Habit represents a repeatable behavior the user wants to maintain.
- Tracked over time via completions and streaks.
- Optional fields (TBD via schema updates):
  - `target_count`: for milestone-based habits (e.g., "Do 50 workouts")
  - `scope`: time-bound context (e.g., `month`, `quarter`, `year`)
  - `metrics`: daily, weekly, or interval-based frequency target
  - `category`, `tags`, etc.

### 3. **SMART Goal (Supporting Entity)**

- A SMART Goal is a structured target following the SMART framework: Specific, Measurable, Achievable, Relevant, Time-bound.
- Implemented as `SmartGoal` in the database model.
- Key fields:
  - `title`: Specific goal description
  - `measure_type`: "frequency" or "duration"
  - `frequency`/`duration_minutes`: Measurable targets
  - `success_threshold`: Achievable percentage (0-100)
  - `why_this_matters`: Relevance explanation
  - `quarter`/`due_date`: Time-bound constraints
  - `habit_ids`: Links to contributing habits
- Can be used to track progress against targets (e.g., "Exercise 3x per week").

### 4. **Completion (Event Record)**

- A dated record representing an instance of the habit being performed.
- Each completion may include:
  - Timestamp
  - Optional note or metadata
- Drives:
  - Streak updates
  - Time-use analytics
  - Retrospective reflection

### 5. **Reflection (Analysis Record)**

- Optional record attached to a Habit (or Milestone) for retrospective insight.
- Used to analyze outcomes, emotions, or subjective states.
- Helps connect intention to long-term outcomes.

### 6. **Workday State (Supporting System Entity)**

- A Workday State captures planned hours and actual clocked time for a single day.
- Persisted as a single shared record to support cross-device time tracking.
- Used by the Workday Time Glide panel for UI locking, progress, and summaries.

---

## Retired Terms

### ❌ Goal (Legacy Term)

- Formerly a standalone model with title, outcome, due_date, etc.
- Evolution: Goal → Milestone → SmartGoal
- Current implementation uses `SmartGoal` model with SMART framework fields.

### ⚠️ Milestone (Transitional Term)

- Previously used as the replacement for Goal.
- Now superseded by SmartGoal for richer SMART-based goal tracking.

## Planned Feature

### Task / To-Do

•	Task and To-Do are not currently implemented in the backend model or persisted schema.
•	These terms may appear as UI labels or placeholders, but they do not correspond to any database entity or API at this stage.
•	Their presence in this document reflects future design intentions: to introduce lightweight, ephemeral checklist items that may be linked to Habits for micro-tracking and routine management.
•	This placeholder entry exists to reserve semantic space and avoid conflicting usage or assumptions during development.

---

## Naming Guidelines

| Term | Use in Code | Notes |
|------|-------------|-------|
| `habit` | ✅ core entity | Central object; everything builds on this |
| `completion` | ✅ core entity | Tied to habit_id; stores date, note |
| `smart_goal` | ✅ supporting entity | SMART-based goal with habit links |
| `milestone` | ⚠️ legacy alias | Now replaced by SmartGoal |
| `goal` | ❌ legacy | Do not use standalone; use SmartGoal |
| `task`, `todo`, `action` | 🕓 not implemented | Do not imply existence via UI/labels |
| `workday_state` | ✅ supporting entity | Single shared record for time clock |

---

## Future Considerations

- A **HabitTemplate** model may be introduced for recurring setups.
- Custom streak logic per Habit (e.g., 3x/week vs daily) is under design.
- UI may introduce **habit grouping**, but this is a client-side abstraction.

---

## Authoritative Files

- Logic: `LOGIC_RULES.md`
- Schema: `backend/models.py`, `backend/schemas.py`
- Frontend: `backend/frontend/app.js`, `ui/*`
- Tests: `backend/tests/*`, `habit_tracker.py`

---

## Last Reviewed

- 2026-02-01 (Updated terminology: Milestone → SmartGoal)

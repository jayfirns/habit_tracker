---
created: 2025-12-30T22:02
updated: 2025-12-31T11:20
---
# LOGIC_RULES.md

## Purpose

This document defines system-level behavioral rules that govern core logic across state, persistence, aggregation, and UI consumption. It is a contract for behavior, not a description of implementation. All rules are derived from and validated by the repository’s test suite.

---

## Task / Milestone Lifecycle

### Milestone States

A Milestone **must** exist in one of the following states:
- `active`: A milestone that is currently in progress.
- `complete`: A milestone that has been successfully finished.
- `archived`: A milestone that has been deleted by a user.

### Task States

A Task (Habit) has no explicit state. It is either present in the system or it is not. Its history of associated completion records determines its streak and reporting analytics.

---

## Deletion Rules

### On Milestone Deletion

- When a Milestone is deleted, its state **must** transition to `archived`.
- Archived Milestones **must not** appear in standard list views.
- All associated data, including links to Tasks, **must** be preserved.
- Deletion of a Milestone **must not** trigger the deletion of any associated Tasks.

### On Task Deletion

- When a Task is deleted, its record **must** be permanently removed from the system.
- All completion records associated with the deleted Task **must** also be permanently removed.
- The system **guarantees** that no orphaned completion records will remain after a Task is deleted.
- Any in-memory state related to the deleted Task (e.g., active timers, local logs) **must** be purged.

---

## Modification of Completed Milestones

- A Milestone with a `complete` status **must** remain modifiable.
- The system **guarantees** that the status of a completed Milestone can be reverted to `active`.

---

## Relationship to Tests

- These rules are not merely descriptive; they are enforced by the automated test suite.
- The repository’s tests are the final authority on system behavior. Any discrepancy between this document and the test suite indicates that this document is out of date.
- Tests related to Milestones (`test_milestones.py`) assert the `archived` status transition on deletion and the modifiability of completed milestones.
- Tests related to Tasks (`test_api.py`, `habitState.test.mjs`) assert the permanent deletion of Tasks and the corresponding cleanup of all associated data from both persistence and local state.

---

## Workday Time Glide Rules

### Workday State Source of Truth

- The Workday state **must** be persisted in the backend via `/workday`.
- The backend response **must** be treated as authoritative across devices.
- Local storage **may** be used as a fallback cache when the backend is unavailable, but it **must not** override a valid backend state.
- On recovery from offline mode, the backend state **must** overwrite local cache on refresh.

### Workday Modes

- A Workday is in exactly one of three modes: `empty`, `planned`, or `clocked`.
- `planned` mode is active when `planned_minutes > 0` and no clock-in exists.
- `clocked` mode is active when `clock_in_at` is set, regardless of planned values.
- If `workday_date` does not match today, actual clock fields **must** reset to idle before UI locking is applied.

### Clocking Rules

- A day can only be clocked in once and clocked out once.
- `clock_out_at` **must not** be set unless `clock_in_at` exists.
- Manual worked-time overrides **must** be accepted only after clock out.
- After a clock-out, the state remains completed until a reset is performed.

### UI Locking Rules

- Planned-hour inputs and "Save plan" **must** be disabled once clocked in.
- Clock-in is only available from the idle state; clock-out only from the running state.

### Progress Calculation

- When clocked and a planned duration exists, progress **must** be calculated as `worked_minutes / planned_minutes`.
- When clocked and no planned duration exists, progress **must** assume an 8-hour (480 minute) base.

---

## Time Tracking Rules (Authoritative)

### Source of Truth

- All time tracking **must** be persisted in the backend database.
- Client-side storage **must not** be the authoritative source for habit time or workday time.
- Any derived time summaries displayed in UI panels **must** be backed by persisted records.

### Habit Time Tracking

- Habit focus time **must** be recorded as persisted, accumulated minutes per habit and date.
- Habit duration **must** be reconstructible solely from persisted records (not local storage).
- Completion notes **may** include time text, but notes **must not** be the only source of persisted time.

### Workday Time Tracking

- Workday planned and worked minutes **must** be persisted per day.
- Workday-derived summaries **must** be reproducible from stored workday records without local-only data.

### Consistency Requirements

- Time totals displayed across panels (Energy Mix, Time Glide, Focus summaries) **must** reconcile to the same persisted time records.
- If both habit time logs and workday logs exist, the system **must** define and document whether totals are expected to reconcile exactly or represent different scopes.

### Active Timers (Cross-Device)

- Active habit timers **must** be persisted with a start timestamp in the backend database.
- Refreshing the app on another device **must** reflect any running timers for the same habit.
- Stopping a timer **must** clear the persisted active timer and write a time log for the elapsed minutes.

### Current Implementation Status

- **Backend**: Habit time logs and active timers are correctly persisted in the backend database (`habit_time_logs` and `habit_timers` tables).
- **Frontend Integration Bug**: The frontend timer functions (`toggleHabitTimer`, `stopHabitTimer` in `app.js`) use fire-and-forget API calls (`void apiClient.startHabitTimer(...)`) without awaiting or error handling. If the backend call fails silently, the timer exists in local state but not in the database, causing cross-device sync failures.
- **Missing Test Coverage**: No frontend integration tests verify that timer start/stop operations correctly call the backend API or handle errors.
- **Symptom**: Timers started in one browser may not appear in another browser due to silent API failures.

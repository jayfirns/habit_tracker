# LOGIC_RULES.md

## Purpose

This document defines system-level behavioral rules that govern core logic across state, persistence, aggregation, and UI consumption. It is a contract for behavior, not a description of implementation. All rules are derived from and validated by the repository’s test suite.

---

## Task / Goal Lifecycle

### Goal States

A Goal **must** exist in one of the following states:
- `active`: A goal that is currently in progress.
- `complete`: A goal that has been successfully finished.
- `archived`: A goal that has been deleted by a user.

### Task States

A Task (Habit) has no explicit state. It is either present in the system or it is not. Its history of associated completion records determines its streak and reporting analytics.

---

## Deletion Rules

### On Goal Deletion

- When a Goal is deleted, its state **must** transition to `archived`.
- Archived Goals **must not** appear in standard list views.
- All associated data, including links to Tasks, **must** be preserved.
- Deletion of a Goal **must not** trigger the deletion of any associated Tasks.

### On Task Deletion

- When a Task is deleted, its record **must** be permanently removed from the system.
- All completion records associated with the deleted Task **must** also be permanently removed.
- The system **guarantees** that no orphaned completion records will remain after a Task is deleted.
- Any in-memory state related to the deleted Task (e.g., active timers, local logs) **must** be purged.

---

## Modification of Completed Goals

- A Goal with a `complete` status **must** remain modifiable.
- The system **guarantees** that the status of a completed Goal can be reverted to `active`.

---

## Relationship to Tests

- These rules are not merely descriptive; they are enforced by the automated test suite.
- The repository’s tests are the final authority on system behavior. Any discrepancy between this document and the test suite indicates that this document is out of date.
- Tests related to Goals (`test_goals.py`) assert the `archived` status transition on deletion and the modifiability of completed goals.
- Tests related to Tasks (`test_api.py`, `habitState.test.mjs`) assert the permanent deletion of Tasks and the corresponding cleanup of all associated data from both persistence and local state.

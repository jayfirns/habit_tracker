---
created: 2026-02-01T00:00
updated: 2026-02-01T18:00
---
# SMART Goals Data Flow

> **Authoritative architecture**: See [HABIT_ARCHITECTURE.md](HABIT_ARCHITECTURE.md) for entity definitions and naming guidelines.

## Overview

This document maps every file that touches SMART Goals and what each file's responsibility is. When adding/modifying fields, ALL of these must be updated.

## Data Flow: Create/Update Goal

```
User fills form
       ↓
index.html          Form HTML (field inputs, IDs, names)
       ↓
app.js              Collects values, validates, calls API
       ↓
api.js              HTTP POST/PUT to /goals endpoint
       ↓
main.py             FastAPI route, validates via Pydantic schema
       ↓
schemas.py          SmartGoalCreate/SmartGoalUpdate validation
       ↓
crud.py             create_goal()/update_goal() - WRITES TO DATABASE
       ↓
models.py           SQLAlchemy model definition
       ↓
database            SQLite file (via migration)
```

## Data Flow: Read/Edit Goal

```
database
       ↓
models.py           SQLAlchemy model
       ↓
crud.py             list_goals()/get_goal() - READS FROM DATABASE
       ↓
schemas.py          SmartGoalRead serialization
       ↓
main.py             Returns JSON
       ↓
api.js              Receives JSON
       ↓
app.js              Populates form via openGoalForEdit()
       ↓
index.html          Displays in form
```

## File Responsibilities

### Frontend

| File | Responsibility | Fields Must Be In |
|------|----------------|-------------------|
| `index.html` | Form HTML structure | Input elements with correct IDs |
| `app.js` | Form handling, validation, API calls | Element refs, submit handler, edit population |
| `api.js` | HTTP client | N/A (passes payload through) |
| `ui/smartGoalForm.js` | Pure utility functions | Payload building logic |
| `ui/dashboardView.js` | Dashboard display | Reading goal properties |

### Backend

| File | Responsibility | Fields Must Be In |
|------|----------------|-------------------|
| `schemas.py` | Pydantic validation | SmartGoalBase, SmartGoalCreate, SmartGoalUpdate, SmartGoalRead |
| `main.py` | API routes | N/A (uses schemas) |
| `crud.py` | Database operations | **create_goal(), update_goal()** - CRITICAL |
| `models.py` | SQLAlchemy model | Column definitions |
| `migrate_*.py` | Schema migrations | ALTER TABLE statements |

### Tests

| File | Responsibility |
|------|----------------|
| `tests/test_goals.py` | Backend CRUD and API tests |
| `tests/test_api.py` | General API tests |
| `ui/smartGoalForm.test.mjs` | Frontend utility tests |
| `ui/smartGoalEdit.test.mjs` | **TODO**: Frontend edit flow tests (openGoalForEdit) |

## Current Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | yes | Specific goal |
| measure_type | enum | yes | "frequency" or "duration" |
| frequency | int | conditional | When measure_type=frequency |
| duration_minutes | int | conditional | When measure_type=duration |
| frequency_period | enum | yes | "week" or "month" |
| success_threshold | int | yes | 0-100, default 80 |
| why_this_matters | string | no | Relevance |
| quarter | string | yes | e.g., "Q1 2026" |
| due_date | date | no | Specific deadline |
| tags | array | no | Classification |
| habit_ids | array | no | Linked habits |
| status | enum | yes | active/complete/archived |
| created_at | datetime | auto | Creation timestamp |

## Checklist: Adding a New Field

When adding a field to SmartGoal, update ALL of these:

- [ ] `models.py` - Add Column
- [ ] `schemas.py` - Add to SmartGoalBase, SmartGoalCreate, SmartGoalUpdate
- [ ] `crud.py` - Add to create_goal() AND update_goal()
- [ ] `migrate_*.py` - Create migration script
- [ ] `index.html` - Add form input
- [ ] `app.js` - Add element ref, submit handling, edit population
- [ ] `tests/test_goals.py` - Add test coverage
- [ ] `ui/smartGoalForm.test.mjs` - Add frontend tests if applicable
- [ ] Rebuild Docker: `docker compose build --no-cache && docker compose up -d`

## Bug History

**FIXED (2026-02-01)**: The following fields were missing from crud.py but have been added:
- `measure_type` - Added to create_goal() and update_goal()
- `duration_minutes` - Added to create_goal() and update_goal()
- `due_date` - Added to create_goal() and update_goal()

All SMART Goal fields now persist correctly.

# SMART Goals Panel

## Overview

The SMART Goals panel enables users to define goals using the SMART framework:
- **S**pecific: Clear, actionable goal title
- **M**easurable: Quantifiable target (frequency OR duration per period)
- **A**chievable: Success threshold percentage
- **R**elevant: Why this goal matters
- **T**ime-bound: Quarter + optional due date

## Data Model

### SmartGoal

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | int | auto | Primary key |
| title | string | yes | Specific goal description |
| measure_type | enum | yes | "frequency" or "duration" |
| frequency | int | conditional | Times per period (when measure_type=frequency) |
| duration_minutes | int | conditional | Minutes per period (when measure_type=duration) |
| frequency_period | enum | yes | "week" or "month" |
| success_threshold | int | yes | 0-100, default 80 |
| why_this_matters | string | no | Relevance explanation |
| quarter | string | yes | e.g., "Q1 2026" |
| due_date | date | no | Specific deadline, defaults to end of quarter |
| tags | array | no | Classification tags |
| habit_ids | array | no | Linked habits that contribute to this goal |
| status | enum | yes | "active", "complete", "archived" |
| created_at | datetime | auto | Creation timestamp |

## UI Components

### Form Fields

#### S — Specific Goal
- Text input for goal title
- Required, min 1 character
- Placeholder: "Build consistent fitness habit"

#### M — Measurable (Toggle)
- Radio toggle: Frequency vs Duration
- Only ONE numeric input visible at a time based on toggle selection
- **Frequency mode**: "Target count" (1-99), label: "times per [period]"
- **Duration mode**: "Target minutes" (1-9999), label: "minutes per [period]"
- Period selector: Week or Month

#### A — Success Threshold
- Numeric input 0-100
- Default: 80
- Label: "Success threshold (%)"
- Helper: "Hit this percentage of your target to be 'on track'"

#### R — Why This Matters
- Textarea, optional
- Placeholder: "Explain why this goal is relevant to your bigger picture"

#### T — Time-bound
- **Quarter**: Text input, required (e.g., "Q1 2026")
- **Due date**: Date picker, optional
  - Auto-populates to end of quarter when quarter is entered
  - User can override
  - Calendar picker must render correctly

### Behavior Specifications

#### Measure Type Toggle
1. When "Frequency" selected:
   - Show "Target count" input
   - Hide "Target minutes" input
   - Validation requires frequency >= 1

2. When "Duration" selected:
   - Show "Target minutes" input
   - Hide "Target count" input
   - Validation requires duration_minutes >= 1

3. On form reset:
   - Default to "Frequency" mode
   - Reset visibility accordingly

#### Quarter Auto-Population
1. When quarter field changes (e.g., "Q1 2026"):
   - Parse quarter and year
   - Calculate end of quarter date:
     - Q1: March 31
     - Q2: June 30
     - Q3: September 30
     - Q4: December 31
   - If due_date is empty OR matches previous auto-calculated value:
     - Set due_date to end of quarter
   - If due_date was manually changed:
     - Do not override

#### Form Submission
1. Collect all field values
2. Validate:
   - title required
   - measure_type required
   - If frequency mode: frequency >= 1
   - If duration mode: duration_minutes >= 1
   - quarter required
3. Build payload with only the relevant measure field (frequency OR duration_minutes, not both)
4. POST to /goals (create) or PUT to /goals/{id} (update)
5. On success: close overlay, reset form, reload goals

#### Edit Mode
1. Populate all fields from existing goal
2. Set measure_type toggle based on goal.measure_type
3. Show correct input (frequency or duration) based on toggle
4. Populate due_date from goal.due_date

## Deployment

This app runs via Docker. After code changes:
```bash
docker compose build --no-cache && docker compose up -d
```

## Testing Requirements

Per TESTING_MANDATES.md:
1. Toggle behavior: verify correct input visibility
2. Quarter parsing: verify date calculation
3. Auto-population: verify due_date defaults
4. Form validation: verify error states
5. Payload structure: verify only relevant measure field sent

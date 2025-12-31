---
created: 2025-12-31T00:00
updated: 2025-12-31T00:52
---
# Workday Time Glide Panel

## Purpose
This panel provides a simple, reliable daily time clock for a single workday. It supports two mutually exclusive modes: a **Planned Day** (expectation only) and an **Actual Clocked Day** (single clock in/out). Manual worked-time adjustments are allowed only after clock out and are explicitly labeled as overrides.

## Objectives
- Configure planned start time and planned duration (hours).
- Clock in once and clock out once for the actual day.
- Display planned time (when set) without tracking real-time usage.
- Display worked time (authoritative) when clocked, with optional post-clock-out override.
- Keep planned and actual modes fully separate in UI and math.
- Persist workday state to local storage.

## Features
- [x] Planned start time input
- [x] Planned duration input (hours)
- [x] "Save plan" button (clears any active clock state)
- [x] "Clock in" button (single use, state locked)
- [x] "Clock out" button (single use, state locked)
- [x] Manual worked minutes override (post-clock-out only, labeled)
- [x] Progress bar with mode-appropriate labeling
- [x] Persistence of settings to local storage

## Enhancement Matrix

| Feature | Description | TDD Spec | UI Prototype |
| :------------------------------ | :------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------ | :--------------------------------------------------------------------- |
| Planned Day Setup             | Inputs for planned start time and planned duration, with a button to save these settings (no real-time tracking).          | ✅ Implemented                                                      | ✅ Complete                                                            |
| Actual Clocked Day            | Single clock in and clock out; state-locked buttons prevent stacking or repeats.                                           | ✅ Implemented                                                      | ✅ Complete                                                            |
| Worked Override               | Manual worked minutes override allowed only after clock out; labeled as an adjustment.                                    | ✅ Implemented                                                      | ✅ Complete                                                            |
| Progress Display              | Progress bar + label reflect the active mode (planned vs. clocked), no mixed summaries.                                   | ✅ Implemented                                                      | ✅ Complete                                                            |
| Local Storage Persistence     | Workday plan, clock events, and overrides are saved and loaded from local storage across sessions.                         | ✅ Implemented                                                      | ✅ Complete                                                            |
| Responsive Layout             | Ensures the panel adapts gracefully to various screen sizes.                                                             | 🚧 TODO (Requires broader frontend responsive design efforts)      | 🚧 TODO                                                                |
| Visual Feedback for Actions   | Provide immediate visual cues (e.g., button state changes, brief messages) when configurations are saved or actions taken. | 🚧 TODO                                                             | 🚧 TODO                                                                |
| Integration with Focus Summaries | Ensure manual overrides and clock-out times are accurately reflected in daily focus summaries and other relevant panels. | 🚧 TODO                                                             | 🚧 TODO                                                                |

## Data Requirements

The panel primarily interacts with client-side state and local storage. Key data points include:

```json
{
  "plannedStart": "09:00",          // HH:MM format
  "plannedMinutes": 480,            // Integer, total planned minutes
  "clockInAt": "2025-01-15T09:00:00.000Z",  // ISO timestamp (nullable)
  "clockOutAt": "2025-01-15T17:00:00.000Z", // ISO timestamp (nullable)
  "workedMinutesOverride": 420      // Integer, post-clock-out override (nullable)
}
```

Derived data (calculated client-side):
- `plannedEndTime`: `plannedStart + plannedMinutes`
- `workedMinutes`: derived from `clockInAt` → `clockOutAt` when present
- `remainingMinutes`: `plannedMinutes` in planned mode only

## Development Notes
- The panel's UI elements and interactions are defined in `backend/frontend/index.html` (markup), styled by `backend/frontend/components.css` (`.day-controls`, `.workday-bar`, `.workday-progress`, `.workday-label`), and orchestrated by `backend/frontend/app.js` (workday state management, progress updates, event listeners).
- Workday state is managed in `app.js` and persisted to local storage using `storage.js`.
- Workday state transitions and UI state locking are centralized in `backend/frontend/workday-state.js`.
- Progress bar updates are handled by a `setInterval` in `app.js` that calls `updateWorkdayProgress` and recalculates time values using `computeWorkdayMinutes`.
- Event listeners for "Save plan", "Clock in", "Clock out", and "Apply adjustment" buttons are defined in `app.js`.
- Design tokens from `backend/frontend/base.css` and `backend/frontend/themes.css` are used for styling, ensuring consistency with the overall application theme.
- Accessibility considerations include clear labeling for input fields and buttons, and ensuring the progress bar conveys its status effectively for all users.

## Debug Notes
- Ensure local storage key `focusos-workday` remains consistent across sessions.
- Confirm that manual worked overrides only apply after clock out and are labeled explicitly.
- Verify that planned settings are ignored for calculations once clocking starts.
- Check time zone handling if the application ever expands beyond local network use.

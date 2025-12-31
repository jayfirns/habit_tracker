export function getClockState(workday = {}) {
  if (workday.clockInAt) {
    return workday.clockOutAt ? "completed" : "running";
  }
  return "idle";
}

export function getWorkdayMode(workday = {}) {
  const clockState = getClockState(workday);
  if (clockState !== "idle") return "clocked";
  if (Number.isFinite(workday.plannedMinutes) && workday.plannedMinutes > 0) return "planned";
  return "empty";
}

export function getWorkdayUiState(workday = {}) {
  const clockState = getClockState(workday);
  const mode = getWorkdayMode(workday);
  const hasOverride = workday.workedMinutesOverride != null;
  return {
    mode,
    clockState,
    canPlan: clockState === "idle",
    canClockIn: clockState === "idle",
    canClockOut: clockState === "running",
    canOverride: clockState === "completed",
    showRemaining: mode === "planned",
    showPlanned: mode === "planned",
    showWorked: mode === "clocked",
    workedLabel: hasOverride ? "Adjusted worked time" : "Worked time",
  };
}

export function applyWorkdayEvent(workday = {}, event) {
  const next = {
    workdayDate: workday.workdayDate || null,
    plannedStart: workday.plannedStart || "09:00",
    plannedMinutes:
      Number.isFinite(workday.plannedMinutes) && workday.plannedMinutes > 0
        ? Math.floor(workday.plannedMinutes)
        : null,
    clockInAt: workday.clockInAt || null,
    clockOutAt: workday.clockOutAt || null,
    workedMinutesOverride:
      workday.workedMinutesOverride != null ? Math.floor(workday.workedMinutesOverride) : null,
  };
  let ignored = false;

  switch (event?.type) {
    case "plan": {
      const minutes =
        Number.isFinite(event.plannedMinutes) && event.plannedMinutes > 0
          ? Math.floor(event.plannedMinutes)
          : null;
      next.plannedStart = event.plannedStart || next.plannedStart || "09:00";
      next.plannedMinutes = minutes;
      next.clockInAt = null;
      next.clockOutAt = null;
      next.workedMinutesOverride = null;
      break;
    }
    case "clock_in": {
      if (next.clockInAt || next.clockOutAt) {
        ignored = true;
        break;
      }
      next.clockInAt = event.at || new Date().toISOString();
      next.workedMinutesOverride = null;
      break;
    }
    case "clock_out": {
      if (!next.clockInAt || next.clockOutAt) {
        ignored = true;
        break;
      }
      next.clockOutAt = event.at || new Date().toISOString();
      break;
    }
    case "override_worked": {
      if (!next.clockOutAt) {
        ignored = true;
        break;
      }
      next.workedMinutesOverride =
        Number.isFinite(event.minutes) && event.minutes >= 0 ? Math.floor(event.minutes) : null;
      break;
    }
    default:
      ignored = true;
  }

  return { workday: next, ignored };
}

// CommonJS fallback for node-based tests
// eslint-disable-next-line no-undef
if (typeof module !== "undefined") {
  // eslint-disable-next-line no-undef
  module.exports = { applyWorkdayEvent, getWorkdayUiState, getWorkdayMode, getClockState };
}

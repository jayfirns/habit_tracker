// Parse focus duration from a completion note.
// Supports patterns like "22m focus", "1h 05m focus", "90m focus".
export function parseFocusMinutes(note) {
  if (!note || typeof note !== "string") return 0;
  let minutes = 0;
  const hoursMatch = note.match(/(\d+)\s*h/i);
  const minutesMatch = note.match(/(\d+)\s*m/i);
  if (hoursMatch) {
    minutes += parseInt(hoursMatch[1], 10) * 60;
  }
  if (minutesMatch) {
    minutes += parseInt(minutesMatch[1], 10);
  }
  return minutes;
}

export function formatMinutes(totalMinutes) {
  const minutes = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${String(mins).padStart(2, "0")}m`;
}

export function computeWorkdayMinutes(workday, now = new Date()) {
  if (!workday) {
    return {
      mode: "empty",
      clockState: "idle",
      plannedMinutes: 0,
      workedMinutes: 0,
      remainingMinutes: null,
    };
  }

  const plannedMinutes =
    Number.isFinite(workday.plannedMinutes) && workday.plannedMinutes > 0
      ? Math.floor(workday.plannedMinutes)
      : 0;
  const hasClockIn = Boolean(workday.clockInAt);
  const hasClockOut = Boolean(workday.clockOutAt);
  const clockState = hasClockIn ? (hasClockOut ? "completed" : "running") : "idle";
  const mode = clockState !== "idle" ? "clocked" : plannedMinutes > 0 ? "planned" : "empty";

  if (mode === "planned") {
    return {
      mode,
      clockState,
      plannedMinutes,
      workedMinutes: 0,
      remainingMinutes: plannedMinutes,
    };
  }

  if (mode === "clocked") {
    const start = new Date(workday.clockInAt);
    const end = hasClockOut ? new Date(workday.clockOutAt) : new Date(now);
    const elapsedMs = Math.max(end - start, 0);
    const derivedWorked = Math.max(0, Math.floor(elapsedMs / 60000));
    const override =
      hasClockOut && workday.workedMinutesOverride != null
        ? Math.max(0, Math.floor(workday.workedMinutesOverride))
        : null;
    return {
      mode,
      clockState,
      plannedMinutes,
      workedMinutes: override != null ? override : derivedWorked,
      remainingMinutes: null,
    };
  }

  return {
    mode,
    clockState,
    plannedMinutes: 0,
    workedMinutes: 0,
    remainingMinutes: null,
  };
}

// CommonJS fallback for node-based tests
// eslint-disable-next-line no-undef
if (typeof module !== "undefined") {
  // eslint-disable-next-line no-undef
  module.exports = { parseFocusMinutes, formatMinutes, computeWorkdayMinutes };
}

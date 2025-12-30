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
  if (!workday) return { usedMinutes: 0, totalMinutes: 0 };
  const [startHour, startMinute] = (workday.start || "09:00")
    .split(":")
    .map((v) => parseInt(v, 10));
  const start = new Date(now);
  start.setHours(startHour || 9, startMinute || 0, 0, 0);
  const plannedMinutes = Math.max(0, Math.round((workday.hours || 0) * 60));
  const plannedEnd = new Date(start.getTime() + plannedMinutes * 60 * 1000);
  const end = workday.clockedOutAt ? new Date(workday.clockedOutAt) : plannedEnd;
  const spanMs = Math.max(end - start, 1);
  const elapsedMs = Math.min(Math.max(now - start, 0), spanMs);
  if (workday.manualWorkedMinutes != null) {
    return {
      usedMinutes: Math.max(0, Math.floor(workday.manualWorkedMinutes)),
      totalMinutes: plannedMinutes,
    };
  }
  return {
    usedMinutes: Math.max(0, Math.floor(elapsedMs / 60000)),
    totalMinutes: plannedMinutes,
  };
}

// CommonJS fallback for node-based tests
// eslint-disable-next-line no-undef
if (typeof module !== "undefined") {
  // eslint-disable-next-line no-undef
  module.exports = { parseFocusMinutes, formatMinutes, computeWorkdayMinutes };
}

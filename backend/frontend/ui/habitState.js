export function purgeHabitState(state, habitId) {
  if (!state) return;
  const key = String(habitId);

  Object.values(state.timeLogs || {}).forEach((dayLogs) => {
    if (dayLogs && Object.prototype.hasOwnProperty.call(dayLogs, key)) {
      delete dayLogs[key];
    }
  });

  Object.values(state.manualLogs || {}).forEach((dayLogs) => {
    if (dayLogs && Object.prototype.hasOwnProperty.call(dayLogs, key)) {
      delete dayLogs[key];
    }
  });

  if (state.activeTimers && Object.prototype.hasOwnProperty.call(state.activeTimers, key)) {
    delete state.activeTimers[key];
  }
}

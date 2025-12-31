export const DELETE_HABIT_CONFIRMATION =
  "Delete this habit? This cannot be undone and will remove its completions.";

export async function deleteHabitFlow({
  id,
  confirmDelete,
  confirmMessage,
  apiClient,
  setStatus,
  purgeHabitState,
  state,
  onAfterDelete,
  saveTimeLogs,
  saveManualLogs,
  saveActiveTimers,
  loadHabits,
}) {
  const shouldDelete = await Promise.resolve(
    typeof confirmDelete === "function" ? confirmDelete(confirmMessage) : false,
  );
  if (!shouldDelete) {
    return { deleted: false };
  }

  setStatus("Deleting...");
  await apiClient.deleteHabit(id);
  purgeHabitState(state, id);
  if (typeof onAfterDelete === "function") {
    onAfterDelete(id);
  }
  saveTimeLogs();
  saveManualLogs();
  saveActiveTimers();
  setStatus("Deleted");
  await loadHabits();
  return { deleted: true };
}

export function removeHabitFromMilestoneSelection({
  selection,
  habitId,
  onRefreshOptions,
  onRefreshChips,
}) {
  if (!selection?.delete) return false;
  const removed = selection.delete(habitId);
  if (removed) {
    onRefreshOptions?.();
    onRefreshChips?.();
  }
  return removed;
}

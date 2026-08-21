/**
 * "Progress should be calculated from completed tasks where appropriate."
 *
 * Single shared rule, used everywhere a project's progress is displayed
 * (admin project list/detail, client dashboard/detail) — so the same
 * project never shows two different percentages depending on which page
 * you're looking at.
 *
 * "Where appropriate" = once a project actually has tasks, their completion
 * ratio IS the progress — it stops being something a human types in. Before
 * that (a freshly created project with no tasks yet), there's nothing to
 * compute from, so the manually-set/stored value is used as a starting
 * point until real tasks exist.
 */
export function computeProjectProgress(
  storedProgress: number,
  taskCounts: { total: number; completed: number }
): number {
  if (taskCounts.total === 0) return storedProgress;
  return Math.round((taskCounts.completed / taskCounts.total) * 100);
}

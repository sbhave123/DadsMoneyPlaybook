import type { TimelineAction } from "./types";

export type ActionStatus = "upcoming" | "due_soon" | "overdue" | "done";

/** Start of the given instant’s calendar day in local time. */
function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** End of the given calendar day (local time). */
function endOfLocalDay(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

export function getActionDueDate(action: TimelineAction, calendarYear: number): Date {
  return endOfLocalDay(calendarYear, action.month, action.day);
}

/**
 * Calendar days from the start of `now`’s day to the start of the deadline day.
 * Same calendar day → 0; tomorrow → 1.
 */
function calendarDaysUntilDueDay(now: Date, dueEnd: Date): number {
  const startToday = startOfLocalDay(now);
  const startDueDay = startOfLocalDay(dueEnd);
  return Math.round(
    (startDueDay.getTime() - startToday.getTime()) / 86_400_000
  );
}

export function getActionStatus(
  action: TimelineAction,
  doneIds: Set<string>,
  now: Date,
  calendarYear: number
): ActionStatus {
  if (doneIds.has(action.id)) return "done";

  const dueEnd = getActionDueDate(action, calendarYear);

  if (now.getTime() > dueEnd.getTime()) return "overdue";

  const daysUntilDueDay = calendarDaysUntilDueDay(now, dueEnd);
  if (daysUntilDueDay >= 0 && daysUntilDueDay <= 30) return "due_soon";

  return "upcoming";
}

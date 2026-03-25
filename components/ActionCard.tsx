"use client";

import type { TimelineAction } from "@/lib/types";
import type { ActionStatus } from "@/lib/actionStatus";
import { MONTH_NAMES } from "@/lib/monthNames";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<ActionStatus, string> = {
  upcoming: "Upcoming",
  due_soon: "Due soon",
  overdue: "Overdue",
  done: "Done",
};

const STATUS_PILL: Record<ActionStatus, string> = {
  upcoming: "bg-stone-100 text-stone-600",
  due_soon: "bg-amber-100 text-amber-900",
  overdue: "bg-red-100 text-red-900",
  done: "bg-emerald-100 text-emerald-900",
};

type ActionCardProps = {
  action: TimelineAction;
  status: ActionStatus;
  showMonthHeading: boolean;
  onMarkDone: (id: string) => void;
  onTellMeMore: (action: TimelineAction) => void;
};

export function ActionCard({
  action,
  status,
  showMonthHeading,
  onMarkDone,
  onTellMeMore,
}: ActionCardProps) {
  const monthName = MONTH_NAMES[action.month - 1];

  const borderClass =
    status === "done"
      ? "border-l-emerald-600"
      : status === "overdue"
        ? "border-l-red-600"
        : status === "due_soon"
          ? "border-l-playbook-amber"
          : "border-l-stone-300";

  return (
    <article
      className={cn(
        "rounded-2xl border border-stone-200/80 bg-white/90 px-4 py-4 shadow-sm border-l-4",
        borderClass,
        status === "done" && "opacity-80"
      )}
    >
      {showMonthHeading && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-playbook-green/80">
          {monthName}
        </p>
      )}
      <h3
        className={cn(
          "text-base font-semibold leading-snug text-playbook-green",
          status === "done" && "text-stone-600 line-through decoration-stone-400"
        )}
      >
        {action.title}
      </h3>
      <p
        className={cn(
          "mt-2 text-sm leading-relaxed text-stone-500",
          status === "done" && "text-stone-400"
        )}
      >
        {action.explanation}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
            STATUS_PILL[status]
          )}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="flex-1"
          disabled={status === "done"}
          onClick={() => onMarkDone(action.id)}
        >
          Mark done
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 border-playbook-green/25 text-playbook-green hover:bg-playbook-green/5"
          onClick={() => onTellMeMore(action)}
        >
          Tell me more
        </Button>
      </div>
    </article>
  );
}

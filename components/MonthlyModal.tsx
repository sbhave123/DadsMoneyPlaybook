"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { TimelineAction } from "@/lib/types";
import { MONTH_NAMES } from "@/lib/monthNames";
import { dismissMonthlyModal } from "@/lib/storage";

type MonthlyModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  month: number;
  actions: TimelineAction[];
};

export function MonthlyModal({
  open,
  onOpenChange,
  year,
  month,
  actions,
}: MonthlyModalProps) {
  const label = MONTH_NAMES[month - 1];

  function handleGotIt() {
    dismissMonthlyModal(year, month);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="max-h-[85vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>It&apos;s {label}</DialogTitle>
          <DialogDescription className="text-base text-playbook-muted">
            Here&apos;s what your dad would remind you to do this month:
          </DialogDescription>
        </DialogHeader>
        {actions.length === 0 ? (
          <p className="text-sm text-playbook-muted">
            Nothing on your playbook for this month — enjoy the calm, and
            check back next month.
          </p>
        ) : (
          <ul className="space-y-3 text-left">
            {actions.map((a) => (
              <li
                key={a.id}
                className="rounded-rh border border-playbook-line bg-playbook-surface px-3 py-2.5"
              >
                <p className="font-semibold text-playbook-black">{a.title}</p>
                <p className="mt-1 text-sm text-playbook-muted">{a.explanation}</p>
              </li>
            ))}
          </ul>
        )}
        <Button
          type="button"
          className="mt-2 w-full"
          onClick={handleGotIt}
        >
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}

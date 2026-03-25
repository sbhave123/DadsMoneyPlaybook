"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ActionCard } from "@/components/ActionCard";
import { ChatDrawer } from "@/components/ChatDrawer";
import { MonthlyModal } from "@/components/MonthlyModal";
import { generateTimeline } from "@/lib/generateTimeline";
import { getActionStatus } from "@/lib/actionStatus";
import type { OnboardingAnswers } from "@/lib/types";
import type { TimelineAction } from "@/lib/types";
import {
  getDoneIds,
  getOnboarding,
  markActionDone,
  wasMonthlyDismissed,
} from "@/lib/storage";

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [profile, setProfile] = React.useState<OnboardingAnswers | null>(null);
  const [doneIds, setDoneIdsState] = React.useState<Set<string>>(new Set());
  const [chatOpen, setChatOpen] = React.useState(false);
  const [chatAction, setChatAction] = React.useState<TimelineAction | null>(
    null
  );
  const [monthlyOpen, setMonthlyOpen] = React.useState(false);

  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const calendarYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  React.useEffect(() => {
    const p = getOnboarding();
    if (!p) {
      router.replace("/");
      return;
    }
    setProfile(p);
    setDoneIdsState(getDoneIds());
    setReady(true);
  }, [router]);

  const timeline = React.useMemo(
    () => (profile ? generateTimeline(profile) : []),
    [profile]
  );

  const byMonth = React.useMemo(() => {
    const months = Array.from(new Set(timeline.map((t) => t.month))).sort(
      (a, b) => a - b
    );
    return months.map((m) => ({
      month: m,
      items: timeline.filter((t) => t.month === m),
    }));
  }, [timeline]);

  const thisMonthActions = React.useMemo(
    () => timeline.filter((a) => a.month === currentMonth),
    [timeline, currentMonth]
  );

  React.useEffect(() => {
    if (!ready || !profile) return;
    if (wasMonthlyDismissed(calendarYear, currentMonth)) return;
    setMonthlyOpen(true);
  }, [ready, profile, calendarYear, currentMonth]);

  function handleMarkDone(id: string) {
    markActionDone(id);
    setDoneIdsState(new Set(getDoneIds()));
  }

  function handleTellMeMore(action: TimelineAction) {
    setChatAction(action);
    setChatOpen(true);
  }

  if (!ready || !profile) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-app flex-col items-center justify-center px-5">
        <p className="text-sm text-stone-500">Opening your year…</p>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto min-h-dvh max-w-app px-5 pb-14 pt-8">
        <header className="mb-10">
          <p className="text-xs font-medium uppercase tracking-wider text-playbook-green/70">
            Dad&apos;s Playbook
          </p>
          <h1 className="mt-1 text-2xl font-semibold leading-tight text-playbook-green">
            Your financial year
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            {calendarYear} — a calm timeline of what actually matters. Tap{" "}
            <span className="font-medium text-playbook-green/90">
              Tell me more
            </span>{" "}
            anytime you want the full dad talk.
          </p>
        </header>

        <div className="flex flex-col gap-8">
          {byMonth.map(({ month, items }) => (
            <section key={month} aria-label={`Month ${month}`}>
              <div className="flex flex-col gap-4">
                {items.map((action, idx) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    status={getActionStatus(
                      action,
                      doneIds,
                      now,
                      calendarYear
                    )}
                    showMonthHeading={idx === 0}
                    onMarkDone={handleMarkDone}
                    onTellMeMore={handleTellMeMore}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <ChatDrawer
        open={chatOpen}
        onOpenChange={setChatOpen}
        action={chatAction}
        profile={profile}
      />

      <MonthlyModal
        open={monthlyOpen}
        onOpenChange={setMonthlyOpen}
        year={calendarYear}
        month={currentMonth}
        actions={thisMonthActions}
      />
    </>
  );
}

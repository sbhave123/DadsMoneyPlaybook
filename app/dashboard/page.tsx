"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatDrawer } from "@/components/ChatDrawer";
import { MonthlyModal } from "@/components/MonthlyModal";
import { generateTimeline } from "@/lib/generateTimeline";
import { getActionStatus } from "@/lib/actionStatus";
import { MONTH_NAMES } from "@/lib/monthNames";
import { parseDashboardTab } from "@/lib/dashboard-tabs";
import type { DashboardTab } from "@/lib/dashboard-tabs";
import { getSessionUser } from "@/lib/auth";
import {
  getActionStages,
  getChecklistDone,
  getOnboarding,
  persistOnboarding,
  setActionStage,
  toggleChecklistItem,
  wasMonthlyDismissed,
} from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { ActionStage, OnboardingAnswers, TimelineAction } from "@/lib/types";

const CHECKLIST_ITEMS = [
  "Confirm beneficiary on every account (401k, IRA, HSA).",
  "Build 3-6 months emergency fund in high-yield savings.",
  "Review credit report and freeze credit if needed.",
  "Automate monthly investing transfer after each paycheck.",
  "Keep one-page net worth snapshot updated quarterly.",
];

const TIPS_BY_TOOL: Record<string, string[]> = {
  "401(k)": [
    "Capture full employer match before prioritizing taxable investments.",
    "Increase contribution by 1% after raises to reduce lifestyle inflation.",
    "Prefer low-cost broad index funds when available.",
  ],
  HSA: [
    "Track receipts for qualified medical expenses for future reimbursement.",
    "If cash flow allows, invest HSA dollars for long-term growth.",
    "Verify annual contribution cap and employer contributions.",
  ],
  Roth: [
    "Direct Roth eligibility depends on modified AGI and filing status.",
    "For higher incomes, backdoor Roth requires clean handling of pro-rata rules.",
    "Always document conversion steps and IRA balances for tax forms.",
  ],
  Brokerage: [
    "Tax-loss harvesting can offset gains and up to $3,000 of ordinary income.",
    "Watch wash-sale windows before and after a realized loss sale.",
    "Keep tax lots visible before selling to control realized gains.",
  ],
};

const CALENDAR_STAGE_TABS: { key: ActionStage; label: string }[] = [
  { key: "not_started", label: "Not started" },
  { key: "in_progress", label: "In progress" },
  { key: "completed", label: "Completed" },
];

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function ProfileChoiceRow<T extends string>({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onPick: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-playbook-muted">{label}</p>
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onPick(opt.value)}
              className={cn(
                "rounded-rh border px-4 py-3 text-left text-sm font-semibold transition-colors",
                selected
                  ? "border-playbook-black bg-playbook-black text-white"
                  : "border-playbook-line bg-white text-playbook-black hover:border-playbook-black/25"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StageColumn({
  title,
  items,
  month,
  now,
  year,
  onMove,
  onTellMeMore,
  showMonthTag = true,
  dense = false,
}: {
  title: string;
  items: TimelineAction[];
  month: number;
  now: Date;
  year: number;
  onMove: (id: string, stage: ActionStage) => void;
  onTellMeMore: (action: TimelineAction) => void;
  showMonthTag?: boolean;
  dense?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-col rounded-rh border border-playbook-line bg-white shadow-sm",
        dense ? "flex-1 p-2" : "p-3"
      )}
    >
      <p
        className={cn(
          "shrink-0 font-semibold uppercase tracking-wide text-playbook-muted",
          dense ? "mb-1.5 text-[10px]" : "mb-2 text-xs"
        )}
      >
        {title}
      </p>
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]",
          dense && "pr-0.5"
        )}
      >
        {items.length === 0 ? (
          <p className={cn("text-playbook-muted", dense ? "text-[11px]" : "text-xs")}>
            No items.
          </p>
        ) : (
          <div className={cn("space-y-2", dense && "space-y-1.5")}>
            {items.map((action) => {
            const status = getActionStatus(
              action,
              title === "Completed" ? new Set([action.id]) : new Set(),
              now,
              year
            );
            const statusLabel =
              status === "due_soon"
                ? "Due soon"
                : status === "overdue"
                  ? "Overdue"
                  : status === "done"
                    ? "Done"
                    : "Upcoming";
            return (
              <article
                key={action.id}
                className={cn(
                  "rounded-rh border border-playbook-line bg-playbook-surface",
                  dense ? "p-2" : "p-3",
                  status === "overdue" && "border-l-4 border-l-red-600",
                  status === "due_soon" && "border-l-4 border-l-playbook-amber",
                  status === "upcoming" && "border-l-4 border-l-playbook-line",
                  title === "Completed" && "border-l-4 border-l-playbook-green"
                )}
              >
                {showMonthTag ? (
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-playbook-muted">
                    {MONTH_NAMES[month - 1]}
                  </p>
                ) : null}
                <h3
                  className={cn(
                    "font-semibold text-playbook-black",
                    showMonthTag ? "mt-1 text-sm" : "text-sm",
                    dense && "text-[13px] leading-snug"
                  )}
                >
                  {action.title}
                </h3>
                <p
                  className={cn(
                    "text-playbook-muted",
                    dense ? "mt-0.5 text-[11px] leading-snug" : "mt-1 text-xs"
                  )}
                >
                  {action.explanation}
                </p>
                <div
                  className={cn(
                    "flex items-center justify-between gap-2",
                    dense ? "mt-1.5" : "mt-2"
                  )}
                >
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-playbook-black ring-1 ring-playbook-line">
                    {statusLabel}
                  </span>
                  <button
                    className="text-[11px] font-semibold text-playbook-black underline-offset-2 hover:underline sm:text-xs"
                    onClick={() => onTellMeMore(action)}
                  >
                    Tell me more
                  </button>
                </div>
                <div className={cn("flex flex-wrap gap-1", dense ? "mt-1.5" : "mt-2")}>
                  <button
                    className="rounded-full border border-playbook-line bg-white px-2 py-0.5 text-[10px] font-medium text-playbook-black hover:bg-playbook-surface sm:py-1 sm:text-[11px]"
                    onClick={() => onMove(action.id, "not_started")}
                  >
                    Not started
                  </button>
                  <button
                    className="rounded-full border border-playbook-line bg-white px-2 py-0.5 text-[10px] font-medium text-playbook-black hover:bg-playbook-surface sm:py-1 sm:text-[11px]"
                    onClick={() => onMove(action.id, "in_progress")}
                  >
                    In progress
                  </button>
                  <button
                    className="rounded-full border border-playbook-line bg-white px-2 py-0.5 text-[10px] font-medium text-playbook-black hover:bg-playbook-surface sm:py-1 sm:text-[11px]"
                    onClick={() => onMove(action.id, "completed")}
                  >
                    Completed
                  </button>
                </div>
              </article>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: DashboardTab = parseDashboardTab(searchParams.get("tab"));
  const [ready, setReady] = React.useState(false);
  const [profile, setProfile] = React.useState<OnboardingAnswers | null>(null);
  const [firstName, setFirstName] = React.useState("there");
  const [actionStages, setActionStages] = React.useState<Record<string, ActionStage>>(
    {}
  );
  const [checklistDone, setChecklistDone] = React.useState<Set<string>>(new Set());
  const [chatOpen, setChatOpen] = React.useState(false);
  const [chatAction, setChatAction] = React.useState<TimelineAction | null>(null);
  const [monthlyOpen, setMonthlyOpen] = React.useState(false);
  const [now, setNow] = React.useState(() => new Date());

  const [livingExpenses, setLivingExpenses] = React.useState("");
  const [loans, setLoans] = React.useState("");
  const [dailySpend, setDailySpend] = React.useState("");
  const [vacationMonthly, setVacationMonthly] = React.useState("");
  const [aboutDraft, setAboutDraft] = React.useState<OnboardingAnswers | null>(null);
  const [calendarMonth, setCalendarMonth] = React.useState(() => {
    if (typeof window === "undefined") return 1;
    return new Date().getMonth() + 1;
  });
  const [calendarStageTab, setCalendarStageTab] =
    React.useState<ActionStage>("not_started");

  React.useEffect(() => {
    const user = getSessionUser();
    if (!user) {
      router.replace("/");
      return;
    }
    setFirstName(user.firstName);

    const onboarding = getOnboarding();
    if (!onboarding) {
      router.replace("/onboarding");
      return;
    }
    setProfile(onboarding);
    setActionStages(getActionStages());
    setChecklistDone(getChecklistDone());
    setReady(true);
  }, [router]);

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  React.useEffect(() => {
    if (tab === "about" && profile) {
      setAboutDraft({ ...profile });
    }
  }, [tab, profile]);

  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const timeline = React.useMemo(
    () => (profile ? generateTimeline(profile) : []),
    [profile]
  );

  React.useEffect(() => {
    if (!ready) return;
    if (wasMonthlyDismissed(year, month)) return;
    setMonthlyOpen(true);
  }, [ready, year, month]);

  const grouped = React.useMemo(() => {
    const months = Array.from(new Set(timeline.map((t) => t.month))).sort(
      (a, b) => a - b
    );
    return months.map((m) => {
      const items = timeline.filter((i) => i.month === m);
      const notStarted = items.filter(
        (i) => (actionStages[i.id] ?? "not_started") === "not_started"
      );
      const inProgress = items.filter(
        (i) => (actionStages[i.id] ?? "not_started") === "in_progress"
      );
      const completed = items.filter(
        (i) => (actionStages[i.id] ?? "not_started") === "completed"
      );
      return { month: m, notStarted, inProgress, completed };
    });
  }, [timeline, actionStages]);

  const groupedByMonth = React.useMemo(() => {
    const map = new Map<
      number,
      {
        month: number;
        notStarted: TimelineAction[];
        inProgress: TimelineAction[];
        completed: TimelineAction[];
      }
    >();
    for (const g of grouped) {
      map.set(g.month, g);
    }
    return map;
  }, [grouped]);

  const calendarMonthData = React.useMemo(() => {
    return (
      groupedByMonth.get(calendarMonth) ?? {
        month: calendarMonth,
        notStarted: [] as TimelineAction[],
        inProgress: [] as TimelineAction[],
        completed: [] as TimelineAction[],
      }
    );
  }, [groupedByMonth, calendarMonth]);

  const thisMonth = React.useMemo(
    () => timeline.filter((a) => a.month === month),
    [timeline, month]
  );

  function moveAction(id: string, stage: ActionStage) {
    setActionStage(id, stage);
    setActionStages((prev) => ({ ...prev, [id]: stage }));
  }

  function openChat(action: TimelineAction) {
    setChatAction(action);
    setChatOpen(true);
  }

  function toggleChecklist(id: string) {
    setChecklistDone(toggleChecklistItem(id));
  }

  if (!ready || !profile) {
    return (
      <div className="min-h-dvh bg-playbook-surface">
        <main className="mx-auto flex max-w-app items-center justify-center px-5 py-16">
          <p className="text-sm text-playbook-muted">Loading your dashboard…</p>
        </main>
      </div>
    );
  }

  const takeHomeMonthly = profile.monthlyTakeHome ?? 0;
  const fixed =
    Number(livingExpenses || 0) + Number(loans || 0) + Number(vacationMonthly || 0);
  const daySpendMonthly = Number(dailySpend || 0) * 30;
  const leftover = takeHomeMonthly - fixed - daySpendMonthly;

  function saveAboutMe(e: React.FormEvent) {
    e.preventDefault();
    if (!aboutDraft) return;
    const saved = persistOnboarding(aboutDraft);
    if (saved) setProfile(saved);
  }

  function patchAboutDraft(patch: Partial<OnboardingAnswers>) {
    setAboutDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function shiftCalendarMonth(delta: number) {
    setCalendarMonth((m) => {
      let next = m + delta;
      if (next < 1) next = 12;
      if (next > 12) next = 1;
      return next;
    });
  }

  return (
    <div
      className={cn(
        "bg-playbook-surface",
        tab === "calendar"
          ? "flex max-h-[calc(100dvh-6.5rem)] min-h-[calc(100dvh-6.5rem)] flex-col overflow-hidden"
          : "min-h-dvh"
      )}
    >
      <main
        className={cn(
          "mx-auto w-full",
          tab === "calendar"
            ? "flex max-w-6xl min-h-0 flex-1 flex-col overflow-hidden px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6"
            : "max-w-app px-5 pb-20 pt-6"
        )}
      >
        {tab === "calendar" ? (
          <header className="mb-3 shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-playbook-muted">
              Calendar
            </p>
            <h1 className="mt-0.5 text-lg font-semibold tracking-tight text-playbook-black">
              Hi {firstName}
            </h1>
          </header>
        ) : (
          <header className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-playbook-muted">
              Home
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-playbook-black">
              Hi {firstName}, here&apos;s your control center
            </h1>
            <p className="mt-2 text-sm text-playbook-muted">
              Educational workflow only. This app provides factual planning support,
              not individualized financial, tax, or legal advice.
            </p>
          </header>
        )}

        {tab === "calendar" ? (
          <section
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
            aria-label="Monthly calendar"
          >
            <div className="flex shrink-0 items-center justify-between gap-2 rounded-rh border border-playbook-line bg-white px-2 py-2 shadow-sm sm:px-3">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => shiftCalendarMonth(-1)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-rh text-lg font-semibold text-playbook-black transition-colors hover:bg-playbook-surface"
              >
                ‹
              </button>
              <div className="min-w-0 flex-1 text-center">
                <p className="truncate text-sm font-semibold text-playbook-black sm:text-base">
                  {MONTH_NAMES[calendarMonth - 1]} {year}
                </p>
                <p className="text-[11px] text-playbook-muted">Month {calendarMonth} of 12</p>
              </div>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => shiftCalendarMonth(1)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-rh text-lg font-semibold text-playbook-black transition-colors hover:bg-playbook-surface"
              >
                ›
              </button>
            </div>

            <div
              className="flex shrink-0 gap-1 rounded-rh border border-playbook-line bg-white p-1 shadow-sm md:hidden"
              role="tablist"
              aria-label="Workflow stage"
            >
              {CALENDAR_STAGE_TABS.map(({ key, label }) => {
                const active = calendarStageTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setCalendarStageTab(key)}
                    className={cn(
                      "flex-1 rounded-md px-2 py-2 text-center text-[11px] font-semibold transition-colors",
                      active
                        ? "bg-playbook-black text-white"
                        : "text-playbook-muted hover:bg-playbook-surface"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden md:grid md:h-full md:min-h-0 md:grid-cols-3 md:gap-2">
              {CALENDAR_STAGE_TABS.map(({ key, label }) => {
                const items =
                  key === "not_started"
                    ? calendarMonthData.notStarted
                    : key === "in_progress"
                      ? calendarMonthData.inProgress
                      : calendarMonthData.completed;
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex min-h-0 flex-col overflow-hidden md:h-full md:min-h-0",
                      calendarStageTab === key ? "flex-1" : "hidden",
                      "md:flex"
                    )}
                  >
                    <StageColumn
                      title={label}
                      items={items}
                      month={calendarMonth}
                      now={now}
                      year={year}
                      onMove={moveAction}
                      onTellMeMore={openChat}
                      showMonthTag={false}
                      dense
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {tab === "tips" ? (
          <section className="space-y-4">
            {Object.entries(TIPS_BY_TOOL).map(([tool, tips]) => (
              <article
                key={tool}
                className="rounded-rh border border-playbook-line bg-white p-4 shadow-sm"
              >
                <h2 className="text-base font-semibold text-playbook-black">{tool}</h2>
                <ul className="mt-2 space-y-2 text-sm text-playbook-black/80">
                  {tips.map((tip) => (
                    <li key={tip}>- {tip}</li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        ) : null}

        {tab === "checklist" ? (
          <section className="space-y-2 rounded-rh border border-playbook-line bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-playbook-black">
              Non-monthly financial checklist
            </h2>
            {CHECKLIST_ITEMS.map((item) => {
              const done = checklistDone.has(item);
              return (
                <button
                  key={item}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-rh border px-3 py-2 text-left text-sm",
                    done
                      ? "border-playbook-green/40 bg-playbook-green/10 text-playbook-muted"
                      : "border-playbook-line bg-playbook-surface text-playbook-black"
                  )}
                  onClick={() => toggleChecklist(item)}
                >
                  <span className="mt-0.5 text-xs">{done ? "✓" : "○"}</span>
                  <span>{item}</span>
                </button>
              );
            })}
          </section>
        ) : null}

        {tab === "calculator" ? (
          <section className="space-y-3 rounded-rh border border-playbook-line bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-playbook-black">
              Smart monthly leftover calculator
            </h2>
            <p className="text-xs text-playbook-muted">
              Uses your average monthly take-home—the amount that actually hits your
              bank after taxes, 401(k), HSA, and other payroll deductions—plus your
              monthly costs, to estimate investable leftover.
            </p>
            {takeHomeMonthly <= 0 ? (
              <p className="rounded-rh border border-playbook-amber/50 bg-playbook-amber/10 px-3 py-2 text-xs text-playbook-black">
                Add your take-home pay in{" "}
                <Link
                  href="/dashboard?tab=about"
                  className="font-semibold underline underline-offset-2"
                >
                  About me
                </Link>{" "}
                so this calculator reflects cash you can spend and save after
                deductions.
              </p>
            ) : null}
            <label className="text-xs text-playbook-muted">Monthly living expenses</label>
            <input
              className="h-10 w-full rounded-rh border border-playbook-line bg-white px-3 text-sm text-playbook-black"
              inputMode="numeric"
              value={livingExpenses}
              onChange={(e) => setLivingExpenses(e.target.value.replace(/[^\d.]/g, ""))}
            />
            <label className="text-xs text-playbook-muted">
              Monthly loan payments
            </label>
            <input
              className="h-10 w-full rounded-rh border border-playbook-line bg-white px-3 text-sm text-playbook-black"
              inputMode="numeric"
              value={loans}
              onChange={(e) => setLoans(e.target.value.replace(/[^\d.]/g, ""))}
            />
            <label className="text-xs text-playbook-muted">
              Average day-to-day spend (per day)
            </label>
            <input
              className="h-10 w-full rounded-rh border border-playbook-line bg-white px-3 text-sm text-playbook-black"
              inputMode="numeric"
              value={dailySpend}
              onChange={(e) => setDailySpend(e.target.value.replace(/[^\d.]/g, ""))}
            />
            <label className="text-xs text-playbook-muted">Vacation budget (monthly)</label>
            <input
              className="h-10 w-full rounded-rh border border-playbook-line bg-white px-3 text-sm text-playbook-black"
              inputMode="numeric"
              value={vacationMonthly}
              onChange={(e) =>
                setVacationMonthly(e.target.value.replace(/[^\d.]/g, ""))
              }
            />

            <div className="mt-2 rounded-rh border border-playbook-line bg-playbook-surface p-3">
              <p className="text-sm text-playbook-black">
                Monthly take-home (bank deposits):{" "}
                <span className="font-semibold">{formatMoney(takeHomeMonthly)}</span>
              </p>
              {profile.salaryAnnual > 0 ? (
                <p className="mt-1 text-xs text-playbook-muted">
                  Annual gross salary (for timeline and bracket hints only):{" "}
                  {formatMoney(profile.salaryAnnual)}
                </p>
              ) : null}
              <p className="mt-2 text-sm text-playbook-black">
                Estimated leftover:{" "}
                <span
                  className={cn(
                    "font-semibold",
                    leftover >= 0 ? "text-playbook-green" : "text-red-600"
                  )}
                >
                  {formatMoney(leftover)}
                </span>
              </p>
              <p className="mt-2 text-xs text-playbook-muted">
                Reminder: if leftover is positive, automate a monthly investment
                transfer right after payday.
              </p>
            </div>
          </section>
        ) : null}

        {tab === "about" && aboutDraft ? (
          <section className="space-y-4 rounded-rh border border-playbook-line bg-white p-4 shadow-sm">
            <div>
              <h2 className="text-base font-semibold text-playbook-black">About me</h2>
              <p className="mt-1 text-xs text-playbook-muted">
                Update salary, take-home pay, and contribution amounts. Take-home
                should match what lands in your checking account each month after
                taxes and pre-tax deductions—not gross pay.
              </p>
            </div>

            <form className="space-y-5" onSubmit={saveAboutMe}>
              <div>
                <label className="text-xs font-medium text-playbook-muted">
                  Annual salary (before tax)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  className="mt-1 h-10 w-full rounded-rh border border-playbook-line bg-white px-3 text-sm text-playbook-black"
                  value={aboutDraft.salaryAnnual === 0 ? "" : aboutDraft.salaryAnnual}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const n = raw === "" ? 0 : Number(raw);
                    patchAboutDraft({
                      salaryAnnual: Number.isFinite(n) ? Math.max(0, n) : 0,
                    });
                  }}
                />
                <p className="mt-1 text-[11px] text-playbook-muted">
                  Used to estimate tax bracket and timeline hints only—not for the
                  leftover math below.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-playbook-muted">
                  Average monthly take-home (net to bank)
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  className="mt-1 h-10 w-full rounded-rh border border-playbook-line bg-white px-3 text-sm text-playbook-black"
                  value={
                    aboutDraft.monthlyTakeHome === 0 ? "" : aboutDraft.monthlyTakeHome
                  }
                  onChange={(e) => {
                    const raw = e.target.value;
                    const n = raw === "" ? 0 : Number(raw);
                    patchAboutDraft({
                      monthlyTakeHome: Number.isFinite(n) ? Math.max(0, n) : 0,
                    });
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-playbook-muted">
                  Your 401(k) employee deferral (per month)
                </label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  className="mt-1 h-10 w-full rounded-rh border border-playbook-line bg-white px-3 text-sm text-playbook-black"
                  value={
                    aboutDraft.monthly401kEmployee === 0
                      ? ""
                      : aboutDraft.monthly401kEmployee
                  }
                  onChange={(e) => {
                    const raw = e.target.value;
                    const n = raw === "" ? 0 : Number(raw);
                    patchAboutDraft({
                      monthly401kEmployee: Number.isFinite(n) ? Math.max(0, n) : 0,
                    });
                  }}
                />
                <p className="mt-1 text-[11px] text-playbook-muted">
                  For your records; already reflected if your take-home is after
                  401(k).
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-playbook-muted">
                  HSA contribution (per month)
                </label>
                <input
                  type="number"
                  min={0}
                  step={25}
                  className="mt-1 h-10 w-full rounded-rh border border-playbook-line bg-white px-3 text-sm text-playbook-black"
                  value={
                    aboutDraft.monthlyHsaContribution === 0
                      ? ""
                      : aboutDraft.monthlyHsaContribution
                  }
                  onChange={(e) => {
                    const raw = e.target.value;
                    const n = raw === "" ? 0 : Number(raw);
                    patchAboutDraft({
                      monthlyHsaContribution: Number.isFinite(n) ? Math.max(0, n) : 0,
                    });
                  }}
                />
              </div>

              <ProfileChoiceRow
                label="Do you have a 401k with an employer match?"
                value={aboutDraft.employerMatch401k}
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "unsure", label: "Not sure" },
                ]}
                onPick={(employerMatch401k) => patchAboutDraft({ employerMatch401k })}
              />

              <ProfileChoiceRow
                label="Do you have an HSA-eligible health plan?"
                value={aboutDraft.hsaEligible}
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "unsure", label: "Not sure" },
                ]}
                onPick={(hsaEligible) => patchAboutDraft({ hsaEligible })}
              />

              <ProfileChoiceRow
                label="Do you have a taxable brokerage account?"
                value={aboutDraft.taxableBrokerage}
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "what_is", label: "What is that?" },
                ]}
                onPick={(taxableBrokerage) => patchAboutDraft({ taxableBrokerage })}
              />

              <button
                type="submit"
                className="h-11 w-full rounded-rh bg-playbook-black text-sm font-semibold text-white hover:bg-playbook-black/90"
              >
                Save profile
              </button>
            </form>
          </section>
        ) : null}
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
        year={year}
        month={month}
        actions={thisMonth}
      />
    </div>
  );
}

function DashboardFallback() {
  return (
    <div className="min-h-dvh bg-playbook-surface">
      <main className="mx-auto max-w-app px-5 py-16">
        <p className="text-sm text-playbook-muted">Loading your dashboard…</p>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}


"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChatDrawer } from "@/components/ChatDrawer";
import { MonthlyModal } from "@/components/MonthlyModal";
import { generateTimeline } from "@/lib/generateTimeline";
import { getActionStatus } from "@/lib/actionStatus";
import { MONTH_NAMES } from "@/lib/monthNames";
import { clearSessionUser, getSessionUser } from "@/lib/auth";
import {
  clearOnboarding,
  dismissMonthlyModal,
  getActionStages,
  getChecklistDone,
  getOnboarding,
  setActionStage,
  toggleChecklistItem,
  wasMonthlyDismissed,
} from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { ActionStage, OnboardingAnswers, TimelineAction } from "@/lib/types";

type Tab = "calendar" | "tips" | "checklist" | "calculator";

const NAV: { id: Tab; label: string }[] = [
  { id: "calendar", label: "Calendar dashboard" },
  { id: "tips", label: "Tips & tricks" },
  { id: "checklist", label: "Overall checklist" },
  { id: "calculator", label: "Smart calculator" },
];

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

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function StageColumn({
  title,
  items,
  month,
  now,
  year,
  onMove,
  onTellMeMore,
}: {
  title: string;
  items: TimelineAction[];
  month: number;
  now: Date;
  year: number;
  onMove: (id: string, stage: ActionStage) => void;
  onTellMeMore: (action: TimelineAction) => void;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-600">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-xs text-stone-500">No items.</p>
      ) : (
        <div className="space-y-2">
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
                  "rounded-lg border border-stone-200 bg-white p-3 shadow-sm",
                  status === "overdue" && "border-l-4 border-l-red-600",
                  status === "due_soon" && "border-l-4 border-l-playbook-amber",
                  status === "upcoming" && "border-l-4 border-l-stone-300",
                  title === "Completed" && "border-l-4 border-l-emerald-600"
                )}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-playbook-green/80">
                  {MONTH_NAMES[month - 1]}
                </p>
                <h3 className="mt-1 text-sm font-semibold text-playbook-green">
                  {action.title}
                </h3>
                <p className="mt-1 text-xs text-stone-500">{action.explanation}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-700">
                    {statusLabel}
                  </span>
                  <button
                    className="text-xs font-medium text-playbook-green underline-offset-2 hover:underline"
                    onClick={() => onTellMeMore(action)}
                  >
                    Tell me more
                  </button>
                </div>
                <div className="mt-2 flex gap-1">
                  <button
                    className="rounded-md border border-stone-200 px-2 py-1 text-[11px] text-stone-600 hover:bg-stone-50"
                    onClick={() => onMove(action.id, "not_started")}
                  >
                    Not started
                  </button>
                  <button
                    className="rounded-md border border-stone-200 px-2 py-1 text-[11px] text-stone-600 hover:bg-stone-50"
                    onClick={() => onMove(action.id, "in_progress")}
                  >
                    In progress
                  </button>
                  <button
                    className="rounded-md border border-stone-200 px-2 py-1 text-[11px] text-stone-600 hover:bg-stone-50"
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
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [profile, setProfile] = React.useState<OnboardingAnswers | null>(null);
  const [firstName, setFirstName] = React.useState("there");
  const [tab, setTab] = React.useState<Tab>("calendar");
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

  function logout() {
    clearSessionUser();
    router.push("/");
  }

  function resetProfile() {
    clearOnboarding();
    dismissMonthlyModal(year, month);
    router.push("/onboarding");
  }

  const salaryMonthly = (profile?.salaryAnnual ?? 0) / 12;
  const fixed =
    Number(livingExpenses || 0) + Number(loans || 0) + Number(vacationMonthly || 0);
  const daySpendMonthly = Number(dailySpend || 0) * 30;
  const leftover = salaryMonthly - fixed - daySpendMonthly;

  if (!ready || !profile) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-app items-center justify-center px-5">
        <p className="text-sm text-stone-500">Loading your dashboard…</p>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto min-h-dvh max-w-app px-5 pb-16 pt-8">
        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-playbook-green/70">
            Dad&apos;s Playbook
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-playbook-green">
            Hi {firstName}, here&apos;s your control center
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Educational workflow only. This app provides factual planning support,
            not individualized financial, tax, or legal advice.
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={resetProfile}>
              Restart questionnaire
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        </header>

        <nav className="mb-6 grid grid-cols-2 gap-2">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-xl border px-3 py-2 text-left text-xs font-medium",
                tab === item.id
                  ? "border-playbook-green bg-playbook-green/10 text-playbook-green"
                  : "border-stone-200 bg-white text-stone-700"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {tab === "calendar" ? (
          <section className="space-y-6">
            {grouped.map((g) => (
              <div key={g.month} className="space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-playbook-green/80">
                  {MONTH_NAMES[g.month - 1]}
                </h2>
                <div className="grid gap-3">
                  <StageColumn
                    title="Not started"
                    items={g.notStarted}
                    month={g.month}
                    now={now}
                    year={year}
                    onMove={moveAction}
                    onTellMeMore={openChat}
                  />
                  <StageColumn
                    title="In progress"
                    items={g.inProgress}
                    month={g.month}
                    now={now}
                    year={year}
                    onMove={moveAction}
                    onTellMeMore={openChat}
                  />
                  <StageColumn
                    title="Completed"
                    items={g.completed}
                    month={g.month}
                    now={now}
                    year={year}
                    onMove={moveAction}
                    onTellMeMore={openChat}
                  />
                </div>
              </div>
            ))}
          </section>
        ) : null}

        {tab === "tips" ? (
          <section className="space-y-4">
            {Object.entries(TIPS_BY_TOOL).map(([tool, tips]) => (
              <article
                key={tool}
                className="rounded-2xl border border-stone-200 bg-white p-4"
              >
                <h2 className="text-base font-semibold text-playbook-green">{tool}</h2>
                <ul className="mt-2 space-y-2 text-sm text-stone-700">
                  {tips.map((tip) => (
                    <li key={tip}>- {tip}</li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        ) : null}

        {tab === "checklist" ? (
          <section className="space-y-2 rounded-2xl border border-stone-200 bg-white p-4">
            <h2 className="text-base font-semibold text-playbook-green">
              Non-monthly financial checklist
            </h2>
            {CHECKLIST_ITEMS.map((item) => {
              const done = checklistDone.has(item);
              return (
                <button
                  key={item}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm",
                    done
                      ? "border-emerald-200 bg-emerald-50/60 text-stone-500"
                      : "border-stone-200 bg-stone-50/40 text-stone-800"
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
          <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
            <h2 className="text-base font-semibold text-playbook-green">
              Smart monthly leftover calculator
            </h2>
            <p className="text-xs text-stone-600">
              Uses your annual salary from onboarding and your monthly costs to
              estimate investable leftover.
            </p>
            <label className="text-xs text-stone-600">Monthly living expenses</label>
            <input
              className="h-10 w-full rounded-lg border border-stone-200 px-3 text-sm"
              inputMode="numeric"
              value={livingExpenses}
              onChange={(e) => setLivingExpenses(e.target.value.replace(/[^\d.]/g, ""))}
            />
            <label className="text-xs text-stone-600">
              Monthly loan payments
            </label>
            <input
              className="h-10 w-full rounded-lg border border-stone-200 px-3 text-sm"
              inputMode="numeric"
              value={loans}
              onChange={(e) => setLoans(e.target.value.replace(/[^\d.]/g, ""))}
            />
            <label className="text-xs text-stone-600">
              Average day-to-day spend (per day)
            </label>
            <input
              className="h-10 w-full rounded-lg border border-stone-200 px-3 text-sm"
              inputMode="numeric"
              value={dailySpend}
              onChange={(e) => setDailySpend(e.target.value.replace(/[^\d.]/g, ""))}
            />
            <label className="text-xs text-stone-600">Vacation budget (monthly)</label>
            <input
              className="h-10 w-full rounded-lg border border-stone-200 px-3 text-sm"
              inputMode="numeric"
              value={vacationMonthly}
              onChange={(e) =>
                setVacationMonthly(e.target.value.replace(/[^\d.]/g, ""))
              }
            />

            <div className="mt-2 rounded-xl border border-stone-200 bg-stone-50 p-3">
              <p className="text-sm text-stone-700">
                Monthly gross income:{" "}
                <span className="font-semibold">{formatMoney(salaryMonthly)}</span>
              </p>
              <p className="mt-1 text-sm text-stone-700">
                Estimated leftover:{" "}
                <span
                  className={cn(
                    "font-semibold",
                    leftover >= 0 ? "text-playbook-green" : "text-red-700"
                  )}
                >
                  {formatMoney(leftover)}
                </span>
              </p>
              <p className="mt-2 text-xs text-stone-600">
                Reminder: if leftover is positive, automate a monthly investment
                transfer right after payday.
              </p>
            </div>
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
    </>
  );
}


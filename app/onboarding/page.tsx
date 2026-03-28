"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSessionUser } from "@/lib/auth";
import { getOnboarding, setOnboarding } from "@/lib/storage";
import { estimateTaxBracketFromSalary } from "@/lib/tax";
import type { OnboardingAnswers } from "@/lib/types";

type Binary = "yes" | "no" | "unsure";
type Brokerage = "yes" | "no" | "what_is";

type AnswersDraft = {
  employerMatch401k?: Binary;
  hsaEligible?: Binary;
  salaryAnnual?: number;
  taxableBrokerage?: Brokerage;
};

type ChoiceStep = {
  kind: "choice";
  key: "employerMatch401k" | "hsaEligible" | "taxableBrokerage";
  question: string;
  explainer: string;
  options: { value: string; label: string }[];
};

type SalaryStep = {
  kind: "salary";
  key: "salaryAnnual";
  question: string;
  explainer: string;
};

type Step = ChoiceStep | SalaryStep;

const STEPS: Step[] = [
  {
    kind: "choice",
    key: "employerMatch401k",
    question: "Do you have a 401k with an employer match?",
    explainer:
      "Employer match is often the best return you will ever get on savings.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    kind: "choice",
    key: "hsaEligible",
    question: "Do you have an HSA-eligible health plan?",
    explainer:
      "If yes, we will add high-impact HSA reminders for contribution and investing.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    kind: "salary",
    key: "salaryAnnual",
    question: "What is your annual salary (before tax)?",
    explainer:
      "We use this to estimate your tax bracket and whether backdoor Roth steps may apply.",
  },
  {
    kind: "choice",
    key: "taxableBrokerage",
    question: "Do you have a taxable brokerage account?",
    explainer:
      "Tax-loss harvesting and year-end portfolio reminders depend on this.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "what_is", label: "What is that?" },
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [gate, setGate] = React.useState<
    "pending" | "signin" | "dashboard" | "ready"
  >("pending");
  const [step, setStep] = React.useState(0);
  const [draft, setDraft] = React.useState<AnswersDraft>({});
  const [salaryInput, setSalaryInput] = React.useState("");

  React.useEffect(() => {
    try {
      const user = getSessionUser();
      if (!user) {
        setGate("signin");
        router.replace("/");
        const hardNav = window.setTimeout(() => {
          if (window.location.pathname.startsWith("/onboarding")) {
            window.location.assign("/");
          }
        }, 2500);
        return () => window.clearTimeout(hardNav);
      }
      const existing = getOnboarding();
      if (existing) {
        setGate("dashboard");
        const dest = "/dashboard?tab=calendar";
        router.replace(dest);
        const hardNav = window.setTimeout(() => {
          if (window.location.pathname.startsWith("/onboarding")) {
            window.location.assign(dest);
          }
        }, 2500);
        return () => window.clearTimeout(hardNav);
      }
      setGate("ready");
    } catch {
      setGate("ready");
    }
  }, [router]);

  if (gate !== "ready") {
    return (
      <div className="min-h-dvh bg-playbook-surface">
        <main className="mx-auto flex max-w-app flex-col items-center justify-center gap-3 px-5 py-16">
          <p className="text-sm text-playbook-muted">
            {gate === "pending"
              ? "Loading…"
              : gate === "signin"
                ? "Taking you to sign in…"
                : "Taking you to your dashboard…"}
          </p>
          {gate === "signin" || gate === "dashboard" ? (
            <button
              type="button"
              className="text-xs font-medium text-playbook-black underline-offset-2 hover:underline"
              onClick={() => {
                window.location.assign(
                  gate === "signin" ? "/" : "/dashboard?tab=calendar"
                );
              }}
            >
              Stuck? Continue in browser
            </button>
          ) : null}
        </main>
      </div>
    );
  }

  const current = STEPS[step];
  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  const canContinue =
    current.kind === "salary"
      ? Number(salaryInput.replaceAll(",", "")) > 0
      : draft[current.key] !== undefined;

  function select(value: string) {
    setDraft((prev) => ({ ...prev, [current.key]: value }));
  }

  function saveAndNext() {
    if (current.kind === "salary") {
      const parsed = Number(salaryInput.replaceAll(",", ""));
      if (!Number.isFinite(parsed) || parsed <= 0) return;
      setDraft((prev) => ({ ...prev, salaryAnnual: parsed }));
    }
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    const salaryAnnual = Number(
      (current.kind === "salary"
        ? salaryInput
        : String(draft.salaryAnnual ?? "0")
      ).replaceAll(",", "")
    );

    const completed: OnboardingAnswers = {
      employerMatch401k: (draft.employerMatch401k ?? "unsure") as Binary,
      hsaEligible: (draft.hsaEligible ?? "unsure") as Binary,
      taxableBrokerage: (draft.taxableBrokerage ?? "what_is") as Brokerage,
      salaryAnnual,
      taxBracket: estimateTaxBracketFromSalary(salaryAnnual),
      incomeAbove161k: salaryAnnual > 161_000 ? "yes" : "no",
      monthlyTakeHome: 0,
      monthly401kEmployee: 0,
      monthlyHsaContribution: 0,
    };

    setOnboarding(completed);
    router.push("/dashboard?tab=calendar");
  }

  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  return (
    <div className="min-h-dvh bg-playbook-surface">
      <main className="mx-auto max-w-app px-5 pb-12 pt-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-playbook-muted">
          One-time setup
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-playbook-black">
          Let&apos;s set your baseline
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-playbook-muted">
          Short, factual prompts—no jargon, no lecture.
        </p>
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs text-playbook-muted">
            <span>
              Step {step + 1} of {STEPS.length}
            </span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      </header>

      <section>
        <h2 className="text-lg font-medium text-playbook-black">{current.question}</h2>
        <p className="mt-2 text-sm leading-relaxed text-playbook-muted">
          {current.explainer}
        </p>

        {current.kind === "choice" ? (
          <div className="mt-6 flex flex-col gap-2">
            {current.options.map((opt) => {
              const selected = draft[current.key] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => select(opt.value)}
                  className={cn(
                    "rounded-rh border px-4 py-3.5 text-left text-sm font-semibold transition-colors",
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
        ) : (
          <div className="mt-6">
            <input
              inputMode="numeric"
              className="h-12 w-full rounded-rh border border-playbook-line bg-white px-3 text-base text-playbook-black outline-none ring-playbook-black/10 focus:ring-2"
              placeholder="e.g. 120000"
              value={salaryInput}
              onChange={(e) =>
                setSalaryInput(e.target.value.replace(/[^\d,]/g, ""))
              }
            />
            <p className="mt-2 text-xs text-playbook-muted">
              Used to estimate bracket only; this is not tax filing advice.
            </p>
          </div>
        )}
      </section>

      <footer className="mt-10 flex gap-3">
        <Button
          type="button"
          variant="ghost"
          className="flex-1 text-playbook-muted"
          onClick={goBack}
          disabled={step === 0}
        >
          Back
        </Button>
        <Button
          type="button"
          className="flex-[2]"
          onClick={saveAndNext}
          disabled={!canContinue}
        >
          {step === STEPS.length - 1 ? "Finish" : "Continue"}
        </Button>
      </footer>
      </main>
    </div>
  );
}


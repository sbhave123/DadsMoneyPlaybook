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

type QuestionStep = {
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

type Step = QuestionStep | SalaryStep;

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
  const [ready, setReady] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [draft, setDraft] = React.useState<AnswersDraft>({});
  const [salaryInput, setSalaryInput] = React.useState("");

  React.useEffect(() => {
    const user = getSessionUser();
    if (!user) {
      router.replace("/");
      return;
    }
    const existing = getOnboarding();
    if (existing) {
      router.replace("/dashboard");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-app items-center justify-center px-5">
        <p className="text-sm text-stone-500">Loading…</p>
      </main>
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
    };

    setOnboarding(completed);
    router.push("/dashboard");
  }

  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  return (
    <main className="mx-auto min-h-dvh max-w-app px-5 pb-10 pt-8">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-playbook-green/70">
          Dad&apos;s Playbook
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-playbook-green">
          Let&apos;s set your baseline
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          We keep this practical, factual, and personalized to your inputs.
        </p>
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs text-stone-500">
            <span>
              Question {step + 1} of {STEPS.length}
            </span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      </header>

      <section>
        <h2 className="text-lg font-medium text-stone-900">{current.question}</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
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
                    "rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-colors",
                    selected
                      ? "border-playbook-green bg-playbook-green/10 text-playbook-green"
                      : "border-stone-200 bg-white text-stone-800 hover:border-playbook-green/30"
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
              className="h-12 w-full rounded-xl border border-stone-200 bg-white px-3 text-base outline-none ring-playbook-green/25 focus:ring-2"
              placeholder="e.g. 120000"
              value={salaryInput}
              onChange={(e) =>
                setSalaryInput(e.target.value.replace(/[^\d,]/g, ""))
              }
            />
            <p className="mt-2 text-xs text-stone-500">
              Used to estimate bracket only; this is not tax filing advice.
            </p>
          </div>
        )}
      </section>

      <footer className="mt-10 flex gap-3">
        <Button
          type="button"
          variant="ghost"
          className="flex-1 text-stone-600"
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
  );
}


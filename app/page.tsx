"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { OnboardingAnswers } from "@/lib/types";
import { getOnboarding, setOnboarding } from "@/lib/storage";
import { cn } from "@/lib/utils";

type StepKey = keyof OnboardingAnswers;

type Option<T extends string> = { value: T; label: string };

const STEPS: {
  key: StepKey;
  question: string;
  explainer: string;
  options: Option<string>[];
}[] = [
  {
    key: "employerMatch401k",
    question: "Do you have a 401k with an employer match?",
    explainer:
      "Employer match is often the best return you’ll ever get on savings — we’ll nudge you at the right time.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    key: "hsaEligible",
    question: "Do you have an HSA-eligible health plan?",
    explainer:
      "If you have access to an HSA, the calendar can include contribution and investing reminders tailored to you.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    key: "incomeAbove161k",
    question: "Is your annual income above $161,000?",
    explainer:
      "This determines whether you're eligible for a direct Roth IRA contribution or need to use the backdoor method.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "prefer_not", label: "Prefer not to say" },
    ],
  },
  {
    key: "taxBracket",
    question: "What is your approximate federal tax bracket?",
    explainer:
      "Rough bracket helps your ‘dad’ tailor examples and tax talk without needing exact numbers.",
    options: [
      { value: "10", label: "10%" },
      { value: "12", label: "12%" },
      { value: "22", label: "22%" },
      { value: "24", label: "24%" },
      { value: "32plus", label: "32%+" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    key: "taxableBrokerage",
    question: "Do you have a taxable brokerage account?",
    explainer:
      "Tax-loss harvesting and year-end portfolio moves only matter if you have taxable investments.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "what_is", label: "What's that?" },
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<Partial<OnboardingAnswers>>({});

  React.useEffect(() => {
    const existing = getOnboarding();
    if (existing) {
      router.replace("/dashboard");
      return;
    }
    setHydrated(true);
  }, [router]);

  if (!hydrated) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-app flex-col items-center justify-center px-5">
        <p className="text-sm text-stone-500">Loading…</p>
      </main>
    );
  }

  const current = STEPS[step];
  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  function select(value: string) {
    setAnswers(
      (prev) =>
        ({
          ...prev,
          [current.key]: value,
        }) as Partial<OnboardingAnswers>
    );
  }

  function goNext() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      const complete = answers as OnboardingAnswers;
      setOnboarding(complete);
      router.push("/dashboard");
    }
  }

  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  const selected = answers[current.key];
  const canContinue = selected !== undefined;

  return (
    <main className="mx-auto min-h-dvh max-w-app px-5 pb-10 pt-8">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-playbook-green/70">
          Dad&apos;s Playbook
        </p>
        <h1 className="mt-1 text-2xl font-semibold leading-tight text-playbook-green">
          Let&apos;s get to know you
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          No judgment, no spreadsheets — just a few questions so we know what
          to remind you about and when.
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

      <section aria-live="polite">
        <h2 className="text-lg font-medium text-stone-900">
          {current.question}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          {current.explainer}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {current.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => select(opt.value)}
              className={cn(
                "rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-colors",
                selected === opt.value
                  ? "border-playbook-green bg-playbook-green/10 text-playbook-green"
                  : "border-stone-200 bg-white text-stone-800 hover:border-playbook-green/30"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
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
          onClick={goNext}
          disabled={!canContinue}
        >
          {step === STEPS.length - 1 ? "Finish" : "Continue"}
        </Button>
      </footer>
    </main>
  );
}

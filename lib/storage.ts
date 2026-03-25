import type { OnboardingAnswers } from "./types";

const ONBOARDING_KEY = "dads-playbook-onboarding";
const DONE_PREFIX = "dads-playbook-done";
const MONTHLY_PREFIX = "dads-playbook-monthly";

export function getOnboarding(): OnboardingAnswers | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingAnswers;
  } catch {
    return null;
  }
}

export function setOnboarding(answers: OnboardingAnswers): void {
  localStorage.setItem(ONBOARDING_KEY, JSON.stringify(answers));
}

export function getDoneIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DONE_PREFIX);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function setDoneIds(ids: Set<string>): void {
  localStorage.setItem(DONE_PREFIX, JSON.stringify(Array.from(ids)));
}

export function markActionDone(id: string): void {
  const next = getDoneIds();
  next.add(id);
  setDoneIds(next);
}

export function monthlyDismissalKey(year: number, month: number): string {
  return `${MONTHLY_PREFIX}-${year}-${month}`;
}

export function wasMonthlyDismissed(year: number, month: number): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(monthlyDismissalKey(year, month)) === "1";
}

export function dismissMonthlyModal(year: number, month: number): void {
  localStorage.setItem(monthlyDismissalKey(year, month), "1");
}

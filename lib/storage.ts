import type { ActionStage, OnboardingAnswers } from "./types";
import { estimateTaxBracketFromSalary } from "./tax";

const ONBOARDING_KEY = "dads-playbook-onboarding";
const MONTHLY_PREFIX = "dads-playbook-monthly";
const ACTION_STAGE_KEY = "dads-playbook-action-stage";
const CHECKLIST_KEY = "dads-playbook-checklist";

function normalizeOnboarding(
  input: Partial<OnboardingAnswers>
): OnboardingAnswers | null {
  if (!input) return null;

  const salaryAnnual = Number(input.salaryAnnual ?? 0);
  const hasSalary = Number.isFinite(salaryAnnual) && salaryAnnual > 0;
  const taxBracket = hasSalary
    ? estimateTaxBracketFromSalary(salaryAnnual)
    : (input.taxBracket ?? "unsure");

  const incomeAbove161k =
    hasSalary && salaryAnnual > 161_000 ? "yes" : input.incomeAbove161k ?? "no";

  const employerMatch401k = input.employerMatch401k;
  const hsaEligible = input.hsaEligible;
  const taxableBrokerage = input.taxableBrokerage;

  if (!employerMatch401k || !hsaEligible || !taxableBrokerage) return null;

  return {
    employerMatch401k,
    hsaEligible,
    taxableBrokerage,
    salaryAnnual: hasSalary ? salaryAnnual : 0,
    taxBracket,
    incomeAbove161k,
  };
}

export function getOnboarding(): OnboardingAnswers | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OnboardingAnswers>;
    const normalized = normalizeOnboarding(parsed);
    if (normalized) {
      localStorage.setItem(ONBOARDING_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return null;
  }
}

export function setOnboarding(answers: OnboardingAnswers): void {
  localStorage.setItem(ONBOARDING_KEY, JSON.stringify(answers));
}

export function clearOnboarding(): void {
  localStorage.removeItem(ONBOARDING_KEY);
  localStorage.removeItem(ACTION_STAGE_KEY);
  localStorage.removeItem(CHECKLIST_KEY);
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

export function getActionStages(): Record<string, ActionStage> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ACTION_STAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ActionStage>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export function setActionStage(actionId: string, stage: ActionStage): void {
  const all = getActionStages();
  all[actionId] = stage;
  localStorage.setItem(ACTION_STAGE_KEY, JSON.stringify(all));
}

export function getChecklistDone(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function toggleChecklistItem(id: string): Set<string> {
  const done = getChecklistDone();
  if (done.has(id)) done.delete(id);
  else done.add(id);
  localStorage.setItem(CHECKLIST_KEY, JSON.stringify(Array.from(done)));
  return done;
}


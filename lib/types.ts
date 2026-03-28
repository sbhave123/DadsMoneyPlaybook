export type EmployerMatch401k = "yes" | "no" | "unsure";
export type HsaEligible = "yes" | "no" | "unsure";
export type IncomeAbove161k = "yes" | "no" | "prefer_not";
export type TaxBracket = "10" | "12" | "22" | "24" | "32plus" | "unsure";
export type TaxableBrokerage = "yes" | "no" | "what_is";

export type OnboardingAnswers = {
  employerMatch401k: EmployerMatch401k;
  hsaEligible: HsaEligible;
  incomeAbove161k: IncomeAbove161k;
  salaryAnnual: number;
  taxBracket: TaxBracket;
  taxableBrokerage: TaxableBrokerage;
  /** Average net pay deposited per month after tax, 401k, HSA, etc. */
  monthlyTakeHome: number;
  /** Your 401(k) employee deferral per month (payroll), for your records. */
  monthly401kEmployee: number;
  /** Your HSA contribution per month, for your records. */
  monthlyHsaContribution: number;
};

export type TimelineAction = {
  id: string;
  month: number;
  day: number;
  title: string;
  explanation: string;
};

export type ActionStage = "not_started" | "in_progress" | "completed";

export type SessionUser = {
  firstName: string;
  email: string;
};

import type { OnboardingAnswers } from "./types";
import { estimateTaxBracketFromSalary } from "./tax";

const salaryAnnual = 175_000;

/** Sample profile for demos/tests. */
export const mockProfile: OnboardingAnswers = {
  employerMatch401k: "yes",
  hsaEligible: "yes",
  taxableBrokerage: "yes",
  salaryAnnual,
  incomeAbove161k: salaryAnnual > 161_000 ? "yes" : "no",
  taxBracket: estimateTaxBracketFromSalary(salaryAnnual),
  monthlyTakeHome: 8_200,
  monthly401kEmployee: 1_458,
  monthlyHsaContribution: 292,
};


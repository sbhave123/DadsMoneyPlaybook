import type { TaxBracket } from "./types";

/**
 * Single-filer style rough bracket estimator for onboarding UX.
 * This is for educational categorization, not tax filing.
 */
export function estimateTaxBracketFromSalary(salaryAnnual: number): TaxBracket {
  if (!Number.isFinite(salaryAnnual) || salaryAnnual <= 0) return "unsure";
  if (salaryAnnual <= 11_600) return "10";
  if (salaryAnnual <= 47_150) return "12";
  if (salaryAnnual <= 100_525) return "22";
  if (salaryAnnual <= 191_950) return "24";
  return "32plus";
}


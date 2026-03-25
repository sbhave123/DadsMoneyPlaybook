import type { OnboardingAnswers, TimelineAction } from "./types";

function compareActions(a: TimelineAction, b: TimelineAction): number {
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

/**
 * Builds the personalized financial-year timeline from onboarding answers.
 * Dates are used for urgency (overdue / due soon), not for display labels.
 */
export function generateTimeline(answers: OnboardingAnswers): TimelineAction[] {
  const items: TimelineAction[] = [];

  items.push({
    id: "jan-401k-increase",
    month: 1,
    day: 31,
    title: "Review and increase your 401k contribution by at least 1%",
    explanation:
      "Small bumps early in your career compound massively — you’ll barely feel a 1% change in your paycheck.",
  });

  if (answers.employerMatch401k === "yes") {
    items.push({
      id: "jan-401k-match",
      month: 1,
      day: 31,
      title: "Confirm you are contributing enough to get your full employer match — this is free money",
      explanation:
        "Missing the full match is leaving part of your salary on the table — most plans spell out the percentage you need on your statement.",
    });
  }

  if (answers.hsaEligible === "yes") {
    items.push({
      id: "jan-hsa-contribute",
      month: 1,
      day: 31,
      title:
        "Contribute to your HSA — triple tax advantage: tax-deductible in, tax-free growth, tax-free out for medical",
      explanation:
        "If you can cash-flow medical costs, your HSA can double as a stealth retirement account with unbeatable tax treatment.",
    });
  }

  if (answers.incomeAbove161k === "yes") {
    items.push({
      id: "jan-backdoor-roth",
      month: 1,
      day: 31,
      title:
        "Do your backdoor Roth IRA — direct contribution not allowed at your income; here's the two-step workaround",
      explanation:
        "You can still get money into a Roth via a nondeductible traditional IRA contribution followed by a conversion — timing and pro-rata rules matter.",
    });
  }

  items.push({
    id: "apr-hsa-deadline",
    month: 4,
    day: 15,
    title: "HSA contribution deadline for prior tax year",
    explanation:
      "You often have until the filing deadline to fund last year’s HSA and still take the deduction on that return.",
  });

  items.push({
    id: "apr-ira-deadline",
    month: 4,
    day: 15,
    title: "IRA contribution deadline for prior tax year",
    explanation:
      "Same window as taxes — last chance to tuck away prior-year IRA money if you’re eligible.",
  });

  if (answers.hsaEligible === "yes") {
    items.push({
      id: "apr-hsa-invest",
      month: 4,
      day: 30,
      title:
        "Invest your HSA cash balance — cash in HSA earns nothing. Move it into index funds",
      explanation:
        "Many people leave HSA cash sitting for years; investing what you won’t need soon turns it into long-term wealth.",
    });
  }

  items.push({
    id: "nov-open-enrollment",
    month: 11,
    day: 30,
    title: "Open enrollment — review your health plan",
    explanation:
      "Premiums, deductibles, and HSA eligibility can shift year to year — a 20-minute review can save thousands.",
  });

  items.push({
    id: "dec-401k-max",
    month: 12,
    day: 31,
    title:
      "Max out 401k before year end — check your remaining contribution room",
    explanation:
      "Payroll systems need time to process changes — don’t wait until the last pay period to bump contributions.",
  });

  items.push({
    id: "dec-tlh-general",
    month: 12,
    day: 31,
    title:
      "Tax loss harvesting check — review your brokerage for losses to offset gains",
    explanation:
      "Offsetting realized gains with losses can lower your tax bill — wash-sale rules apply, so plan swaps carefully.",
  });

  if (answers.taxableBrokerage === "yes") {
    items.push({
      id: "dec-tlh-brokerage",
      month: 12,
      day: 31,
      title:
        "Tax loss harvesting — review portfolio for losses to offset capital gains before year end",
      explanation:
        "If you sold winners this year, pairing with intentional losses (without breaking wash-sale rules) can help.",
    });
  }

  items.sort(compareActions);
  return items;
}

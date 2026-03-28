export type DashboardTab =
  | "calendar"
  | "tips"
  | "checklist"
  | "calculator"
  | "about";

const VALID: DashboardTab[] = [
  "calendar",
  "tips",
  "checklist",
  "calculator",
  "about",
];

export function parseDashboardTab(value: string | null): DashboardTab {
  if (value && VALID.includes(value as DashboardTab)) {
    return value as DashboardTab;
  }
  return "calendar";
}

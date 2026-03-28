"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { clearSessionUser, getSessionUser } from "@/lib/auth";
import {
  clearOnboarding,
  dismissMonthlyModal,
  getOnboarding,
} from "@/lib/storage";
import type { DashboardTab } from "@/lib/dashboard-tabs";

const DASH_LINKS: { tab: DashboardTab; label: string }[] = [
  { tab: "calendar", label: "Calendar" },
  { tab: "tips", label: "Tips" },
  { tab: "checklist", label: "Checklist" },
  { tab: "calculator", label: "Calculator" },
  { tab: "about", label: "About me" },
];

function useAuthSnapshot() {
  const pathname = usePathname();
  const [snap, setSnap] = React.useState({ user: false, onboarded: false });

  React.useEffect(() => {
    setSnap({
      user: !!getSessionUser(),
      onboarded: !!getOnboarding(),
    });
  }, [pathname]);

  return snap;
}

function DashboardTabRow({ onRedoBaseline }: { onRedoBaseline: () => void }) {
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") || "calendar";

  return (
    <div className="flex items-stretch gap-2 border-t border-playbook-black/[0.06] bg-white/80 sm:items-center sm:justify-between">
      <nav
        className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-2 sm:gap-10 sm:py-2.5"
        aria-label="Dashboard sections"
      >
        {DASH_LINKS.map(({ tab, label }) => {
          const isActive = active === tab;
          return (
            <Link
              key={tab}
              href={`/dashboard?tab=${tab}`}
              scroll={false}
              className={cn(
                "relative shrink-0 px-2 py-1 text-sm font-medium transition-colors sm:px-0",
                isActive
                  ? "text-playbook-black"
                  : "text-playbook-muted hover:text-playbook-black"
              )}
            >
              {label}
              {isActive ? (
                <span
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-playbook-green sm:left-0 sm:right-0"
                  aria-hidden
                />
              ) : null}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={onRedoBaseline}
        className="hidden shrink-0 self-center text-sm font-medium text-playbook-muted transition-colors hover:text-playbook-black sm:block"
      >
        Redo baseline
      </button>
      <button
        type="button"
        onClick={onRedoBaseline}
        className="shrink-0 border-l border-playbook-black/[0.06] px-3 py-2 text-xs font-medium text-playbook-muted sm:hidden"
      >
        Redo
      </button>
    </div>
  );
}

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, onboarded } = useAuthSnapshot();

  const logoHref =
    user && onboarded
      ? "/dashboard?tab=calendar"
      : user
        ? "/onboarding"
        : "/";

  function logout() {
    clearSessionUser();
    router.push("/");
    router.refresh();
  }

  function redoBaseline() {
    const d = new Date();
    clearOnboarding();
    dismissMonthlyModal(d.getFullYear(), d.getMonth() + 1);
    router.push("/onboarding");
    router.refresh();
  }

  const showDashboardNav = pathname === "/dashboard" && onboarded;
  const showBaselineCrumb = pathname === "/onboarding" && user;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-playbook-black/[0.08] bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-[52px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={logoHref}
              className="shrink-0 text-[15px] font-semibold tracking-tight text-playbook-black"
            >
              Dad&apos;s Playbook
            </Link>
            {showBaselineCrumb ? (
              <span className="hidden truncate text-sm text-playbook-muted md:inline">
                <span className="font-medium text-playbook-black">Baseline</span>
                <span className="mx-2 text-playbook-line">·</span>
                Let&apos;s set your baseline
              </span>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-4 sm:gap-6">
            {user && onboarded && pathname === "/dashboard" ? (
              <button
                type="button"
                onClick={logout}
                className="text-sm font-medium text-playbook-black transition-opacity hover:opacity-65"
              >
                Log out
              </button>
            ) : null}
            {user && !onboarded && pathname === "/onboarding" ? (
              <button
                type="button"
                onClick={logout}
                className="text-sm font-medium text-playbook-black transition-opacity hover:opacity-65"
              >
                Log out
              </button>
            ) : null}
            {!user && pathname !== "/" ? (
              <Link
                href="/"
                className="text-sm font-medium text-playbook-black transition-opacity hover:opacity-65"
              >
                Log in
              </Link>
            ) : null}
          </div>
        </div>

        {showDashboardNav ? (
          <React.Suspense
            fallback={
              <div className="h-[44px] border-t border-playbook-black/[0.06]" />
            }
          >
            <DashboardTabRow onRedoBaseline={redoBaseline} />
          </React.Suspense>
        ) : null}
      </div>
    </header>
  );
}

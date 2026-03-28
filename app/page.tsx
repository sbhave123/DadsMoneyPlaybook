"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSessionUser, setSessionUser } from "@/lib/auth";
import { getOnboarding } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const [firstName, setFirstName] = React.useState("");
  const [email, setEmail] = React.useState("");
  /** anon = show form; redirecting = session found, navigating away */
  const [gate, setGate] = React.useState<"pending" | "anon" | "redirecting">(
    "pending"
  );

  React.useEffect(() => {
    try {
      const user = getSessionUser();
      if (!user) {
        setGate("anon");
        return;
      }
      const onboarding = getOnboarding();
      const dest = onboarding
        ? "/dashboard?tab=calendar"
        : "/onboarding";
      setGate("redirecting");
      router.replace(dest);
      const hardNav = window.setTimeout(() => {
        if (window.location.pathname === "/") {
          window.location.assign(dest);
        }
      }, 2500);
      return () => window.clearTimeout(hardNav);
    } catch {
      setGate("anon");
    }
  }, [router]);

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !email.trim()) return;
    setSessionUser({
      firstName: firstName.trim(),
      email: email.trim().toLowerCase(),
    });
    const onboarding = getOnboarding();
    router.push(
      onboarding ? "/dashboard?tab=calendar" : "/onboarding"
    );
  }

  if (gate === "pending" || gate === "redirecting") {
    return (
      <div className="min-h-dvh bg-playbook-surface">
        <main className="mx-auto flex max-w-app flex-col items-center justify-center gap-3 px-5 py-16">
          <p className="text-sm text-playbook-muted">
            {gate === "redirecting"
              ? "Taking you to your workspace…"
              : "Loading…"}
          </p>
          {gate === "redirecting" ? (
            <button
              type="button"
              className="text-xs font-medium text-playbook-black underline-offset-2 hover:underline"
              onClick={() => {
                const onboarding = getOnboarding();
                window.location.assign(
                  onboarding
                    ? "/dashboard?tab=calendar"
                    : "/onboarding"
                );
              }}
            >
              Stuck? Open workspace
            </button>
          ) : null}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-playbook-surface">
      <main className="mx-auto max-w-app px-5 pb-12 pt-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-playbook-muted">
          Sign in
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-playbook-black">
          Welcome back
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-playbook-muted">
          Sign in on this device to continue your financial accountability flow.
        </p>
      </header>

      <form
        onSubmit={handleContinue}
        className="space-y-4 rounded-rh border border-playbook-line bg-white p-5 shadow-sm"
      >
        <div className="space-y-1">
          <label className="text-sm font-medium text-playbook-black" htmlFor="name">
            First name
          </label>
          <input
            id="name"
            className="h-11 w-full rounded-rh border border-playbook-line bg-white px-3 text-sm text-playbook-black outline-none ring-playbook-black/10 focus:ring-2"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Siddhi"
            autoComplete="given-name"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-playbook-black" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="h-11 w-full rounded-rh border border-playbook-line bg-white px-3 text-sm text-playbook-black outline-none ring-playbook-black/10 focus:ring-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={!firstName.trim() || !email.trim()}
        >
          Continue
        </Button>
      </form>
      <p className="mt-4 text-xs leading-relaxed text-playbook-muted">
        This login is local-only for MVP testing (stored in browser localStorage).
      </p>
      </main>
    </div>
  );
}


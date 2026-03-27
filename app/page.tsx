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
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const user = getSessionUser();
    if (!user) {
      setReady(true);
      return;
    }
    const onboarding = getOnboarding();
    router.replace(onboarding ? "/dashboard" : "/onboarding");
  }, [router]);

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !email.trim()) return;
    setSessionUser({
      firstName: firstName.trim(),
      email: email.trim().toLowerCase(),
    });
    const onboarding = getOnboarding();
    router.push(onboarding ? "/dashboard" : "/onboarding");
  }

  if (!ready) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-app items-center justify-center px-5">
        <p className="text-sm text-stone-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-app px-5 pb-10 pt-10">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-playbook-green/70">
          Dad&apos;s Playbook
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-playbook-green">
          Welcome back
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Sign in on this device to continue your financial accountability flow.
        </p>
      </header>

      <form
        onSubmit={handleContinue}
        className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
      >
        <div className="space-y-1">
          <label className="text-sm font-medium text-stone-700" htmlFor="name">
            First name
          </label>
          <input
            id="name"
            className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm outline-none ring-playbook-green/25 focus:ring-2"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Siddhi"
            autoComplete="given-name"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-stone-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm outline-none ring-playbook-green/25 focus:ring-2"
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
      <p className="mt-4 text-xs leading-relaxed text-stone-500">
        This login is local-only for MVP testing (stored in browser localStorage).
      </p>
    </main>
  );
}


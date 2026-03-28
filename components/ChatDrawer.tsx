"use client";

import * as React from "react";
import { Send } from "lucide-react";
import type { OnboardingAnswers } from "@/lib/types";
import type { TimelineAction } from "@/lib/types";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatRole = "user" | "assistant";

export type ChatMessage = { role: ChatRole; content: string };

type ChatDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: TimelineAction | null;
  profile: OnboardingAnswers;
};

export function ChatDrawer({
  open,
  onOpenChange,
  action,
  profile,
}: ChatDrawerProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const lastActionId = React.useRef<string | null>(null);

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      onOpenChange(next);
      if (!next) lastActionId.current = null;
    },
    [onOpenChange]
  );

  React.useEffect(() => {
    if (!open || !action) return;
    if (lastActionId.current !== action.id) {
      lastActionId.current = action.id;
      setStreaming("");
      setError(null);
      void kickoff(action);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one kickoff per open + action id
  }, [open, action]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streaming, loading]);

  async function runChat(msgs: ChatMessage[]) {
    if (!action) return;
    setMessages(msgs);
    setLoading(true);
    setStreaming("");
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: msgs,
          actionItemTitle: action.title,
          profile,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Something went wrong. Try again.");
      }
      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreaming(full);
      }
      setMessages([...msgs, { role: "assistant", content: full }]);
      setStreaming("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach Dad’s desk.");
    } finally {
      setLoading(false);
    }
  }

  async function kickoff(a: TimelineAction) {
    const starter: ChatMessage = {
      role: "user",
      content:
        "I’m ready. Explain why this matters for me right now, then walk me through exactly what to do — one step at a time.",
    };
    await runChat([starter]);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading || !action) return;
    const next: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setInput("");
    await runChat(next);
  }

  return (
    <Drawer
      direction="right"
      open={open}
      onOpenChange={handleOpenChange}
      shouldScaleBackground={false}
    >
      <DrawerContent className="max-w-app md:max-w-[min(100%,380px)]">
        <DrawerHeader className="border-b border-playbook-line px-4 pb-4 pt-2 text-left">
          <DrawerTitle className="pr-8 text-playbook-black">
            Ask Dad
          </DrawerTitle>
          <DrawerDescription className="line-clamp-2 text-left">
            {action?.title ?? "Pick an action on your timeline to chat."}
          </DrawerDescription>
        </DrawerHeader>

        <div
          ref={scrollRef}
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-4"
        >
          {messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={cn(
                "flex gap-2",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {m.role === "assistant" && (
                <div
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-playbook-green text-xs font-bold text-playbook-black shadow-sm"
                  aria-hidden
                >
                  D
                </div>
              )}
              <div
                className={cn(
                  "max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed shadow-sm",
                  m.role === "user"
                    ? "rounded-br-md bg-playbook-black text-white"
                    : "rounded-bl-md border border-playbook-line bg-playbook-surface text-playbook-black"
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {streaming ? (
            <div className="flex gap-2 justify-start">
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-playbook-green text-xs font-bold text-playbook-black shadow-sm"
                aria-hidden
              >
                D
              </div>
              <div className="max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-playbook-line bg-playbook-surface px-3.5 py-2.5 text-[15px] leading-relaxed text-playbook-black shadow-sm">
                {streaming}
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-playbook-green align-middle" />
              </div>
            </div>
          ) : null}
          {loading && !streaming ? (
            <p className="pl-11 text-sm text-stone-500">Dad is typing…</p>
          ) : null}
          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}
        </div>

        <form
          onSubmit={handleSend}
          className="border-t border-playbook-line bg-white/95 p-3 backdrop-blur-sm"
        >
          <div className="flex gap-2">
            <input
              className="min-h-11 flex-1 rounded-rh border border-playbook-line bg-white px-3 text-[15px] text-playbook-black shadow-inner outline-none ring-playbook-black/10 placeholder:text-playbook-muted focus:ring-2"
              placeholder="Ask a follow-up…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || !action}
              autoComplete="off"
            />
            <Button
              type="submit"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-full"
              disabled={loading || !input.trim() || !action}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <DrawerClose asChild>
            <Button
              type="button"
              variant="ghost"
              className="mt-2 w-full text-stone-500"
            >
              Close
            </Button>
          </DrawerClose>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

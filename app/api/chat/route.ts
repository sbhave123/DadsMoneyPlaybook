import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

type IncomingMessage = { role: "user" | "assistant"; content: string };

function buildSystemPrompt(actionItemTitle: string, profile: unknown): string {
  return `You are a financially savvy parent — warm, direct, and practical. You have deep knowledge of tax optimization, retirement accounts, and personal finance strategy. Your job is to help young professionals (first job, 22–28 years old) understand exactly what to do with their money and why.

Your tone is like a trusted parent who happens to be a CFP: encouraging, never condescending, and always specific. You give ONE clear action at a time. You never overwhelm with options.

When explaining financial concepts:
- Lead with what the person should DO, not what the concept IS
- Use dollar examples tied to their income level
- Explain the tax benefit in plain English
- End every explanation with: "Bottom line: [one sentence action]"

The user is asking about: ${actionItemTitle}
Their financial profile: ${JSON.stringify(profile)}

Start by explaining why this action matters RIGHT NOW for their specific situation, then walk them through exactly how to do it step by step.`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("Server missing ANTHROPIC_API_KEY", { status: 500 });
  }

  let body: {
    messages?: IncomingMessage[];
    actionItemTitle?: string;
    profile?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { messages, actionItemTitle, profile } = body;
  if (
    !Array.isArray(messages) ||
    typeof actionItemTitle !== "string" ||
    !actionItemTitle.trim()
  ) {
    return new Response("Invalid request body", { status: 400 });
  }

  const anthropicMessages = messages
    .filter(
      (m): m is IncomingMessage =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    )
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  if (anthropicMessages.length === 0) {
    return new Response("No valid messages", { status: 400 });
  }

  const system = buildSystemPrompt(actionItemTitle, profile ?? {});

  try {
    const anthropic = new Anthropic({ apiKey });
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system,
      messages: anthropicMessages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Anthropic request failed";
    return new Response(message, { status: 502 });
  }
}

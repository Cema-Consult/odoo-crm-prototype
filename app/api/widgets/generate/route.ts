import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { GeneratedWidget } from "@/lib/schemas/widgets";
import { WIDGET_SYSTEM_PROMPT } from "@/lib/widgets/prompt";
import { requireAdmin } from "@/lib/auth/role";

const Body = z.object({ prompt: z.string().min(3).max(500) });

const client = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

const TOOL = {
  name: "emit_widget" as const,
  description: "Return the JSON widget spec.",
  input_schema: {
    type: "object" as const,
    properties: {
      type: { type: "string", enum: ["stat_tile", "bar_chart", "line_chart", "pie_chart", "record_table", "activity_feed"] },
      title: { type: "string" },
    },
    required: ["type", "title"],
    additionalProperties: true,
  },
};

async function callClaude(prompt: string, retryHint?: string) {
  const msg = await client().messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    system: WIDGET_SYSTEM_PROMPT,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "emit_widget" },
    messages: [{
      role: "user",
      content: retryHint
        ? `${prompt}\n\nPrevious attempt failed: ${retryHint}. Try again, valid JSON only.`
        : prompt,
    }],
  });
  const tool = msg.content.find(c => c.type === "tool_use");
  if (!tool || tool.type !== "tool_use") throw new Error("no tool_use block returned");
  return tool.input;
}

export async function POST(req: Request) {
  const forbidden = requireAdmin();
  if (forbidden) return forbidden;
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: { code: "NO_LLM_KEY", message: "ANTHROPIC_API_KEY not set" } }, { status: 500 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });

  try {
    const firstRaw = await callClaude(parsed.data.prompt);
    const first = GeneratedWidget.safeParse(firstRaw);
    if (first.success) return NextResponse.json({ spec: first.data, prompt: parsed.data.prompt });

    const secondRaw = await callClaude(parsed.data.prompt, first.error.message);
    const second = GeneratedWidget.safeParse(secondRaw);
    if (second.success) return NextResponse.json({ spec: second.data, prompt: parsed.data.prompt });

    return NextResponse.json({ error: { code: "BAD_SPEC", message: second.error.message } }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: { code: "LLM_ERROR", message: (e as Error).message } }, { status: 502 });
  }
}

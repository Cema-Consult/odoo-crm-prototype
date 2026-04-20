import { NextResponse } from "next/server";
import { z } from "zod";
import { loginCookie } from "@/lib/auth/session";

const Body = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  }
  await loginCookie();
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { logoutCookie } from "@/lib/auth/session";
export async function POST() {
  await logoutCookie();
  return NextResponse.json({ ok: true });
}

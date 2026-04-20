import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data-source";
import { ActivityCreate } from "@/lib/schemas/core";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const opportunityId = url.searchParams.get("opportunityId") ?? undefined;
  const assignedTo = url.searchParams.get("assignedTo") ?? undefined;
  const doneParam = url.searchParams.get("done");
  const done = doneParam == null ? undefined : doneParam === "true";
  const rows = await getDataSource().activities.list({ opportunityId, assignedTo, done });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const parsed = ActivityCreate.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  const created = await getDataSource().activities.create(parsed.data);
  return NextResponse.json(created, { status: 201 });
}

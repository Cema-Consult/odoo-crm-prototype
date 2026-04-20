import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data-source";
import { OpportunityCreate, ListOpportunitiesQuery } from "@/lib/schemas/core";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = ListOpportunitiesQuery.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  const rows = await getDataSource().opportunities.list(parsed.data);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = OpportunityCreate.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  const created = await getDataSource().opportunities.create(parsed.data);
  return NextResponse.json(created, { status: 201 });
}

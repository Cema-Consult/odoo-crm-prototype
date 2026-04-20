import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data-source";
import { ContactCreate } from "@/lib/schemas/core";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? undefined;
  const isCompanyParam = url.searchParams.get("isCompany");
  const isCompany = isCompanyParam == null ? undefined : isCompanyParam === "true";
  const rows = await getDataSource().contacts.list({ q, isCompany });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = ContactCreate.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  }
  const created = await getDataSource().contacts.create(parsed.data);
  return NextResponse.json(created, { status: 201 });
}

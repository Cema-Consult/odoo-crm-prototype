import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data-source";
import { OpportunityPatch } from "@/lib/schemas/core";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getDataSource().opportunities.get(id);
  if (!row) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = OpportunityPatch.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  const updated = await getDataSource().opportunities.update(id, parsed.data);
  if (!updated) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = await getDataSource().opportunities.remove(id);
  if (!ok) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}

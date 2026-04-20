import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data-source";
import { ActivityPatch } from "@/lib/schemas/core";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = ActivityPatch.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  const updated = await getDataSource().activities.update(id, parsed.data);
  if (!updated) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  return NextResponse.json(updated);
}

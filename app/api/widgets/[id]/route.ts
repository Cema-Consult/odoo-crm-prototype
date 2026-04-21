import { NextResponse } from "next/server";
import { z } from "zod";
import { getDataSource } from "@/lib/data-source";

// Reject attempts to overwrite immutable fields; accept any other widget fields.
const PatchBody = z.object({}).passthrough().superRefine((val, ctx) => {
  for (const field of ["id", "createdAt", "createdBy"] as const) {
    if (field in (val as Record<string, unknown>)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Field '${field}' is immutable`, path: [field] });
    }
  }
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getDataSource().widgets.get(id);
  if (!row) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = PatchBody.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  const updated = await getDataSource().widgets.update(id, parsed.data as any);
  if (!updated) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = await getDataSource().widgets.remove(id);
  if (!ok) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}

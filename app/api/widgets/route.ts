import { NextResponse } from "next/server";
import { z } from "zod";
import { getDataSource } from "@/lib/data-source";
import { WidgetState, WidgetSpec } from "@/lib/schemas/widgets";
import { getCurrentUser } from "@/lib/auth/role";

const ListQuery = z.object({
  state: WidgetState.optional(),
  createdBy: z.string().optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = ListQuery.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  return NextResponse.json(await getDataSource().widgets.list(parsed.data));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const me = getCurrentUser();
  // Inject server-set fields with placeholder values so WidgetSpec can validate
  // the full shape. The create() method overwrites id/state/createdAt.
  const candidate = {
    ...body,
    createdBy: me.id,
    id: "__tmp__",
    state: "draft",
    createdAt: new Date().toISOString(),
  };
  const parsed = WidgetSpec.safeParse(candidate);
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  const created = await getDataSource().widgets.create(parsed.data as any);
  return NextResponse.json(created, { status: 201 });
}

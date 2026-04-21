import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data-source";
import { WidgetTransition } from "@/lib/schemas/widgets";
import { getCurrentUser, requireAdmin } from "@/lib/auth/role";

const ADMIN_ONLY: ReadonlyArray<string> = ["published"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = WidgetTransition.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });

  if (ADMIN_ONLY.includes(parsed.data.next)) {
    const forbidden = requireAdmin();
    if (forbidden) return forbidden;
  }

  const me = getCurrentUser();
  try {
    const updated = await getDataSource().widgets.transition(
      id, parsed.data.next, { by: me.id, isAdmin: me.role === "admin" }
    );
    if (!updated) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: (e as Error).message } }, { status: 403 });
  }
}

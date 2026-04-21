import { NextResponse } from "next/server";

// Prototype-only stub: the demo user is always u_anna (admin). A real app
// would resolve the current user from the session cookie.
export function getCurrentUser() {
  return { id: "u_anna", role: "admin" as const };
}

export function requireAdmin() {
  const u = getCurrentUser();
  if (u.role !== "admin") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Admin role required" } },
      { status: 403 }
    );
  }
  return null;
}

import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/login", "/api/auth/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some(p => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();
  const session = req.cookies.get("crm_session")?.value;
  if (!session) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Login required" } }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

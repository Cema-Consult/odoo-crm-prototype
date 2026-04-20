import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    id: "u_demo", name: "Demo User", email: "demo@crm.studio", avatar: "DU",
  });
}

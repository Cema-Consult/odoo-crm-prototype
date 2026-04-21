import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    id: "u_anna", name: "Anna Lindqvist", email: "anna@studio.co", avatar: "AL", role: "admin",
  });
}

import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data-source";

export async function GET() {
  return NextResponse.json(await getDataSource().dashboard.summary());
}

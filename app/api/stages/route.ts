import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data-source";

export async function GET() {
  const stages = await getDataSource().stages.list();
  return NextResponse.json(stages);
}

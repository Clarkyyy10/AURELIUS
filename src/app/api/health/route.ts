import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

/** Uptime check (NFR reliability: ≥ 95% during the evaluation). */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}

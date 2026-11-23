import { NextResponse, type NextRequest } from "next/server";
import { flushOutbox } from "@/server/email";

/** Daily retry of emails that failed to send (Vercel Cron; protected by CRON_SECRET). */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  return NextResponse.json(await flushOutbox(100));
}

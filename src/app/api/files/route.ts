import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http";
import { signedUrl } from "@/server/files";

/** Opens a private file through a 5-minute signed link, after checking the viewer may see it. */
export async function GET(req: NextRequest) {
  try {
    const me = await requireUser();
    const url = await signedUrl(req.nextUrl.searchParams.get("ref") ?? "", me);
    return NextResponse.redirect(url, { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  } catch (e) {
    return errorResponse(e);
  }
}

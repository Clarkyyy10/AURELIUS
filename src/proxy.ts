// Runs before every page and API request (Next.js 16 "proxy", formerly middleware).
// Phase 2 only (NEXT_PUBLIC_DATA_SOURCE=api):
//   * keeps the Supabase session cookies fresh;
//   * signs the user out after 30 minutes without activity (NFR security);
//   * sends guests who open /account or /admin pages to the login screen (NFR security).
// Owner-only checks happen in every API route; the admin pages show a 403 message to customers.

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { BACKGROUND_HEADER, IDLE_COOKIE, idleCookieOptions, isIdle, readSeen, signSeen } from "@/server/auth/idle";

const PROTECTED = ["/account", "/admin"];

export async function proxy(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_DATA_SOURCE !== "api") return NextResponse.next();

  let res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) req.cookies.set(name, value);
        res = NextResponse.next({ request: req });
        for (const { name, value, options } of list) res.cookies.set(name, value, options);
      },
    },
  });

  const path = req.nextUrl.pathname;
  const isApi = path.startsWith("/api/");
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (user) {
    const now = Date.now();
    const lastSeen = await readSeen(req.cookies.get(IDLE_COOKIE)?.value);
    if (isIdle(lastSeen, now)) {
      await sb.auth.signOut();
      const out = isApi
        ? NextResponse.json({ error: "You were signed out after 30 minutes without activity. Sign in to continue.", code: "idle" }, { status: 401 })
        : NextResponse.redirect(new URL(`/login?reason=idle&next=${encodeURIComponent(path)}`, req.url));
      for (const c of res.cookies.getAll()) out.cookies.set(c);
      out.cookies.delete(IDLE_COOKIE);
      return out;
    }
    if (!req.headers.get(BACKGROUND_HEADER)) res.cookies.set(IDLE_COOKIE, await signSeen(now), idleCookieOptions);
  } else if (PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))) {
    const login = new URL(`/login?next=${encodeURIComponent(path + req.nextUrl.search)}`, req.url);
    const out = NextResponse.redirect(login);
    for (const c of res.cookies.getAll()) out.cookies.set(c);
    return out;
  }
  return res;
}

export const config = {
  // Everything except static files, images and the 3D fonts.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|placeholders/|fonts/|.*\\.(?:svg|png|jpg|jpeg|webp|json|txt)$).*)"],
};

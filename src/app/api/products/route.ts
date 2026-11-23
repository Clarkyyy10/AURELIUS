import type { NextRequest } from "next/server";
import { listProducts, saveProduct } from "@/server/catalog";
import { currentUser, requireOwner } from "@/server/auth/session";
import { readJson, route } from "@/server/http";
import { productRequestSchema } from "@/server/schemas";

/** FR-12, FR-13 (guests see visible products) */
export const GET = route(async (req: NextRequest) => {
  const q = req.nextUrl.searchParams;
  const n = (k: string) => (q.get(k) ? Number(q.get(k)) : undefined);
  return listProducts(await currentUser(), {
    category: q.get("category") ?? undefined,
    material: q.get("material") ?? undefined,
    availability: q.get("availability") ?? undefined,
    minPrice: n("minPrice"),
    maxPrice: n("maxPrice"),
    search: q.get("search")?.slice(0, 80) ?? undefined,
    sort: (["newest", "price_asc", "price_desc"] as const).find((s) => s === q.get("sort")),
    includeHidden: q.get("includeHidden") === "1",
  });
});

/** FR-24 (owner) */
export const POST = route(async (req) => saveProduct(await requireOwner(), await readJson(req, productRequestSchema)));

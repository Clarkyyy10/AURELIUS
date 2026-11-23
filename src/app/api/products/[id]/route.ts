import type { NextRequest } from "next/server";
import { getProduct, removeProduct, saveProduct } from "@/server/catalog";
import { currentUser, requireOwner } from "@/server/auth/session";
import { notFound, readJson, route } from "@/server/http";
import { productRequestSchema } from "@/server/schemas";

type Ctx = { params: Promise<{ id: string }> };

/** By id, or by web address with ?by=slug */
export const GET = route<Ctx>(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const p = await getProduct(await currentUser(), req.nextUrl.searchParams.get("by") === "slug" ? { slug: id } : { id });
  if (!p) throw notFound("This product");
  return p;
});
export const PUT = route<Ctx>(async (req, { params }) =>
  saveProduct(await requireOwner(), { ...(await readJson(req, productRequestSchema)), id: (await params).id }),
);
export const DELETE = route<Ctx>(async (_req, { params }) => removeProduct(await requireOwner(), (await params).id));

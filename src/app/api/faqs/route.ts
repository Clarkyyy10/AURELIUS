import type { NextRequest } from "next/server";
import { listFaqs, saveFaq } from "@/server/catalog";
import { currentUser, requireOwner } from "@/server/auth/session";
import { readJson, route } from "@/server/http";
import { faqSchema } from "@/server/schemas";

/** FR-38 chatbot knowledge */
export const GET = route(async (req: NextRequest) => listFaqs(await currentUser(), req.nextUrl.searchParams.get("includeInactive") === "1"));
export const POST = route(async (req) => saveFaq(await requireOwner(), await readJson(req, faqSchema)));

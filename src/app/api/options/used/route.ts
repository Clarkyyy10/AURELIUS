import { usedOptionIds } from "@/server/catalog";
import { requireOwner } from "@/server/auth/session";
import { route } from "@/server/http";

export const GET = route(async () => [...(await usedOptionIds(await requireOwner()))]);

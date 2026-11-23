import { listCustomers } from "@/server/catalog";
import { requireOwner } from "@/server/auth/session";
import { route } from "@/server/http";

/** FR-48 */
export const GET = route(async () => listCustomers(await requireOwner()));

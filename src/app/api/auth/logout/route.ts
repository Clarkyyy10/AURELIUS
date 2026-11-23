import { logout } from "@/server/auth/service";
import { route } from "@/server/http";

export const POST = route(async () => {
  await logout();
});

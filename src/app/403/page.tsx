import { SiteShell } from "@/components/layout/SiteShell";
import { Forbidden } from "@/components/layout/Guards";

export const metadata = { title: "Owner only" };

export default function ForbiddenPage() {
  return (
    <SiteShell>
      <Forbidden />
    </SiteShell>
  );
}

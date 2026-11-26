import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <SiteShell>
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <p className="text-sm font-medium text-muted-foreground">Error 404</p>
        <h1 className="mt-1 text-4xl">We couldn&apos;t find that page</h1>
        <p className="mt-2 text-muted-foreground">The link may be old, or the page may have moved. Check the address, or go back to the store.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/">Back to the store</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/shop">Browse the shop</Link>
          </Button>
        </div>
      </div>
    </SiteShell>
  );
}

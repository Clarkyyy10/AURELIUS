"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <p className="text-sm font-medium text-muted-foreground">Something went wrong</p>
      <h1 className="mt-1 text-4xl">This page had a problem</h1>
      <p className="mt-2 text-muted-foreground">It&apos;s not your fault. Try again, and if it keeps happening, go back to the home page.</p>
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}

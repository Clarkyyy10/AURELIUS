"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

/** Three.js is loaded only when a viewer is on screen, so other pages stay fast (NFR performance). */
export const LazyJewelryViewer = dynamic(() => import("./JewelryViewer").then((m) => m.JewelryViewer), {
  ssr: false,
  loading: () => <ViewerLoading />,
});

export function ViewerLoading({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full min-h-64 w-full items-center justify-center rounded-none bg-grey-100", className)} role="status">
      <span className="text-sm text-muted-foreground">Loading 3D preview…</span>
    </div>
  );
}

export type { CaptureFn } from "./JewelryViewer";

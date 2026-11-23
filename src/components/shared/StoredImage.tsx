"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { getFile, isFileRef } from "@/lib/data/mock/fileStore";
import { isServerFileRef, serverFileUrl } from "@/lib/data/api/files";
import { cn } from "@/lib/utils";

/** Resolves a stored file reference ("idb:…", "file:…" on the server, data URL, or /public path) to a URL. */
export function useFileUrl(ref?: string): { url: string | null; type: string | null } {
  const server = ref ? isServerFileRef(ref) : false;
  const [resolved, setResolved] = useState<{ ref?: string; url: string | null; type: string | null }>({ url: null, type: null });

  useEffect(() => {
    if (!ref || server || !isFileRef(ref)) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    getFile(ref).then((blob) => {
      if (cancelled || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setResolved({ ref, url: objectUrl, type: blob.type });
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [ref, server]);

  if (!ref) return { url: null, type: null };
  // Phase 2: private files open through a short-lived signed link after an access check.
  if (server) return { url: serverFileUrl(ref), type: ref.endsWith(".pdf") ? "application/pdf" : "image/*" };
  if (!isFileRef(ref)) return { url: ref, type: ref.endsWith(".pdf") || ref.startsWith("data:application/pdf") ? "application/pdf" : "image/*" };
  return resolved.ref === ref ? { url: resolved.url, type: resolved.type } : { url: null, type: null };
}

/** <img> for stored photos. Uses a plain img because sources may be blob: or data: URLs. */
export function StoredImage({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const { url, type } = useFileUrl(src);
  if (type === "application/pdf") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-1 bg-muted text-muted-foreground", className)}>
        <FileText className="size-8" aria-hidden />
        <span className="text-xs">PDF file</span>
      </div>
    );
  }
  if (!url) return <div className={cn("animate-pulse bg-muted", className)} aria-label={alt} role="img" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={cn("object-cover", className)} loading="lazy" />;
}

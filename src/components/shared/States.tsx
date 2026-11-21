"use client";

import Link from "next/link";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
  className,
}: {
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-xl border border-dashed border-line bg-paper/60 px-6 py-10 text-center", className)}>
      <Icon className="mb-3 size-8 text-gold" aria-hidden />
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action &&
        (action.href ? (
          <Button asChild className="mt-4">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button className="mt-4" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </div>
  );
}

export function ErrorState({ message, onRetry, className }: { message: string; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={cn("flex flex-col items-center rounded-xl border border-danger/30 bg-danger/5 px-6 py-8 text-center", className)}>
      <AlertTriangle className="mb-2 size-7 text-danger" aria-hidden />
      <p className="font-medium text-danger">We couldn&apos;t load this</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function LoadingState({ rows = 3, className, label = "Loading…" }: { rows?: number; className?: string; label?: string }) {
  return (
    <div className={cn("space-y-3", className)} role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} aria-hidden />;
}

/** Renders loading / error / empty / content for a useQuery result. */
export function QueryView<T>({
  query,
  empty,
  loadingRows,
  children,
}: {
  query: { data?: T; error?: string; loading: boolean; reload: () => void };
  empty?: (data: T) => React.ReactNode | null;
  loadingRows?: number;
  children: (data: T) => React.ReactNode;
}) {
  if (query.error) return <ErrorState message={query.error} onRetry={query.reload} />;
  if (query.loading || query.data === undefined) return <LoadingState rows={loadingRows} />;
  const e = empty?.(query.data);
  if (e) return <>{e}</>;
  return <>{children(query.data)}</>;
}

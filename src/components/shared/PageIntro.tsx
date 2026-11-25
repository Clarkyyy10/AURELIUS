import { cn } from "@/lib/utils";

/** Storefront page frame: 1200 px container, a large serif title and a short lead paragraph. */
export function PageIntro({ title, lead, children, className }: { title: string; lead?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-10", className)}>
      <h1 className="type-hero">{title}</h1>
      {lead && <p className="mt-3 max-w-[560px] text-[17px] leading-7 text-grey-700">{lead}</p>}
      {children}
    </div>
  );
}

export function StoreContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-4 pt-6 sm:px-6 lg:pt-4", className)}>{children}</div>;
}

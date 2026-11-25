import Link from "next/link";
import { Battery, Flame, Gem, History, PaintBucket, PenTool, Ruler, Sparkles, Wand2, Watch, Waves, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ServiceCatalogItem } from "@/types";

export const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  wand: Wand2,
  ruler: Ruler,
  wrench: Wrench,
  gem: Gem,
  history: History,
  "pen-tool": PenTool,
  flame: Flame,
  "paint-bucket": PaintBucket,
  waves: Waves,
  battery: Battery,
  watch: Watch,
};

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = SERVICE_ICONS[name] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}

/** FR-25 service card. */
export function ServiceCard({ service, compact }: { service: ServiceCatalogItem; compact?: boolean }) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-line bg-paper p-5">
      <span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-gold/15">
        <ServiceIcon name={service.icon} className="size-5 text-gold-dark" />
      </span>
      <h3 className="font-sans text-lg font-semibold">{service.name}</h3>
      <p className="mt-1 flex-1 text-sm text-muted-foreground">{service.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {service.appliesTo.map((a) => (
          <span key={a} className="rounded-sm bg-muted px-2 py-0.5 text-xs">
            For {a === "jewelry" ? "jewelry" : "watches"}
          </span>
        ))}
      </div>
      {!compact && (
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/services/request?service=${service.id}`}>Request this service</Link>
        </Button>
      )}
    </article>
  );
}

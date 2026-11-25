import Link from "next/link";
import { ArrowRight, Battery, Flame, Gem, History, PaintBucket, PenTool, Ruler, Sparkles, Wand2, Watch, Waves, Wrench } from "lucide-react";
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

const appliesLabel = (a: ServiceCatalogItem["appliesTo"]) =>
  a.includes("jewelry") && a.includes("watch") ? "Jewelry and watches" : a.includes("watch") ? "Watches" : "Jewelry";

/** FR-25 service card: what it applies to, name, description and the request link. */
export function ServiceCard({ service, compact }: { service: ServiceCatalogItem; compact?: boolean }) {
  return (
    <article className="flex h-full flex-col border border-grey-500 bg-white p-5">
      <p className="text-sm text-grey-700">{appliesLabel(service.appliesTo)}</p>
      <h3 className="mt-3 font-sans text-lg leading-6 font-semibold">{service.name}</h3>
      <p className="mt-3 flex-1 text-[15px] leading-[22px] text-grey-700">{service.description}</p>
      {!compact && (
        <Link
          href={`/services/request?service=${service.id}`}
          className="mt-5 inline-flex min-h-6 items-center gap-1 self-start text-[15px] font-medium text-black underline-offset-4 hover:underline"
        >
          Request this service <ArrowRight className="size-4" aria-hidden />
          <span className="sr-only">: {service.name}</span>
        </Link>
      )}
    </article>
  );
}

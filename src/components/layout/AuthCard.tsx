import { RingGlyph } from "./Logo";

export function AuthCard({ title, description, children, footer }: { title: string; description?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
      <div className="rounded-2xl border border-line bg-paper p-6 shadow-sm sm:p-8">
        <RingGlyph className="mb-3 size-7 text-gold" />
        <h1 className="text-3xl">{title}</h1>
        {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-4 text-center text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}

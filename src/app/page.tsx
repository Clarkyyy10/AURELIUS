import { brand } from "@/config/brand";

export default function Home() {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="type-display">{brand.name}</h1>
      <p className="type-body text-muted-foreground">
        The store is being built. See the docs folder for requirements and the
        sprint plan.
      </p>
    </div>
  );
}

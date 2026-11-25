"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ServiceIcon } from "@/components/services/ServiceCard";
import { Field, FormError } from "@/components/shared/Field";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, QueryView, Spinner } from "@/components/shared/States";
import { repos } from "@/lib/data";
import { errorMessage, useQuery } from "@/lib/data/hooks";
import { serviceCatalogSchema } from "@/lib/validation/schemas";
import type { ItemKind, ServiceCatalogItem } from "@/types";

/** FR-34 — add, edit, reorder, and hide services. */
export default function ServiceCatalogPage() {
  const q = useQuery("owner:services", () => repos.catalog.listServices({ includeHidden: true }));
  const [editing, setEditing] = useState<ServiceCatalogItem | "new" | null>(null);

  const save = async (s: ServiceCatalogItem, patch: Partial<ServiceCatalogItem>) => {
    try {
      await repos.catalog.saveService({ ...s, ...patch });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <>
      <PageHeader
        title="Service catalog"
        description="Services customers can request. The order here is the order customers see."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus className="size-4" /> Add service
          </Button>
        }
      />
      <QueryView
        query={q}
        empty={(l) => (l.length === 0 ? <EmptyState title="No services yet" action={{ label: "Add a service", onClick: () => setEditing("new") }} /> : null)}
      >
        {(list) => (
          <ol className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-paper">
            {list.map((s, i) => (
              <li key={s.id} className={`flex flex-wrap items-center gap-3 p-4 ${s.hidden ? "bg-muted/50" : ""}`}>
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={i === 0}
                    onClick={() => void repos.catalog.moveService(s.id, "up")}
                    aria-label={`Move ${s.name} up`}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={i === list.length - 1}
                    onClick={() => void repos.catalog.moveService(s.id, "down")}
                    aria-label={`Move ${s.name} down`}
                  >
                    <ArrowDown />
                  </Button>
                </div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-gold/15">
                  <ServiceIcon name={s.icon} className="size-5 text-gold-dark" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {s.name} {s.hidden && <span className="ml-1 rounded-sm bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">Hidden</span>}
                  </p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                  <p className="text-xs text-muted-foreground">For {s.appliesTo.map((a) => (a === "jewelry" ? "jewelry" : "watches")).join(" and ")}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(s)}>
                    <Pencil className="size-4" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await save(s, { hidden: !s.hidden });
                      toast.success(s.hidden ? `${s.name} is shown again.` : `${s.name} is hidden from customers.`);
                    }}
                  >
                    {s.hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />} {s.hidden ? "Show" : "Hide"}
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </QueryView>
      {editing && <ServiceDialog service={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function ServiceDialog({ service, onClose }: { service: ServiceCatalogItem | null; onClose: () => void }) {
  const [name, setName] = useState(service?.name ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [appliesTo, setAppliesTo] = useState<ItemKind[]>(service?.appliesTo ?? ["jewelry"]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const r = serviceCatalogSchema.safeParse({ name, description, appliesTo, hidden: service?.hidden ?? false });
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setBusy(true);
    try {
      await repos.catalog.saveService({ ...r.data, id: service?.id, icon: service?.icon });
      toast.success(service ? "Service saved." : "Service added.");
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{service ? `Edit ${service.name}` : "Add a service"}</DialogTitle>
          <DialogDescription>Use plain words customers understand.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormError message={error} />
          <Field label="Service name" error={errors.name}>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Description" error={errors.description} hint="Two short sentences work best.">
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">For</legend>
            <div className="flex gap-4">
              {(["jewelry", "watch"] as const).map((k) => (
                <label key={k} className="flex items-center gap-2">
                  <Checkbox checked={appliesTo.includes(k)} onCheckedChange={(v) => setAppliesTo((a) => (v ? [...a, k] : a.filter((x) => x !== k)))} />
                  {k === "jewelry" ? "Jewelry" : "Watches"}
                </label>
              ))}
            </div>
            {errors.appliesTo && <p className="mt-1 text-sm text-danger">{errors.appliesTo}</p>}
          </fieldset>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Spinner />} Save service
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

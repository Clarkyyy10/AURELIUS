"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VerifyEmailBanner } from "@/components/layout/Guards";
import { ServiceIcon } from "@/components/services/ServiceCard";
import { Field, FormError } from "@/components/shared/Field";
import { FileDropzone, type StoredFile } from "@/components/shared/FileDropzone";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState, LoadingState, Spinner } from "@/components/shared/States";
import { StoredImage } from "@/components/shared/StoredImage";
import { CodeChip } from "@/components/shared/Text";
import { repos } from "@/lib/data";
import { errorMessage, newRequestId, useCurrentUser, useQuery } from "@/lib/data/hooks";
import { cn } from "@/lib/utils";
import { formatDate, todayISODate } from "@/lib/utils/format";
import { PHOTO_TYPES, serviceRequestSchema, type ServiceRequestInput } from "@/lib/validation/schemas";
import type { Draft, ServiceCatalogItem, ServiceRequest } from "@/types";

/** FR-26 — service request form with a review step. Draft mode (?draft=) is pre-filled by the chatbot (FR-37). */
function RequestLoader() {
  const params = useSearchParams();
  const draftId = params.get("draft");
  const preselect = params.get("service");
  const servicesQ = useQuery("services:visible", () => repos.catalog.listServices());
  const draftQ = useQuery(`draft:${draftId}`, async () => (draftId ? repos.drafts.get(draftId) : null));
  const failed = [servicesQ, draftQ].find((q) => q.error);
  if (failed) return <ErrorState message={failed.error!} onRetry={failed.reload} />;
  if (servicesQ.loading || draftQ.loading || !servicesQ.data) return <LoadingState rows={4} />;
  const draft = draftQ.data?.kind === "service_request" ? draftQ.data : null;
  return <RequestForm key={`${draftId}|${preselect}`} services={servicesQ.data} draft={draft} preselect={preselect} />;
}

function RequestForm({ services, draft, preselect }: { services: ServiceCatalogItem[]; draft: Extract<Draft, { kind: "service_request" }> | null; preselect: string | null }) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [step, setStep] = useState<"form" | "review">("form");
  const [photos, setPhotos] = useState<StoredFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [requestId] = useState(newRequestId);
  const [done, setDone] = useState<ServiceRequest | null>(null);

  const form = useForm<ServiceRequestInput>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      itemType: draft?.fields.itemType ?? (services.find((s) => s.id === preselect)?.appliesTo.length === 1 ? services.find((s) => s.id === preselect)!.appliesTo[0] : "jewelry"),
      itemDescription: draft?.fields.itemDescription ?? "",
      brandModel: draft?.fields.brandModel ?? "",
      material: draft?.fields.material ?? "",
      serviceIds: draft?.fields.serviceIds ?? (preselect && services.some((s) => s.id === preselect) ? [preselect] : []),
      details: draft?.fields.details ?? "",
      photos: [],
      preferredDropOffDate: "",
    },
  });
  const { errors } = form.formState;
  const itemType = useWatch({ control: form.control, name: "itemType" });
  const values = useWatch({ control: form.control });
  const relevant = services.filter((s) => s.appliesTo.includes(itemType ?? "jewelry"));

  const toReview = form.handleSubmit(() => {
    setStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const submit = async () => {
    setError(null);
    if (!user) {
      router.push(`/login?next=${encodeURIComponent("/services/request")}`);
      return;
    }
    try {
      const v = serviceRequestSchema.parse({ ...form.getValues(), photos });
      const tx = await repos.services.submit({
        itemType: v.itemType,
        itemDescription: v.itemDescription,
        brandModel: v.itemType === "watch" ? v.brandModel || undefined : undefined,
        material: v.material || undefined,
        serviceIds: v.serviceIds,
        details: v.details,
        photos: photos.map((p) => p.dataUrl),
        preferredDropOffDate: v.preferredDropOffDate || undefined,
        source: draft ? "chatbot" : "form",
        clientRequestId: requestId,
      });
      setDone(tx);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  if (done)
    return (
      <div className="rounded-2xl border border-line bg-paper p-6 sm:p-10">
        <CheckCircle2 className="size-12 text-success" aria-hidden />
        <h1 className="mt-3 text-4xl">Your service request was sent</h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground">
          Request code <CodeChip code={done.code} />
        </p>
        <h2 className="mt-6 text-2xl">What happens next</h2>
        <p className="mt-2">The owner reviews your request and sends a quotation. Bring your item to the store when you accept it.</p>
        <div className="mt-8 flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/account/services/${done.id}`}>View my request</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/services">Back to services</Link>
          </Button>
        </div>
      </div>
    );

  const serviceNames = services.filter((s) => values.serviceIds?.includes(s.id)).map((s) => s.name);

  return (
    <div className="space-y-6">
      <PageHeader title="Request a service" back={{ href: "/services", label: "Back to services" }} description="Tell us about your item. The owner will look at your request and send a quotation." />
      {user && <VerifyEmailBanner user={user} action="submit a service request" />}
      {!user && (
        <p className="rounded-xl border border-line bg-paper p-3 text-sm">
          You can fill in the form now. You&apos;ll need to{" "}
          <Link href={`/login?next=${encodeURIComponent("/services/request")}`} className="text-gold-dark underline">
            log in
          </Link>{" "}
          to send it.
        </p>
      )}
      {draft && (
        <p className="flex items-start gap-2 rounded-xl border border-info/30 bg-info/10 p-3 text-sm">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-info" aria-hidden /> Your assistant filled this in. Review and change anything before submitting.
        </p>
      )}
      <ol className="flex gap-2 text-sm" aria-label="Steps">
        {["Your item", "Review and send"].map((s, i) => (
          <li key={s} aria-current={(i === 0 && step === "form") || (i === 1 && step === "review") ? "step" : undefined} className={cn("rounded-full px-3 py-1", (i === 0 && step === "form") || (i === 1 && step === "review") ? "bg-emerald text-ivory" : "bg-muted text-muted-foreground")}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      {step === "form" ? (
        <form onSubmit={toReview} noValidate className="space-y-5 rounded-2xl border border-line bg-paper p-5 sm:p-6">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">What kind of item is it?</legend>
            <Controller
              control={form.control}
              name="itemType"
              render={({ field }) => (
                <div role="radiogroup" className="grid max-w-md grid-cols-2 gap-2">
                  {(["jewelry", "watch"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={field.value === t}
                      onClick={() => {
                        field.onChange(t);
                        const keep = (form.getValues("serviceIds") ?? []).filter((id) => services.find((s) => s.id === id)?.appliesTo.includes(t));
                        form.setValue("serviceIds", keep);
                      }}
                      className={cn("rounded-xl border px-4 py-3 text-left font-medium", field.value === t ? "border-gold-dark bg-gold/10 ring-2 ring-gold/40" : "border-line")}
                    >
                      {t === "jewelry" ? "Jewelry" : "Watch"}
                    </button>
                  ))}
                </div>
              )}
            />
          </fieldset>

          <Field label="Describe your item" error={errors.itemDescription?.message} hint="For example: “18K gold wedding ring, plain band”. 10 to 300 characters.">
            <Input {...form.register("itemDescription")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            {itemType === "watch" && (
              <Field label="Brand and model" optional error={errors.brandModel?.message}>
                <Input {...form.register("brandModel")} placeholder="For example: Seiko 5 SNK809" />
              </Field>
            )}
            <Field label="Material" optional error={errors.material?.message}>
              <Input {...form.register("material")} placeholder="For example: 14K gold, stainless steel" />
            </Field>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Which services do you need?</legend>
            <Controller
              control={form.control}
              name="serviceIds"
              render={({ field }) => (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {relevant.map((s) => {
                    const checked = field.value?.includes(s.id) ?? false;
                    return (
                      <label key={s.id} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm", checked ? "border-gold-dark bg-gold/10" : "border-line")}>
                        <Checkbox checked={checked} onCheckedChange={(v) => field.onChange(v ? [...(field.value ?? []), s.id] : (field.value ?? []).filter((x) => x !== s.id))} />
                        <ServiceIcon name={s.icon} className="size-4 text-gold-dark" />
                        {s.name}
                      </label>
                    );
                  })}
                </div>
              )}
            />
            {errors.serviceIds && (
              <p className="mt-1 text-sm text-danger" role="alert">
                {errors.serviceIds.message}
              </p>
            )}
          </fieldset>

          <Field label="What's wrong, or what would you like done?" error={errors.details?.message} hint="Describe the condition and what you want. 10 to 1,000 characters.">
            <Textarea rows={4} {...form.register("details")} />
          </Field>

          <FileDropzone label="Photos of your item (optional)" accept={PHOTO_TYPES} max={3} value={photos} onChange={setPhotos} hint="JPG or PNG, up to 5 MB each, up to 3 photos." />

          <Field label="Preferred drop-off date" optional error={errors.preferredDropOffDate?.message}>
            <Input type="date" min={todayISODate()} className="max-w-56" {...form.register("preferredDropOffDate")} />
          </Field>

          <Button type="submit" size="lg">
            Review my request
          </Button>
        </form>
      ) : (
        <div className="space-y-5 rounded-2xl border border-line bg-paper p-5 sm:p-6">
          <h2 className="text-2xl">Check your request</h2>
          <dl className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Item type</dt>
            <dd className="capitalize">{values.itemType}</dd>
            <dt className="text-muted-foreground">Item</dt>
            <dd>{values.itemDescription}</dd>
            {values.itemType === "watch" && values.brandModel && (
              <>
                <dt className="text-muted-foreground">Brand / model</dt>
                <dd>{values.brandModel}</dd>
              </>
            )}
            {values.material && (
              <>
                <dt className="text-muted-foreground">Material</dt>
                <dd>{values.material}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Services</dt>
            <dd>{serviceNames.join(", ")}</dd>
            <dt className="text-muted-foreground">Details</dt>
            <dd className="whitespace-pre-line">{values.details}</dd>
            <dt className="text-muted-foreground">Drop-off date</dt>
            <dd>{values.preferredDropOffDate ? formatDate(values.preferredDropOffDate) : "Not set"}</dd>
          </dl>
          {photos.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {photos.map((p) => (
                <li key={p.dataUrl}>
                  <StoredImage src={p.dataUrl} alt={p.name} className="size-24 rounded-lg border border-line" />
                </li>
              ))}
            </ul>
          )}
          <p className="rounded-lg bg-muted/60 p-3 text-sm">The owner reviews your request and sends a quotation with the cost and date. Nothing is charged until you accept.</p>
          <FormError message={error} />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setStep("form")}>
              Edit
            </Button>
            <SubmitButton onClick={submit} disabled={Boolean(user && (!user.emailVerified || user.role !== "customer"))} label={user ? "Send request" : "Log in to send"} />
          </div>
          {user?.role === "owner" && <p className="text-sm text-danger">Owner accounts can&apos;t submit requests. Switch to a customer in the Demo bar.</p>}
        </div>
      )}
    </div>
  );
}

function SubmitButton({ onClick, disabled, label }: { onClick: () => Promise<void>; disabled?: boolean; label: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="lg"
      disabled={busy || disabled}
      onClick={async () => {
        setBusy(true);
        await onClick();
        setBusy(false);
      }}
    >
      {busy && <Spinner />} {label}
    </Button>
  );
}

export default function ServiceRequestPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Suspense fallback={<LoadingState rows={4} />}>
        <RequestLoader />
      </Suspense>
    </div>
  );
}

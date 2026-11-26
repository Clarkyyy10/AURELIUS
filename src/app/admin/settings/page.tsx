"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/shared/Field";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryView, Spinner } from "@/components/shared/States";
import { repos } from "@/lib/data";
import { errorMessage, useQuery } from "@/lib/data/hooks";
import { settingsSchema } from "@/lib/validation/schemas";
import type { StoreSettings } from "@/types";
import type { z } from "zod";

/** FR-46 — store information and payment instructions. */
export default function SettingsPage() {
  const q = useQuery("settings", () => repos.settings.get());
  return (
    <>
      <PageHeader title="Settings" description="Store details shown to customers in the footer, payment pages, and the assistant." />
      <QueryView query={q}>{(s) => <SettingsForm key={JSON.stringify(s)} settings={s} />}</QueryView>
      <p className="mt-6 text-sm text-muted-foreground">Password change and session settings for the owner account come with the real login in Phase 2.</p>
    </>
  );
}

function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.input<typeof settingsSchema>>({ resolver: zodResolver(settingsSchema), defaultValues: settings });
  const { errors } = form.formState;
  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await repos.settings.save(settingsSchema.parse(values));
      toast.success("Settings saved.");
    } catch (e) {
      setError(errorMessage(e));
    }
  });
  return (
    <form onSubmit={onSubmit} noValidate className="max-w-3xl space-y-6">
      <FormError message={error} />
      <section className="space-y-4 rounded-lg border border-line bg-paper p-6">
        <h2 className="text-2xl">Store information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Store name" error={errors.storeName?.message}>
            <Input {...form.register("storeName")} />
          </Field>
          <Field label="Contact number" error={errors.contactNumber?.message}>
            <Input type="tel" {...form.register("contactNumber")} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...form.register("email")} />
          </Field>
          <Field label="Address" error={errors.address?.message}>
            <Input {...form.register("address")} />
          </Field>
        </div>
        <Field label="Opening hours" error={errors.openingHours?.message}>
          <Textarea rows={2} {...form.register("openingHours")} />
        </Field>
      </section>
      <section className="space-y-4 rounded-lg border border-line bg-paper p-6">
        <h2 className="text-2xl">Payments and claiming</h2>
        <Field
          label="Payment instructions"
          error={errors.paymentInstructions?.message}
          hint="Shown above the payment form: GCash name and number, bank details, and what to upload."
        >
          <Textarea rows={5} {...form.register("paymentInstructions")} />
        </Field>
        <Field label="Claiming note" error={errors.claimingNote?.message}>
          <Input {...form.register("claimingNote")} />
        </Field>
      </section>
      <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
        {form.formState.isSubmitting && <Spinner />} Save settings
      </Button>
    </form>
  );
}

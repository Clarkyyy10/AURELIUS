"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/shared/Field";
import { PageHeader } from "@/components/shared/PageHeader";
import { Spinner } from "@/components/shared/States";
import { DateText } from "@/components/shared/Text";
import { repos } from "@/lib/data";
import { errorMessage, useCurrentUser } from "@/lib/data/hooks";
import { changePasswordSchema, profileSchema } from "@/lib/validation/schemas";
import type { UserProfile } from "@/types";
import type { z } from "zod";

/** FR-44 — edit name and contact number, change password. */
export default function ProfilePage() {
  const { user } = useCurrentUser();
  if (!user) return null;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Profile"
        back={{ href: "/account", label: "Back to my account" }}
        description="Keep your details up to date so the store can contact you."
      />
      <ProfileForm user={user} />
      <PasswordForm />
      <p className="text-sm text-muted-foreground">
        You agreed to the Privacy Notice on {user.privacyConsentAt ? <DateText value={user.privacyConsentAt} withTime /> : "—"}. To get a copy of your data or
        delete your account, contact the store.
      </p>
    </div>
  );
}

function ProfileForm({ user }: { user: UserProfile }) {
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.input<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user.fullName, contactNumber: user.contactNumber },
  });
  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const v = profileSchema.parse(values);
      await repos.auth.updateProfile(v);
      form.reset(v);
      toast.success("Your details were saved.");
    } catch (e) {
      setError(errorMessage(e));
    }
  });
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-2xl border border-line bg-paper p-6">
      <h2 className="text-2xl">Your details</h2>
      <FormError message={error} />
      <Field label="Full name" error={form.formState.errors.fullName?.message}>
        <Input autoComplete="name" {...form.register("fullName")} />
      </Field>
      <Field label="Mobile number" error={form.formState.errors.contactNumber?.message}>
        <Input type="tel" autoComplete="tel" {...form.register("contactNumber")} />
      </Field>
      <Field label="Email address" hint="Changing your email isn't available in the demo. Contact the store if you need to change it.">
        <Input type="email" value={user.email} readOnly disabled />
      </Field>
      <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
        {form.formState.isSubmitting && <Spinner />} Save changes
      </Button>
    </form>
  );
}

function PasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.input<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const onSubmit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      await repos.auth.changePassword(v.currentPassword, v.newPassword);
      form.reset();
      toast.success("Your password was changed.");
    } catch (e) {
      setError(errorMessage(e));
    }
  });
  const { errors } = form.formState;
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-2xl border border-line bg-paper p-6">
      <h2 className="text-2xl">Change password</h2>
      <FormError message={error} />
      <Field label="Current password" error={errors.currentPassword?.message}>
        <Input type="password" autoComplete="current-password" {...form.register("currentPassword")} />
      </Field>
      <Field label="New password" hint="At least 8 characters. A mix of letters, numbers, and symbols is stronger." error={errors.newPassword?.message}>
        <Input type="password" autoComplete="new-password" {...form.register("newPassword")} />
      </Field>
      <Field label="Confirm new password" error={errors.confirmPassword?.message}>
        <Input type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
      </Field>
      <Button type="submit" variant="outline" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Spinner />} Change password
      </Button>
    </form>
  );
}

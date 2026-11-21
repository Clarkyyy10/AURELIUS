"use client";

import { NotificationList } from "@/components/shared/Notifications";
import { PageHeader } from "@/components/shared/PageHeader";
import { useCurrentUser } from "@/lib/data/hooks";

/** FR-50 — all owner notifications. */
export default function OwnerNotificationsPage() {
  const { user } = useCurrentUser();
  if (!user) return null;
  return (
    <>
      <PageHeader title="Notifications" description="New orders, custom requests, service requests, payments, and cancellations." />
      <NotificationList user={user} />
    </>
  );
}

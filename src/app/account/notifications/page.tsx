"use client";

import { NotificationList } from "@/components/shared/Notifications";
import { PageHeader } from "@/components/shared/PageHeader";
import { useCurrentUser } from "@/lib/data/hooks";

/** FR-49 — all notifications for the signed-in customer. */
export default function NotificationsPage() {
  const { user } = useCurrentUser();
  if (!user) return null;
  return (
    <div>
      <PageHeader title="Notifications" back={{ href: "/account", label: "Back to my account" }} description="Updates about your orders, designs, and service requests. Important ones are also sent by email." />
      <NotificationList user={user} />
    </div>
  );
}

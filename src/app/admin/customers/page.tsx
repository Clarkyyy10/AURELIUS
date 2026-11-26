"use client";

import { CheckCircle2, MailWarning } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryView } from "@/components/shared/States";
import { DateText, MoneyText } from "@/components/shared/Text";
import { repos } from "@/lib/data";
import { useQuery } from "@/lib/data/hooks";

/** FR-48 — customer list. */
export default function CustomersPage() {
  const q = useQuery("customers", () => repos.customers.list());
  return (
    <>
      <PageHeader title="Customers" description="Everyone who registered, with their transactions and open balances." />
      <QueryView query={q}>
        {(rows) => (
          <DataTable
            rows={rows}
            rowKey={(c) => c.id}
            rowHref={(c) => `/admin/customers/${c.id}`}
            searchText={(c) => `${c.fullName} ${c.email} ${c.contactNumber}`}
            searchPlaceholder="Search by name, email, or number"
            empty={{ title: "No customers yet" }}
            initialSort={{ key: "registered", dir: "desc" }}
            columns={[
              { key: "name", header: "Name", primary: true, cell: (c) => <span className="font-medium">{c.fullName}</span>, sortValue: (c) => c.fullName },
              { key: "email", header: "Email", cell: (c) => <span className="break-all">{c.email}</span> },
              { key: "contact", header: "Contact", cell: (c) => c.contactNumber },
              {
                key: "verified",
                header: "Email verified",
                cell: (c) =>
                  c.emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-success">
                      <CheckCircle2 className="size-4" aria-hidden /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-warning">
                      <MailWarning className="size-4" aria-hidden /> Not yet
                    </span>
                  ),
              },
              { key: "registered", header: "Registered", cell: (c) => <DateText value={c.createdAt} />, sortValue: (c) => c.createdAt },
              { key: "count", header: "Transactions", cell: (c) => c.transactionCount, sortValue: (c) => c.transactionCount },
              { key: "balance", header: "Open balance", cell: (c) => <MoneyText value={c.openBalance} exact />, sortValue: (c) => c.openBalance },
            ]}
          />
        )}
      </QueryView>
    </>
  );
}

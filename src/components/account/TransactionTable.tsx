"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DateText, MoneyText } from "@/components/shared/Text";
import { allStatuses, statusLabel } from "@/lib/status/machines";
import { detailHref, txAmount, txTitle } from "@/lib/transactions/helpers";
import type { Role, Transaction, TransactionKind, UserProfile } from "@/types";

/** List of orders / custom requests / service requests with a status filter. Used by customer and owner pages. */
export function TransactionTable({
  rows,
  kind,
  role,
  serviceNames,
  customers,
  empty,
  initialStatus,
  extraToolbar,
}: {
  rows: Transaction[];
  kind?: TransactionKind;
  role: Role;
  serviceNames: Record<string, string>;
  customers?: Record<string, UserProfile>;
  empty: { title: string; description?: string };
  initialStatus?: string;
  extraToolbar?: React.ReactNode;
}) {
  const [status, setStatus] = useState(initialStatus ?? "all");
  const statuses = useMemo(() => (kind ? allStatuses(kind) : [...new Set(rows.map((r) => r.status))]), [kind, rows]);
  const filtered = status === "all" ? rows : status === "__open" ? rows.filter((r) => !["completed", "claimed", "cancelled", "declined", "rejected"].includes(r.status)) : rows.filter((r) => r.status === status);

  const columns: Column<Transaction>[] = [
    { key: "code", header: "Code", primary: true, cell: (t) => <span className="font-mono text-sm">{t.code}</span>, sortValue: (t) => t.code },
    ...(customers ? [{ key: "customer", header: "Customer", cell: (t: Transaction) => customers[t.customerId]?.fullName ?? "—", sortValue: (t: Transaction) => customers[t.customerId]?.fullName ?? "" }] : []),
    { key: "item", header: "Item", cell: (t) => <span className="line-clamp-2">{txTitle(t, serviceNames)}</span> },
    { key: "date", header: "Date", cell: (t) => <DateText value={t.createdAt} />, sortValue: (t) => t.createdAt },
    { key: "status", header: "Status", primary: true, cell: (t) => <StatusBadge status={t.status} />, sortValue: (t) => statusLabel(t.status) },
    {
      key: "amount",
      header: "Amount",
      className: "text-right",
      cell: (t) => {
        const a = txAmount(t);
        return a ? (
          <span className="whitespace-nowrap">
            <span className="text-xs text-muted-foreground">{a.label} </span>
            <MoneyText value={a.value} exact />
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
      sortValue: (t) => txAmount(t)?.value ?? 0,
    },
  ];

  return (
    <DataTable
      rows={filtered}
      columns={columns}
      rowKey={(t) => t.id}
      rowHref={(t) => detailHref(t.kind, t.id, role)}
      searchText={(t) => `${t.code} ${txTitle(t, serviceNames)} ${customers?.[t.customerId]?.fullName ?? ""}`}
      searchPlaceholder={role === "owner" ? "Search by code, item, or customer" : "Search by code or item"}
      empty={empty}
      initialSort={{ key: "date", dir: "desc" }}
      toolbar={
        <>
          <div className="flex items-center gap-2">
            <Label htmlFor={`status-${kind ?? "all"}`} className="text-sm whitespace-nowrap">
              Status
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id={`status-${kind ?? "all"}`} className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="__open">Open (not finished)</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {extraToolbar}
        </>
      }
    />
  );
}

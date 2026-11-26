"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryView } from "@/components/shared/States";
import { AvailabilityBadge } from "@/components/shared/StatusBadge";
import { StoredImage } from "@/components/shared/StoredImage";
import { MoneyText } from "@/components/shared/Text";
import { repos } from "@/lib/data";
import { errorMessage, useQuery } from "@/lib/data/hooks";
import type { Product } from "@/types";

/** FR-24 — add, edit, hide, and remove products. */
export default function ProductsPage() {
  const router = useRouter();
  const q = useQuery("owner:products", () => repos.catalog.listProducts({ includeHidden: true }));

  const toggleHidden = async (p: Product) => {
    try {
      const { id, createdAt, updatedAt, ...rest } = p;
      void createdAt;
      void updatedAt;
      await repos.catalog.saveProduct({ ...rest, id, hidden: !p.hidden });
      toast.success(p.hidden ? `${p.name} is visible in the shop again.` : `${p.name} is now hidden from the shop.`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const columns: Column<Product>[] = [
    { key: "photo", header: "Photo", cell: (p) => <StoredImage src={p.photos[0]} alt="" className="size-12 rounded-lg border border-line" /> },
    { key: "name", header: "Name", primary: true, cell: (p) => <span className="font-medium">{p.name}</span>, sortValue: (p) => p.name },
    { key: "category", header: "Category", cell: (p) => <span className="capitalize">{p.category}</span>, sortValue: (p) => p.category },
    { key: "material", header: "Material", cell: (p) => p.material },
    { key: "price", header: "Price", cell: (p) => <MoneyText value={p.price} />, sortValue: (p) => p.price },
    { key: "availability", header: "Availability", cell: (p) => <AvailabilityBadge value={p.availability} /> },
    { key: "visibility", header: "Visibility", cell: (p) => (p.hidden ? <span className="text-muted-foreground">Hidden</span> : "Shown") },
    {
      key: "actions",
      header: "Actions",
      cell: (p) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button asChild variant="ghost" size="icon-sm" aria-label={`Edit ${p.name}`}>
            <Link href={`/admin/products/${p.id}`}>
              <Pencil />
            </Link>
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => void toggleHidden(p)} aria-label={p.hidden ? `Show ${p.name}` : `Hide ${p.name}`}>
            {p.hidden ? <Eye /> : <EyeOff />}
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="icon-sm" className="text-danger" aria-label={`Remove ${p.name}`}>
                <Trash2 />
              </Button>
            }
            title={`Remove ${p.name}?`}
            description="This deletes the product from the shop. If customers have ordered it, you'll be asked to hide it instead."
            confirmLabel="Remove product"
            destructive
            onConfirm={async () => {
              try {
                const r = await repos.catalog.removeProduct(p.id);
                if (!r.removed) {
                  toast.warning(r.reason ?? "This product can't be removed.", {
                    action: p.hidden ? undefined : { label: "Hide instead", onClick: () => void toggleHidden(p) },
                  });
                } else toast.success(`${p.name} was removed.`);
              } catch (e) {
                toast.error(errorMessage(e));
                return false;
              }
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Products"
        description="What customers see in the shop."
        actions={
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="size-4" /> Add product
            </Link>
          </Button>
        }
      />
      <QueryView query={q}>
        {(rows) => (
          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(p) => p.id}
            onRowClick={(p) => router.push(`/admin/products/${p.id}`)}
            searchText={(p) => `${p.name} ${p.material} ${p.category}`}
            searchPlaceholder="Search products"
            empty={{ title: "No products yet", description: "Add your first product." }}
          />
        )}
      </QueryView>
    </>
  );
}

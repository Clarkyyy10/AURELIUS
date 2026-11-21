"use client";

import { useParams } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState, LoadingState } from "@/components/shared/States";
import { repos } from "@/lib/data";
import { useQuery } from "@/lib/data/hooks";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const q = useQuery(`owner:product:${id}`, () => repos.catalog.getProduct(id));
  if (q.error) return <ErrorState message={q.error} onRetry={q.reload} />;
  if (q.loading) return <LoadingState />;
  if (!q.data) return <ErrorState message="We couldn't find that product. It may have been removed." />;
  return (
    <>
      <PageHeader title={`Edit ${q.data.name}`} back={{ href: "/admin/products", label: "Back to products" }} />
      <ProductForm key={q.data.id} product={q.data} />
    </>
  );
}

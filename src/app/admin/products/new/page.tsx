"use client";

import { ProductForm } from "@/components/admin/ProductForm";
import { PageHeader } from "@/components/shared/PageHeader";

export default function NewProductPage() {
  return (
    <>
      <PageHeader title="Add a product" back={{ href: "/admin/products", label: "Back to products" }} />
      <ProductForm />
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/shared/Field";
import { FileDropzone, type StoredFile } from "@/components/shared/FileDropzone";
import { Spinner } from "@/components/shared/States";
import { StoredImage } from "@/components/shared/StoredImage";
import { repos } from "@/lib/data";
import { errorMessage, useQuery } from "@/lib/data/hooks";
import { productDesign } from "@/lib/pricing/labels";
import { normalizeConfig } from "@/lib/pricing/normalize";
import { LazyJewelryViewer } from "@/components/customization/LazyViewer";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/utils/format";
import { PHOTO_TYPES, productSchema, type ProductInput } from "@/lib/validation/schemas";
import { PRODUCT_TYPES, type CustomizationOptions, type DesignConfig, type Product } from "@/types";

const CATEGORY: Record<string, string> = { ring: "Ring", pendant: "Pendant", name_pendant: "Name pendant", necklace: "Necklace", bracelet: "Bracelet", earrings: "Earrings" };

/** FR-24 — add or edit a product. */
export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? { name: product.name, slug: product.slug, category: product.category, material: product.material, price: product.price, description: product.description, availability: product.availability, hidden: product.hidden, photos: product.photos }
      : { name: "", slug: "", category: "ring", material: "", price: 0, description: "", availability: "available", hidden: false, photos: [] },
  });
  const { errors } = form.formState;
  const optionsQ = useQuery("options:active", () => repos.customization.getOptions());
  const category = useWatch({ control: form.control, name: "category" });
  const material = useWatch({ control: form.control, name: "material" });
  const [appearanceEdit, setAppearance] = useState<Partial<DesignConfig> | null>(null);
  // The 3D look follows the category; it starts from the saved design (or the material name).
  const appearance = optionsQ.data
    ? normalizeConfig(
        { ...productDesign({ ...(product ?? ({} as Product)), category: category ?? "ring", material: material ?? "", design: product?.design }, optionsQ.data), ...appearanceEdit, productType: category ?? "ring" },
        optionsQ.data,
      ).config
    : null;

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const v = productSchema.parse(values);
      const { productType: _t, ...design } = appearance ?? {};
      void _t;
      await repos.catalog.saveProduct({ ...v, id: product?.id, design: appearance ? design : product?.design });
      toast.success(product ? "Product saved." : "Product added to the shop.");
      router.push("/admin/products");
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-2xl border border-line bg-paper p-5 sm:p-6">
      <FormError message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product name" error={errors.name?.message}>
          <Input
            {...form.register("name", {
              onChange: (e) => {
                if (!slugTouched) form.setValue("slug", slugify(e.target.value));
              },
            })}
          />
        </Field>
        <Field label="Web address name (slug)" error={errors.slug?.message} hint="Used in the product link, e.g. /shop/classic-solitaire-ring">
          <Input {...form.register("slug", { onChange: () => setSlugTouched(true) })} />
        </Field>
        <Field label="Category" error={errors.category?.message}>
          <Controller
            control={form.control}
            name="category"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {CATEGORY[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label="Material" error={errors.material?.message}>
          <Input {...form.register("material")} placeholder="For example: 18K Gold" />
        </Field>
        <Field label="Price (₱)" error={errors.price?.message}>
          <Input type="number" min={0} step="1" {...form.register("price", { valueAsNumber: true })} />
        </Field>
        <Field label="Availability" error={errors.availability?.message}>
          <Controller
            control={form.control}
            name="availability"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="made_to_order">Made to order</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>
      <Field label="Description" error={errors.description?.message}>
        <Textarea rows={4} {...form.register("description")} />
      </Field>

      {appearance && optionsQ.data && <AppearanceEditor config={appearance} options={optionsQ.data} onChange={(p) => setAppearance({ ...appearanceEdit, ...p })} />}

      <Controller
        control={form.control}
        name="photos"
        render={({ field }) => <PhotoManager value={field.value ?? []} onChange={field.onChange} error={errors.photos?.message} />}
      />

      <Controller
        control={form.control}
        name="hidden"
        render={({ field }) => (
          <label className="flex items-center gap-3 rounded-xl border border-line p-3">
            <Switch checked={field.value} onCheckedChange={field.onChange} />
            <span>
              <span className="block font-medium">Hide from the shop</span>
              <span className="block text-sm text-muted-foreground">Hidden products aren&apos;t shown to customers. Existing orders are not affected.</span>
            </span>
          </label>
        )}
      />

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner />} {product ? "Save changes" : "Add product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Up to 5 photos: upload, reorder, remove (stored in the browser in Phase 1). */
function PhotoManager({ value, onChange, error }: { value: string[]; onChange: (v: string[]) => void; error?: string }) {
  const [pending, setPending] = useState<StoredFile[]>([]);
  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Photos ({value.length} of 5) — the first photo is the main one</p>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {value.map((p, i) => (
            <li key={p} className="w-28">
              <StoredImage src={p} alt={`Photo ${i + 1}`} className="aspect-square w-28 rounded-lg border border-line" />
              <div className="mt-1 flex justify-between">
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move photo ${i + 1} left`}>
                  <ChevronLeft />
                </Button>
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove photo ${i + 1}`}>
                  <X />
                </Button>
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label={`Move photo ${i + 1} right`}>
                  <ChevronRight />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {value.length < 5 && (
        <FileDropzone
          label="Add photos"
          accept={PHOTO_TYPES}
          max={5 - value.length}
          value={pending}
          onChange={(files) => {
            onChange([...value, ...files.map((f) => f.dataUrl)].slice(0, 5));
            setPending([]);
          }}
          error={error}
        />
      )}
    </div>
  );
}

/** How the product is drawn in 3D in the shop (metal, finish, stones). Piece type comes from the category. */
function AppearanceEditor({ config, options, onChange }: { config: DesignConfig; options: CustomizationOptions; onChange: (p: Partial<DesignConfig>) => void }) {
  const material = options.materials.find((m) => m.id === config.materialId);
  const pt = options.productTypes.find((p) => p.type === config.productType);
  const gem = options.gemstones.find((g) => g.id === config.gemstoneId);
  const hasStone = Boolean(gem && !gem.isNone);
  const pick = (label: string, value: string, items: { id: string; label: string }[], set: (v: string) => void) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={set}>
        <SelectTrigger className="w-full" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((i) => (
            <SelectItem key={i.id} value={i.id}>
              {i.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  return (
    <fieldset className="space-y-3 rounded-xl border border-line p-4">
      <legend className="px-1 text-sm font-medium">3D appearance in the shop</legend>
      <div className="grid gap-4 md:grid-cols-[1fr_16rem]">
        <div className="grid content-start gap-3 sm:grid-cols-2">
          {pick("Metal", config.materialId, options.materials, (v) => onChange({ materialId: v }))}
          {pick("Color / finish", config.finishId, options.finishes.filter((f) => material?.finishIds.includes(f.id)), (v) => onChange({ finishId: v }))}
          {(pt?.maxStones ?? 0) > 0 && pick("Gemstone", config.gemstoneId, options.gemstones, (v) => onChange({ gemstoneId: v }))}
          {hasStone && pick("Cut", config.cutId ?? "", options.cuts, (v) => onChange({ cutId: v }))}
          {hasStone &&
            pick(
              "Number of stones",
              String(config.stoneQuantity),
              Array.from({ length: pt?.maxStones ?? 1 }, (_, i) => ({ id: String(i + 1), label: String(i + 1) })),
              (v) => onChange({ stoneQuantity: Number(v) }),
            )}
          <p className="text-xs text-muted-foreground sm:col-span-2">Customers can rotate and zoom this model on the shop page. It doesn&apos;t change the price you set above.</p>
        </div>
        <LazyJewelryViewer config={config} options={options} showControls={false} className="aspect-square w-full" label="3D preview of this product" />
      </div>
    </fieldset>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Minus, Plus, Rotate3d, Sparkles, Store } from "lucide-react";
import { LazyJewelryViewer } from "@/components/customization/LazyViewer";
import { productDesign } from "@/lib/pricing/labels";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VerifyEmailBanner } from "@/components/layout/Guards";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ErrorState, LoadingState } from "@/components/shared/States";
import { AvailabilityBadge } from "@/components/shared/StatusBadge";
import { StoredImage } from "@/components/shared/StoredImage";
import { MoneyText } from "@/components/shared/Text";
import { repos } from "@/lib/data";
import { errorMessage, newRequestId, useCurrentUser, useQuery } from "@/lib/data/hooks";
import type { Product, UserProfile } from "@/types";

/** FR-12 to FR-14 and FR-07 (made-to-order creates a custom order request). */
export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const q = useQuery(`product-slug:${slug}`, () => repos.catalog.getProductBySlug(slug));
  if (q.error) return <ErrorState className="m-6" message={q.error} onRetry={q.reload} />;
  if (q.loading) return <LoadingState className="mx-auto max-w-6xl p-6" />;
  if (!q.data)
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-3xl">This product isn&apos;t in the shop</h1>
        <p className="mt-2 text-muted-foreground">It may have been removed or hidden. Browse the rest of the collection.</p>
        <Button asChild className="mt-6">
          <Link href="/shop">Back to the shop</Link>
        </Button>
      </div>
    );
  return <ProductDetail product={q.data} />;
}

function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [photo, setPhoto] = useState(-1); // -1 = the 3D model
  const optionsQ = useQuery("options:active", () => repos.customization.getOptions());
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [requestId, setRequestId] = useState(newRequestId);

  /** Guests go to login; owners and unverified customers get a clear message. Returns true when allowed. */
  const guard = (u: UserProfile | null): u is UserProfile => {
    if (!u) {
      router.push(`/login?next=${encodeURIComponent(`/shop/${product.slug}`)}`);
      return false;
    }
    if (u.role !== "customer") {
      toast.error("Owner accounts can't place orders. Switch to a customer in the Demo bar.");
      return false;
    }
    if (!u.emailVerified) {
      toast.error("Please verify your email address before ordering.");
      return false;
    }
    return true;
  };

  const placeOrder = async () => {
    try {
      const tx = await repos.orders.place({ productId: product.id, quantity, notes: notes.trim() || undefined, clientRequestId: requestId });
      setRequestId(newRequestId());
      router.push(`/shop/order-placed?id=${tx.id}`);
    } catch (e) {
      toast.error(errorMessage(e));
      return false;
    }
  };

  const requestPiece = async () => {
    try {
      const options = await repos.customization.getOptions();
      const config = { ...productDesign(product, options), notes: `Requesting “${product.name}” as shown in the shop.${notes.trim() ? ` ${notes.trim()}` : ""}` };
      const tx = await repos.customOrders.submit({ config, source: "catalog", basedOnProductId: product.id, snapshotDataUrl: product.photos[0], clientRequestId: requestId });
      setRequestId(newRequestId());
      router.push(`/customize/submitted?id=${tx.id}`);
    } catch (e) {
      toast.error(errorMessage(e));
      return false;
    }
  };

  const orderButton = (label: string, onConfirm: () => Promise<unknown>, description: React.ReactNode) =>
    user && user.role === "customer" && user.emailVerified ? (
      <ConfirmDialog trigger={<Button size="lg" className="w-full sm:w-auto">{label}</Button>} title={`${label}?`} description={description} confirmLabel={label} onConfirm={onConfirm} />
    ) : (
      <Button size="lg" className="w-full sm:w-auto" onClick={() => guard(user)}>
        {label}
      </Button>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/shop" className="mb-4 inline-flex min-h-8 items-center gap-1 text-sm text-gold-dark hover:underline">
        <ChevronLeft className="size-4" aria-hidden /> Back to the shop
      </Link>
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          {photo === -1 && optionsQ.data ? (
            <LazyJewelryViewer
              config={productDesign(product, optionsQ.data)}
              options={optionsQ.data}
              className="aspect-square w-full border border-line"
              label={`3D model of ${product.name}. Drag to rotate, scroll or pinch to zoom.`}
            />
          ) : (
            <StoredImage src={product.photos[Math.max(0, photo)]} alt={product.name} className="aspect-square w-full rounded-2xl border border-line" />
          )}
          {(product.photos.length > 0 || optionsQ.data) && (
            <div className="mt-3 flex gap-2">
              {optionsQ.data && (
                <button
                  type="button"
                  onClick={() => setPhoto(-1)}
                  aria-label="Show the 3D model"
                  aria-pressed={photo === -1}
                  className={`flex size-[68px] flex-col items-center justify-center rounded-lg border-2 bg-paper text-xs font-semibold text-gold-dark ${photo === -1 ? "border-gold-dark" : "border-line"}`}
                >
                  <Rotate3d className="size-5" aria-hidden /> 3D
                </button>
              )}
              {product.photos.map((p, i) => (
                <button key={p} type="button" onClick={() => setPhoto(i)} aria-label={`Show photo ${i + 1}`} aria-pressed={i === photo} className={`overflow-hidden rounded-lg border-2 ${i === photo ? "border-gold-dark" : "border-transparent"}`}>
                  <StoredImage src={p} alt="" className="size-16" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <AvailabilityBadge value={product.availability} />
            <h1 className="mt-2 text-4xl">{product.name}</h1>
            <p className="mt-1 text-muted-foreground">
              {product.material} · {product.category === "name_pendant" ? "Name pendant" : <span className="capitalize">{product.category}</span>}
            </p>
            <p className="mt-3 font-heading text-3xl font-semibold">
              <MoneyText value={product.price} />
            </p>
          </div>
          <p className="text-ink/85">{product.description}</p>

          {user && <VerifyEmailBanner user={user} action="order" />}

          {product.availability === "unavailable" ? (
            <div className="rounded-xl border border-line bg-muted/50 p-4">
              <p className="font-medium">This item is currently unavailable.</p>
              <Link href={`/customize?type=${product.category}&from=${product.id}`} className="mt-1 inline-flex items-center gap-1 text-gold-dark hover:underline">
                <Sparkles className="size-4" aria-hidden /> Design something similar
              </Link>
              <Button size="lg" className="mt-4 w-full sm:w-auto" disabled>
                Place order
              </Button>
            </div>
          ) : (
            <div className="space-y-4 rounded-2xl border border-line bg-paper p-5">
              {product.availability === "available" && (
                <div>
                  <p className="mb-2 text-sm font-medium" id="qty">
                    Quantity
                  </p>
                  <div className="inline-flex items-center gap-2" role="group" aria-labelledby="qty">
                    <Button variant="outline" size="icon" onClick={() => setQuantity((n) => Math.max(1, n - 1))} disabled={quantity <= 1} aria-label="Decrease quantity">
                      <Minus className="size-4" />
                    </Button>
                    <span className="tabular w-8 text-center text-lg font-semibold" aria-live="polite">
                      {quantity}
                    </span>
                    <Button variant="outline" size="icon" onClick={() => setQuantity((n) => Math.min(5, n + 1))} disabled={quantity >= 5} aria-label="Increase quantity">
                      <Plus className="size-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground">1 to 5</span>
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="order-notes">
                  Notes for the owner <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Textarea id="order-notes" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Store className="size-4 text-gold-dark" aria-hidden /> Claim in store at Montalban Public Market. The owner confirms the final price in a quotation.
              </p>
              <div className="flex flex-wrap gap-2">
                {product.availability === "available"
                  ? orderButton(
                      "Place order",
                      placeOrder,
                      <>
                        {quantity} × {product.name} at <MoneyText value={product.price} /> each (<MoneyText value={product.price * quantity} /> total). Claim in store at Montalban Public Market. The owner will send a quotation to confirm.
                      </>,
                    )
                  : orderButton(
                      "Request this piece",
                      requestPiece,
                      <>This piece is made to order. We&apos;ll send your request to the owner, who will confirm the design, final price, and completion date.</>,
                    )}
                {product.availability === "made_to_order" && (
                  <Button asChild variant="outline" size="lg">
                    <Link href={`/customize?type=${product.category}&from=${product.id}`}>
                      <Sparkles className="size-4" /> Customize this design
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

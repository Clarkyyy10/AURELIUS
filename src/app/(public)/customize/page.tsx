"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquareWarning, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VerifyEmailBanner } from "@/components/layout/Guards";
import { EstimateBar } from "@/components/customization/EstimateBar";
import { LazyJewelryViewer, type CaptureFn } from "@/components/customization/LazyViewer";
import { OptionsPanel } from "@/components/customization/OptionsPanel";
import { SubmitDesignDialog } from "@/components/customization/SubmitDesignDialog";
import { ErrorState, LoadingState } from "@/components/shared/States";
import { DateText } from "@/components/shared/Text";
import { repos } from "@/lib/data";
import { errorMessage, newRequestId, setPendingDesign, useCurrentUser, usePendingDesign, useQuery } from "@/lib/data/hooks";
import { EstimateError, estimate as computeEstimate } from "@/lib/pricing/estimate";
import { designLabels, placeholderFor, productDesign } from "@/lib/pricing/labels";
import { normalizeConfig } from "@/lib/pricing/normalize";
import { applyChange } from "@/lib/pricing/design";
import { PRODUCT_TYPES, type CustomizationOptions, type CustomOrderRequest, type DesignConfig, type Draft, type Product, type ProductType } from "@/types";

/** FR-01 to FR-07, FR-10 — the 3D design customizer. */
function CustomizerLoader() {
  const params = useSearchParams();
  const requestId = params.get("request");
  const draftId = params.get("draft");
  const fromId = params.get("from");
  const typeParam = params.get("type") as ProductType | null;

  const optionsQ = useQuery("options:active", () => repos.customization.getOptions());
  const requestQ = useQuery(`co:${requestId}`, async () => (requestId ? repos.customOrders.get(requestId) : null));
  const draftQ = useQuery(`draft:${draftId}`, async () => (draftId ? repos.drafts.get(draftId) : null));
  const productQ = useQuery(`product:${fromId}`, async () => (fromId ? repos.catalog.getProduct(fromId) : null));
  const pending = usePendingDesign();

  const queries = [optionsQ, requestQ, draftQ, productQ];
  const failed = queries.find((q) => q.error);
  if (failed) return <ErrorState className="m-4" message={failed.error!} onRetry={failed.reload} />;
  if (queries.some((q) => q.loading) || !optionsQ.data) return <LoadingState className="mx-auto max-w-6xl p-4" rows={4} label="Loading the customizer…" />;

  const options = optionsQ.data;
  const request = requestQ.data ?? null;
  const draft = draftQ.data?.kind === "custom_order" ? draftQ.data : null;
  const product = productQ.data ?? null;

  let start: Partial<DesignConfig> = {
    productType: PRODUCT_TYPES.includes(typeParam as ProductType) ? (typeParam as ProductType) : (product?.category ?? "ring"),
  };
  if (request) start = request.versions[request.versions.length - 1].config;
  else if (draft) start = { ...start, ...draft.config, notes: draft.notes ?? draft.config.notes };
  // A design a guest started before logging in is restored (frontend-spec §5.4).
  else if (pending && !typeParam && (pending.fromProductId ?? null) === (fromId ?? null)) {
    const { fromProductId: _from, ...saved } = pending;
    void _from;
    start = saved;
  } else if (product) start = productDesign(product, options);

  const key = `${requestId}|${draftId}|${fromId}|${typeParam}`;
  return (
    <Customizer
      key={key}
      options={options}
      initial={normalizeConfig(start, options).config}
      request={requestId ? request : undefined}
      draft={draft}
      product={product}
      fromProductId={fromId ?? undefined}
    />
  );
}

function Customizer({
  options,
  initial,
  request,
  draft,
  product,
  fromProductId,
}: {
  options: CustomizationOptions;
  initial: DesignConfig;
  request?: CustomOrderRequest | null;
  draft: Draft | null;
  product: Product | null;
  fromProductId?: string;
}) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [config, setConfig] = useState(initial);
  const [notice, setNotice] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [requestKey, setRequestKey] = useState(newRequestId);
  const captureRef = useRef<CaptureFn | null>(null);

  const revising = Boolean(request);
  const canRevise = request?.status === "revision_requested";

  const { est, estError } = useMemo(() => {
    try {
      return { est: computeEstimate(config, options), estError: null };
    } catch (e) {
      return { est: null, estError: e instanceof EstimateError ? e.message : "We couldn't compute an estimate for this design." };
    }
  }, [config, options]);
  const labels = useMemo(() => designLabels(config, options), [config, options]);

  const change = (patch: Partial<DesignConfig>) => {
    // Related choices follow along (new piece type, new style, a stone on a plain style) — D-25.
    const r = normalizeConfig(applyChange(config, patch, options), options);
    setConfig(r.config);
    setNotice(r.notices[0] ?? null);
  };

  const startSubmit = () => {
    if (!est) return;
    if (!user) {
      setPendingDesign({ ...config, fromProductId });
      setLoginOpen(true);
      return;
    }
    if (user.role === "owner") {
      toast.error("Owner accounts can't submit designs. Switch to a customer in the Demo bar.");
      return;
    }
    if (!user.emailVerified) {
      toast.error("Please verify your email address before submitting your design.");
      return;
    }
    setSnapshot(captureRef.current?.() ?? null);
    setRequestKey(newRequestId());
    setReviewOpen(true);
  };

  const submit = async (): Promise<string | null> => {
    try {
      if (request) {
        await repos.customOrders.resubmit(request.id, { config, snapshotDataUrl: snapshot ?? placeholderFor(config), clientRequestId: requestKey });
        toast.success(`Version ${request.versions.length + 1} sent to the owner for review.`);
        router.push(`/account/custom/${request.id}`);
      } else {
        const tx = await repos.customOrders.submit({
          config,
          snapshotDataUrl: snapshot ?? placeholderFor(config),
          source: draft ? "chatbot" : fromProductId ? "catalog" : "customizer",
          basedOnProductId: fromProductId,
          clientRequestId: requestKey,
        });
        router.push(`/customize/submitted?id=${tx.id}`);
      }
      return null;
    } catch (e) {
      return errorMessage(e);
    }
  };

  const nextParam = encodeURIComponent(`/customize${fromProductId ? `?from=${fromProductId}` : ""}`);
  const submitLabel = revising ? "Resubmit for review" : "Submit for owner review";
  const submitButton = (
    <Button size="lg" onClick={startSubmit} disabled={!est || (revising && !canRevise)}>
      <Send className="size-4" /> {submitLabel}
    </Button>
  );

  return (
    <div className="mx-auto max-w-7xl px-0 pb-28 sm:px-4 lg:pb-8">
      <div className="space-y-3 px-4 pt-6 sm:px-0">
        <h1 className="text-3xl sm:text-4xl">{revising ? `Edit your design · ${request?.code}` : "Design your piece"}</h1>
        {user && <VerifyEmailBanner user={user} action="submit a design" />}
        {request === null && <ErrorState message="We couldn't find that request. It may belong to another account." />}
        {request && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Version {request.versions.length + 1} of your design ·{" "}
              <Link href={`/account/custom/${request.id}#versions`} className="text-gold-dark underline">
                compare with version {request.versions.length}
              </Link>
            </p>
            {request.revisionRemarks.length > 0 && (
              <div className="rounded-xl border border-warning/40 bg-warning/10 p-4" role="note">
                <p className="flex items-center gap-2 font-medium">
                  <MessageSquareWarning className="size-5 text-warning" aria-hidden /> Remarks from the owner
                </p>
                <p className="mt-1">“{request.revisionRemarks[request.revisionRemarks.length - 1].text}”</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sent <DateText value={request.revisionRemarks[request.revisionRemarks.length - 1].at} withTime />
                </p>
              </div>
            )}
            {!canRevise && (
              <p className="rounded-lg bg-muted px-3 py-2 text-sm">This design isn&apos;t waiting for changes right now, so it can&apos;t be resubmitted.</p>
            )}
          </div>
        )}
        {draft && (
          <p className="flex items-start gap-2 rounded-xl border border-info/30 bg-info/10 p-3 text-sm">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-info" aria-hidden /> Your assistant filled this in. Review and change anything before submitting.
          </p>
        )}
        {product && (
          <p className="rounded-xl border border-line bg-paper p-3 text-sm">
            Based on <strong>{product.name}</strong> from our shop. Change anything you like — the owner will use it as a reference.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <LazyJewelryViewer
            config={config}
            options={options}
            captureRef={captureRef}
            className="h-[45vh] min-h-72 w-full rounded-none sm:rounded-2xl lg:h-[calc(100vh-8rem)] lg:max-h-[720px]"
            label={`3D preview: ${labels.finish} ${labels.material} ${labels.productType.toLowerCase()}, ${labels.gemstone}, size ${labels.size}`}
          />
        </div>

        <div className="min-w-0 px-4 sm:px-0">
          {notice && (
            <p className="mb-3 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-sm" role="status">
              {notice}
            </p>
          )}
          <div className="rounded-2xl border border-line bg-paper px-4">
            <OptionsPanel config={config} options={options} onChange={change} disabledTypes={revising} />
          </div>
          <EstimateBar estimate={est} error={estError} className="sticky bottom-4 mt-4 hidden lg:block" action={submitButton} />
        </div>
      </div>

      {/* Mobile: estimate bar fixed to the bottom of the screen */}
      <div className="fixed inset-x-0 bottom-0 z-30 p-2 lg:hidden">
        <EstimateBar estimate={est} error={estError} action={<div className="w-full">{submitButton}</div>} className="[&_button[aria-expanded]]:hidden" />
      </div>

      {est && (
        <SubmitDesignDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          snapshot={snapshot}
          labels={labels}
          config={config}
          estimate={est}
          title={revising ? "Resubmit your design" : "Review your design"}
          submitLabel={submitLabel}
          onSubmit={submit}
        />
      )}

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Log in to submit your design</DialogTitle>
            <DialogDescription>We saved your design on this device. Log in or create an account, and you&apos;ll come right back to it.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button asChild variant="outline">
              <Link href={`/register?next=${nextParam}`}>Create an account</Link>
            </Button>
            <Button asChild>
              <Link href={`/login?next=${nextParam}`}>Log in</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CustomizePage() {
  return (
    <Suspense fallback={<LoadingState className="mx-auto max-w-6xl p-4" rows={4} />}>
      <CustomizerLoader />
    </Suspense>
  );
}

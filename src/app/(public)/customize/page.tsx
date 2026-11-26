"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquareWarning, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VerifyEmailBanner } from "@/components/layout/Guards";
import { EstimateSummary } from "@/components/customization/EstimateBar";
import { PageIntro, StoreContainer } from "@/components/shared/PageIntro";
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
  const saveDraft = () => {
    // Kept on this device; opening Customize again brings it back (frontend-spec §5.4).
    setPendingDesign({ ...config, fromProductId });
    toast.success("Draft saved on this device. Open Customize again to continue.");
  };

  return (
    <StoreContainer>
      <PageIntro
        title={revising ? `Edit your design · ${request?.code}` : "Customize your piece"}
        lead="Choose the piece, style, metal, stone and size. The piece and the estimate update as you go. The owner confirms the final price."
      />
      <div className="space-y-3">
        {user && <VerifyEmailBanner user={user} action="submit a design" />}
        {request === null && <ErrorState message="We could not find that request. It may belong to another account." />}
        {request && (
          <div className="space-y-2">
            <p className="text-sm text-grey-700">
              Version {request.versions.length + 1} of your design ·{" "}
              <Link href={`/account/custom/${request.id}#versions`} className="text-black underline">
                compare with version {request.versions.length}
              </Link>
            </p>
            {request.revisionRemarks.length > 0 && (
              <div className="border-2 border-black p-4" role="note">
                <p className="flex items-center gap-2 font-semibold">
                  <MessageSquareWarning className="size-5" aria-hidden /> Remarks from the owner
                </p>
                <p className="mt-1">“{request.revisionRemarks[request.revisionRemarks.length - 1].text}”</p>
                <p className="mt-1 text-xs text-grey-700">
                  Sent <DateText value={request.revisionRemarks[request.revisionRemarks.length - 1].at} withTime />
                </p>
              </div>
            )}
            {!canRevise && (
              <p className="border border-grey-500 px-3 py-2 text-sm">This design is not waiting for changes right now, so it cannot be resubmitted.</p>
            )}
          </div>
        )}
        {draft && (
          <p className="flex items-start gap-2 border border-grey-500 p-3 text-sm">
            <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden /> The assistant filled this in. Review and change anything before you submit.
          </p>
        )}
        {product && (
          <p className="border border-grey-500 p-3 text-sm">
            Based on <strong>{product.name}</strong> from the shop. Change anything you like. The owner uses it as a reference.
          </p>
        )}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,670px)_minmax(0,1fr)] lg:gap-12">
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <LazyJewelryViewer
            config={config}
            options={options}
            captureRef={captureRef}
            controlsPlacement="below"
            className="aspect-square w-full lg:aspect-auto lg:h-[min(670px,calc(100vh-15rem))]"
            label={`3D preview: ${labels.finish} ${labels.material} ${labels.productType.toLowerCase()}, ${labels.gemstone}, size ${labels.size}`}
          />
        </div>

        <div className="min-w-0">
          {notice && (
            <p className="mb-6 border border-grey-500 px-3 py-2 text-sm" role="status">
              {notice}
            </p>
          )}
          <OptionsPanel config={config} options={options} onChange={change} disabledTypes={revising} />
          <div className="mt-10">
            <EstimateSummary estimate={est} error={estError} stones={est && est.breakdown.stones > 0 ? config.stoneQuantity : undefined} />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="rounded-none px-6" onClick={startSubmit} disabled={!est || (revising && !canRevise)}>
              {revising ? "Resubmit design" : "Submit design"}
            </Button>
            {!revising && (
              <Button size="lg" variant="outline" className="rounded-none px-6" onClick={saveDraft}>
                Save draft
              </Button>
            )}
          </div>
        </div>
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
            <DialogTitle className="font-heading text-2xl">Sign in to submit your design</DialogTitle>
            <DialogDescription>We saved your design on this device. Sign in or create an account, and you&apos;ll come right back to it.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button asChild variant="outline">
              <Link href={`/register?next=${nextParam}`}>Create an account</Link>
            </Button>
            <Button asChild>
              <Link href={`/login?next=${nextParam}`}>Sign in</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StoreContainer>
  );
}

export default function CustomizePage() {
  return (
    <Suspense fallback={<LoadingState className="mx-auto max-w-6xl p-4" rows={4} />}>
      <CustomizerLoader />
    </Suspense>
  );
}

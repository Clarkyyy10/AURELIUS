"use client";

import { CheckCircle2, FileText, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { repos } from "@/lib/data";
import { errorMessage } from "@/lib/data/hooks";
import { formatDate } from "@/lib/utils/format";
import type { Transaction } from "@/types";
import { toast } from "sonner";
import { ConfirmDialog } from "./ConfirmDialog";
import { DateText, MoneyText } from "./Text";

/** FR-15/16, FR-27/28 — shows the owner's quotation; Accept / Decline when it is waiting for an answer. */
export function QuotationCard({ tx, canRespond }: { tx: Transaction; canRespond: boolean }) {
  const q = tx.quotation;
  if (!q) return null;
  const waiting = canRespond && tx.status === "quoted";
  const isService = tx.kind === "service";

  return (
    <section aria-labelledby="quote-title" className={`rounded-2xl border p-5 ${waiting ? "border-warning/50 bg-warning/5" : "border-line bg-paper"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="quote-title" className="flex items-center gap-2 text-2xl">
          <FileText className="size-5 text-gold-dark" aria-hidden /> {isService ? "Service quotation" : "Quotation"}
        </h2>
        <span className="text-xs text-muted-foreground">
          Issued <DateText value={q.issuedAt} />
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr_auto_1fr]">
        <dt className="text-muted-foreground">{isService ? "Estimated cost" : "Final price"}</dt>
        <dd className="font-heading text-2xl leading-none font-semibold">
          <MoneyText value={q.finalPrice} exact />
        </dd>
        <dt className="text-muted-foreground">Down payment</dt>
        <dd className="font-medium">{q.downPaymentRequired > 0 ? <MoneyText value={q.downPaymentRequired} exact /> : "None required"}</dd>
        <dt className="text-muted-foreground">{isService ? "Ready by" : "Expected completion"}</dt>
        <dd className="font-medium">{formatDate(q.expectedDate)}</dd>
      </dl>
      {q.procedure && (
        <div className="mt-3 text-sm">
          <p className="text-muted-foreground">Proposed procedure</p>
          <p className="whitespace-pre-line">{q.procedure}</p>
        </div>
      )}
      {q.notes && (
        <div className="mt-3 text-sm">
          <p className="text-muted-foreground">Notes from the owner</p>
          <p className="whitespace-pre-line">{q.notes}</p>
        </div>
      )}

      {q.response && (
        <p className={`mt-4 flex items-center gap-2 text-sm font-medium ${q.response.decision === "accepted" ? "text-success" : "text-danger"}`}>
          {q.response.decision === "accepted" ? <CheckCircle2 className="size-4" aria-hidden /> : <XCircle className="size-4" aria-hidden />}
          You {q.response.decision} this quotation on {formatDate(q.response.at)}
          {q.response.reason ? ` — “${q.response.reason}”` : "."}
        </p>
      )}

      {waiting && (
        <div className="mt-5 flex flex-wrap gap-2">
          <ConfirmDialog
            trigger={<Button>Accept quotation</Button>}
            title="Accept this quotation?"
            description={
              <>
                You agree to the {isService ? "estimated cost" : "final price"} of <MoneyText value={q.finalPrice} exact />
                {q.downPaymentRequired > 0 ? (
                  <>
                    {" "}
                    and a down payment of <MoneyText value={q.downPaymentRequired} exact />.
                  </>
                ) : (
                  "."
                )}{" "}
                {isService
                  ? "Bring your item to the store so we can start."
                  : q.downPaymentRequired > 0
                    ? "Next, pay the down payment and upload your receipt."
                    : "Your order will be confirmed."}
              </>
            }
            confirmLabel="Accept"
            onConfirm={async () => {
              try {
                await repos.transactions.respondToQuotation(tx.kind, tx.id, "accepted");
                toast.success("Quotation accepted.");
              } catch (e) {
                toast.error(errorMessage(e));
                return false;
              }
            }}
          />
          <ConfirmDialog
            trigger={<Button variant="outline">Decline</Button>}
            title="Decline this quotation?"
            description="The request will be closed. You can always submit a new one later."
            confirmLabel="Decline quotation"
            destructive
            reason={{ label: "Tell the owner why", placeholder: "For example: the price is above my budget." }}
            onConfirm={async (reason) => {
              try {
                await repos.transactions.respondToQuotation(tx.kind, tx.id, "declined", reason);
                toast.success("Quotation declined.");
              } catch (e) {
                toast.error(errorMessage(e));
                return false;
              }
            }}
          />
        </div>
      )}
    </section>
  );
}

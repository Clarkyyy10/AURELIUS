"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Field, FormError } from "@/components/shared/Field";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, QueryView, Spinner } from "@/components/shared/States";
import { repos } from "@/lib/data";
import { errorMessage, useQuery } from "@/lib/data/hooks";
import { faqSchema } from "@/lib/validation/schemas";
import type { FaqEntry } from "@/types";

/** Chatbot knowledge base (FR-38 content) — used by the mock bot now and to ground the Gemini API in Phase 2. */
export default function ChatbotKnowledgePage() {
  const q = useQuery("owner:faqs", () => repos.knowledge.list({ includeInactive: true }));
  const pq = useQuery("owner:policies", () => repos.knowledge.getPolicies());
  const [editing, setEditing] = useState<FaqEntry | "new" | null>(null);

  return (
    <>
      <PageHeader
        title="Chatbot knowledge"
        description="The assistant answers only from these entries and your store policies. Keep answers short and plain."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus className="size-4" /> Add answer
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <QueryView
          query={q}
          empty={(l) => (l.length === 0 ? <EmptyState title="No answers yet" action={{ label: "Add an answer", onClick: () => setEditing("new") }} /> : null)}
        >
          {(list) => (
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-paper">
              {list.map((f) => (
                <li key={f.id} className={`flex flex-wrap items-start gap-3 p-4 ${f.active ? "" : "bg-muted/50"}`}>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {f.question} {!f.active && <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">Off</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">{f.answer}</p>
                    <p className="mt-1 flex flex-wrap gap-1">
                      {f.keywords.map((k) => (
                        <span key={k} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          {k}
                        </span>
                      ))}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing(f)} aria-label={`Edit “${f.question}”`}>
                      <Pencil />
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon-sm" className="text-danger" aria-label={`Delete “${f.question}”`}>
                          <Trash2 />
                        </Button>
                      }
                      title="Delete this answer?"
                      description={`“${f.question}” will be removed from the assistant's knowledge.`}
                      confirmLabel="Delete answer"
                      destructive
                      onConfirm={async () => {
                        try {
                          await repos.knowledge.remove(f.id);
                          toast.success("Answer deleted.");
                        } catch (e) {
                          toast.error(errorMessage(e));
                          return false;
                        }
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </QueryView>
        {pq.data !== undefined && <PoliciesEditor key={pq.data} initial={pq.data} />}
      </div>
      {editing && <FaqDialog entry={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function PoliciesEditor({ initial }: { initial: string }) {
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  return (
    <section className="h-fit space-y-3 rounded-2xl border border-line bg-paper p-5" aria-labelledby="policies">
      <h2 id="policies" className="text-2xl">
        Store policies
      </h2>
      <p className="text-sm text-muted-foreground">General rules the assistant must follow, for example about estimates, down payments, and claiming.</p>
      <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} aria-label="Store policies" />
      <Button
        disabled={busy || text === initial || text.trim().length < 10}
        onClick={async () => {
          setBusy(true);
          try {
            await repos.knowledge.savePolicies(text.trim());
            toast.success("Policies saved.");
          } catch (e) {
            toast.error(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy && <Spinner />} Save policies
      </Button>
    </section>
  );
}

function FaqDialog({ entry, onClose }: { entry: FaqEntry | null; onClose: () => void }) {
  const [question, setQuestion] = useState(entry?.question ?? "");
  const [answer, setAnswer] = useState(entry?.answer ?? "");
  const [keywords, setKeywords] = useState(entry?.keywords.join(", ") ?? "");
  const [active, setActive] = useState(entry?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const r = faqSchema.safeParse({
      question,
      answer,
      keywords: keywords
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean),
      active,
    });
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setBusy(true);
    try {
      await repos.knowledge.save({ ...r.data, id: entry?.id });
      toast.success("Answer saved.");
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{entry ? "Edit answer" : "Add an answer"}</DialogTitle>
          <DialogDescription>Never include final prices or promised dates — the owner confirms those in quotations.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormError message={error} />
          <Field label="Question" error={errors.question}>
            <Input value={question} onChange={(e) => setQuestion(e.target.value)} />
          </Field>
          <Field label="Answer" error={errors.answer}>
            <Textarea rows={4} value={answer} onChange={(e) => setAnswer(e.target.value)} />
          </Field>
          <Field label="Keywords" error={errors.keywords} hint="Words customers might use, separated by commas. For example: hours, open, close">
            <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} />
          </Field>
          <label className="flex items-center gap-3">
            <Switch checked={active} onCheckedChange={setActive} /> Use this answer
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Spinner />} Save answer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

// FR-36, FR-37 (manuscript V2): the draft is shown as a text summary inside the chat. The customer can
// edit it here and must press "Confirm and send" before anything reaches the owner. The assistant
// never creates or changes a 3D design; the owner sees the specifications in the request.

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileText, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/States";
import { repos } from "@/lib/data";
import { errorMessage, newRequestId, useCurrentUser, useQuery } from "@/lib/data/hooks";
import {
  checkCustomDraft,
  checkServiceDraft,
  editCustomDraft,
  summarizeCustomDraft,
  summarizeServiceDraft,
  type CustomDraft,
  type ServiceDraft,
} from "@/lib/chatbot/drafts";
import type { ChatDraft } from "@/lib/chatbot/types";
import { ZODIAC_SIGNS } from "@/lib/data/seed/designs";
import { optionsFor, stoneRule, styleOf, usesChain } from "@/lib/pricing/design";
import { detailHref } from "@/lib/transactions/helpers";
import { cn } from "@/lib/utils";
import type { CustomizationOptions, DesignConfig, ServiceCatalogItem } from "@/types";

export interface SentInfo {
  code: string;
  href: string;
}

const fieldClass = "h-9 w-full rounded-md border border-line bg-paper px-2 text-sm focus-visible:outline-2 focus-visible:outline-gold";

function Sel({
  id,
  label,
  value,
  items,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  items: { id: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium">
        {label}
      </label>
      <select id={id} className={fieldClass} value={value} onChange={(e) => onChange(e.target.value)}>
        {items.map((i) => (
          <option key={i.id} value={i.id}>
            {i.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Txt({
  id,
  label,
  value,
  onChange,
  max,
  area,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  area?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium">
        {label}
      </label>
      {area ? (
        <textarea id={id} className={cn(fieldClass, "h-20 py-1.5")} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} className={fieldClass} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} autoComplete="off" />
      )}
    </div>
  );
}

function CustomEditor({
  draft,
  options,
  uid,
  onChange,
}: {
  draft: CustomDraft;
  options: CustomizationOptions;
  uid: string;
  onChange: (patch: Partial<DesignConfig>) => void;
}) {
  const c = checkCustomDraft(draft, options).config;
  const style = styleOf(c, options);
  const rule = stoneRule(c, options);
  const material = options.materials.find((m) => m.id === c.materialId);
  const gem = options.gemstones.find((g) => g.id === c.gemstoneId);
  const hasStone = Boolean(gem && !gem.isNone);
  const pearlOnly = style?.requiresSurface === "pearl";
  const styles = optionsFor(options, c.productType, "style");
  const id = (k: string) => `${uid}-${k}`;
  return (
    <div className="mt-3 grid gap-2">
      {styles.length > 0 && (
        <Sel id={id("style")} label="Style" value={c.choices?.style ?? ""} items={styles} onChange={(v) => onChange({ choices: { ...c.choices, style: v } })} />
      )}
      {c.productType === "name_pendant" && (
        <>
          <Txt id={id("name")} label="Name" value={c.nameText ?? ""} max={10} onChange={(v) => onChange({ nameText: v })} />
          <Sel id={id("font")} label="Font" value={c.fontId ?? ""} items={options.fonts ?? []} onChange={(v) => onChange({ fontId: v })} />
        </>
      )}
      {style?.textMax ? (
        style.key === "zodiac" ? (
          <Sel
            id={id("text")}
            label="Zodiac sign"
            value={c.styleText ?? ""}
            items={ZODIAC_SIGNS.map((z) => ({ id: z, label: z }))}
            onChange={(v) => onChange({ styleText: v })}
          />
        ) : (
          <Txt
            id={id("text")}
            label={`Letters or text (up to ${style.textMax})`}
            value={c.styleText ?? ""}
            max={style.textMax}
            onChange={(v) => onChange({ styleText: v })}
          />
        )
      ) : null}
      <Sel id={id("material")} label="Material" value={c.materialId} items={options.materials} onChange={(v) => onChange({ materialId: v })} />
      <Sel
        id={id("finish")}
        label="Color / finish"
        value={c.finishId}
        items={options.finishes.filter((f) => material?.finishIds.includes(f.id))}
        onChange={(v) => onChange({ finishId: v })}
      />
      {usesChain(c, options) && (
        <>
          <Sel
            id={id("chain")}
            label="Chain style"
            value={c.chainStyleId ?? ""}
            items={options.chainStyles ?? []}
            onChange={(v) => onChange({ chainStyleId: v })}
          />
          <Sel id={id("clasp")} label="Clasp" value={c.claspId ?? ""} items={options.clasps ?? []} onChange={(v) => onChange({ claspId: v })} />
        </>
      )}
      {(rule.max > 0 || styles.length > 0) && c.productType !== "name_pendant" && (
        <Sel
          id={id("gem")}
          label={pearlOnly ? "Pearls" : "Gemstone"}
          value={c.gemstoneId}
          items={options.gemstones.filter((g) => (pearlOnly ? g.surface === "pearl" : !(g.isNone && rule.min > 0)))}
          onChange={(v) => onChange({ gemstoneId: v })}
        />
      )}
      {hasStone && !pearlOnly && <Sel id={id("cut")} label="Cut" value={c.cutId ?? ""} items={options.cuts} onChange={(v) => onChange({ cutId: v })} />}
      {hasStone && rule.max > 1 && Math.max(1, rule.min) < rule.max && (
        <div className="space-y-1">
          <label htmlFor={id("qty")} className="text-xs font-medium">
            Number of stones ({Math.max(1, rule.min)} to {rule.max})
          </label>
          <input
            id={id("qty")}
            type="number"
            className={fieldClass}
            min={Math.max(1, rule.min)}
            max={rule.max}
            value={c.stoneQuantity}
            onChange={(e) => onChange({ stoneQuantity: Number(e.target.value) || 1 })}
          />
        </div>
      )}
      <Sel
        id={id("size")}
        label="Size"
        value={c.sizeId}
        items={options.sizes.filter((s) => s.productType === c.productType).sort((a, b) => a.sortOrder - b.sortOrder)}
        onChange={(v) => onChange({ sizeId: v })}
      />
      <Txt id={id("notes")} label="Notes for the owner" value={draft.notes ?? ""} max={500} area onChange={(v) => onChange({ notes: v })} />
    </div>
  );
}

function ServiceEditor({
  draft,
  services,
  uid,
  onChange,
}: {
  draft: ServiceDraft;
  services: ServiceCatalogItem[];
  uid: string;
  onChange: (d: ServiceDraft) => void;
}) {
  const f = draft.fields;
  const set = (patch: Partial<ServiceDraft["fields"]>) => onChange({ ...draft, fields: { ...f, ...patch } });
  const id = (k: string) => `${uid}-${k}`;
  const list = services.filter((s) => !f.itemType || s.appliesTo.includes(f.itemType));
  return (
    <div className="mt-3 grid gap-2">
      <Sel
        id={id("type")}
        label="Item type"
        value={f.itemType ?? "jewelry"}
        items={[
          { id: "jewelry", label: "Jewelry" },
          { id: "watch", label: "Watch" },
        ]}
        onChange={(v) =>
          set({
            itemType: v as "jewelry" | "watch",
            serviceIds: (f.serviceIds ?? []).filter((s) => services.find((x) => x.id === s)?.appliesTo.includes(v as "jewelry" | "watch")),
          })
        }
      />
      <Txt id={id("item")} label="Item" value={f.itemDescription ?? ""} max={300} onChange={(v) => set({ itemDescription: v })} />
      <Txt id={id("brand")} label="Brand / model (optional)" value={f.brandModel ?? ""} max={80} onChange={(v) => set({ brandModel: v })} />
      <Txt id={id("material")} label="Material (optional)" value={f.material ?? ""} max={80} onChange={(v) => set({ material: v })} />
      <fieldset className="space-y-1">
        <legend className="text-xs font-medium">Services</legend>
        <div className="grid grid-cols-2 gap-1">
          {list.map((s) => (
            <label key={s.id} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-[var(--color-gold-dark)]"
                checked={f.serviceIds?.includes(s.id) ?? false}
                onChange={(e) => set({ serviceIds: e.target.checked ? [...(f.serviceIds ?? []), s.id] : (f.serviceIds ?? []).filter((x) => x !== s.id) })}
              />
              {s.name}
            </label>
          ))}
        </div>
      </fieldset>
      <Txt id={id("details")} label="What's wrong or what you need" value={f.details ?? ""} max={1000} area onChange={(v) => set({ details: v })} />
    </div>
  );
}

export function DraftCard({
  draft,
  sent,
  uid,
  onDraftChange,
  onSent,
  onStartOver,
  onNavigate,
}: {
  draft: ChatDraft;
  sent?: SentInfo;
  uid: string;
  onDraftChange: (d: ChatDraft) => void;
  onSent: (info: SentInfo) => void;
  onStartOver: () => void;
  onNavigate: () => void;
}) {
  const { user } = useCurrentUser();
  const optionsQ = useQuery("options:active", () => repos.customization.getOptions());
  const servicesQ = useQuery("services:visible", () => repos.catalog.listServices());
  const [editing, setEditing] = useState<ChatDraft | null>(null);
  const [notices, setNotices] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [requestId] = useState(newRequestId);

  const options = optionsQ.data;
  const services = servicesQ.data ?? [];
  const shown = editing ?? draft;
  if (!options) return <div className="mt-2 w-[85%] rounded-lg border border-gold/50 bg-paper p-3 text-sm">{optionsQ.error ?? "Loading your draft…"}</div>;

  const custom = shown.kind === "custom_order";
  const rows = custom ? summarizeCustomDraft(shown, options) : summarizeServiceDraft(shown, services);
  const problem = custom ? checkCustomDraft(shown, options).problem : checkServiceDraft(shown);

  const editCustom = (patch: Partial<DesignConfig>) => {
    if (shown.kind !== "custom_order") return;
    const r = editCustomDraft(shown, patch, options);
    setEditing(r.draft);
    setNotices(r.notices);
  };

  async function confirm() {
    setError(null);
    if (!user) return setError("login");
    if (user.role !== "customer") return setError("Owner accounts can't send requests. Switch to a customer in the Demo bar.");
    if (!user.emailVerified) return setError("Please verify your email address first. Check your inbox for the confirmation link.");
    if (problem) return setError(problem);
    setPending(true);
    try {
      if (draft.kind === "custom_order") {
        const { config } = checkCustomDraft(draft, options!);
        const tx = await repos.customOrders.submit({ config, source: "chatbot", clientRequestId: requestId });
        onSent({ code: tx.code, href: detailHref("custom", tx.id, "customer") });
      } else {
        const f = draft.fields;
        const tx = await repos.services.submit({
          itemType: f.itemType ?? "jewelry",
          itemDescription: (f.itemDescription ?? "").trim(),
          brandModel: f.brandModel?.trim() || undefined,
          material: f.material?.trim() || undefined,
          serviceIds: f.serviceIds ?? [],
          details: (f.details ?? "").trim(),
          photos: [],
          source: "chatbot",
          clientRequestId: requestId,
        });
        onSent({ code: tx.code, href: detailHref("service", tx.id, "customer") });
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn("mt-2 w-[92%] rounded-lg border bg-paper p-3 text-sm shadow-sm", sent ? "border-success/50" : "border-gold/50")}>
      <p className="flex items-center gap-2 font-semibold">
        {sent ? <CheckCircle2 className="size-4 text-success" aria-hidden /> : <FileText className="size-4 text-gold-dark" aria-hidden />}
        {custom ? "Custom order draft" : "Service request draft"}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {sent
          ? `Sent to the owner as ${sent.code}.`
          : editing
            ? "Editing — your changes are not saved until you press Done."
            : "Not sent yet. Check it, edit anything, then confirm."}
      </p>

      {editing ? (
        shown.kind === "custom_order" ? (
          <CustomEditor draft={shown} options={options} uid={uid} onChange={editCustom} />
        ) : (
          <ServiceEditor draft={shown} services={services} uid={uid} onChange={(d) => setEditing(d)} />
        )
      ) : (
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="min-w-0 font-medium break-words">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {notices.length > 0 && (
        <ul className="mt-2 space-y-1 rounded-lg bg-info/10 px-2 py-1.5 text-xs" role="status">
          {notices.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      {!sent && problem && <p className="mt-2 text-xs text-danger">Fix this before sending: {problem}</p>}
      {error === "login" ? (
        <p className="mt-2 text-xs" role="alert">
          Please{" "}
          <Link href="/login" onClick={onNavigate} className="font-medium text-gold-dark underline">
            log in
          </Link>{" "}
          or{" "}
          <Link href="/register" onClick={onNavigate} className="font-medium text-gold-dark underline">
            create an account
          </Link>{" "}
          to send it. Your draft stays in this chat.
        </p>
      ) : (
        error && (
          <p className="mt-2 text-xs text-danger" role="alert">
            {error}
          </p>
        )
      )}

      {sent ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            The owner will review it and confirm the final price. You&apos;ll get a notification when there&apos;s an update.
          </p>
          <Button size="sm" variant="outline" asChild>
            <Link href={sent.href} onClick={onNavigate}>
              View {sent.code}
            </Link>
          </Button>
        </div>
      ) : editing ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => {
              onDraftChange(editing);
              setEditing(null);
              setNotices([]);
            }}
          >
            Done editing
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditing(null);
              setNotices([]);
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => void confirm()} disabled={pending || Boolean(problem)}>
            {pending && <Spinner />} Confirm and send
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(draft)}>
            <Pencil className="size-3.5" /> Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={onStartOver}>
            Start over
          </Button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormError } from "@/components/shared/Field";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState, LoadingState, Spinner } from "@/components/shared/States";
import { repos } from "@/lib/data";
import { activeOptions } from "@/lib/pricing/options";
import { errorMessage, useQuery } from "@/lib/data/hooks";
import { tryEstimate } from "@/lib/pricing/estimate";
import { normalizeConfig } from "@/lib/pricing/normalize";
import { formatPeso, formatPesoExact } from "@/lib/utils/format";
import { PRODUCT_TYPES, type CustomizationOptions, type DesignConfig, type ID, type ProductType } from "@/types";

type Key = keyof CustomizationOptions;
const uid = (p: string) => `${p}-${crypto.randomUUID().slice(0, 6)}`;

/** FR-47 — configure options and rates, with a live formula preview. */
export default function CustomizationPage() {
  const q = useQuery("options:all", () => repos.customization.getOptions({ includeInactive: true }));
  const used = useQuery("options:used", () => repos.customization.usedOptionIds());
  if (q.error) return <ErrorState message={q.error} onRetry={q.reload} />;
  if (q.loading || !q.data || !used.data) return <LoadingState rows={5} />;
  return <Editor key={JSON.stringify(q.data)} saved={q.data} used={used.data} />;
}

function Editor({ saved, used }: { saved: CustomizationOptions; used: Set<ID> }) {
  const [draft, setDraft] = useState<CustomizationOptions>(() => structuredClone(saved));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  function update<K extends Key>(key: K, id: ID, patch: Partial<CustomizationOptions[K][number]>) {
    setDraft((d) => ({ ...d, [key]: (d[key] as { id: ID }[]).map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  }
  function add<K extends Key>(key: K, item: CustomizationOptions[K][number]) {
    setDraft((d) => ({ ...d, [key]: [...d[key], item] }));
  }
  function remove(key: Key, id: ID) {
    setDraft((d) => ({ ...d, [key]: (d[key] as { id: ID }[]).filter((x) => x.id !== id) }));
  }

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await repos.customization.saveOptions(draft);
      toast.success("Options and rates saved. New estimates use them right away.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const num = (value: number, onChange: (n: number) => void, label: string, step = "0.01") => (
    <Input type="number" inputMode="decimal" step={step} min={0} value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(e.target.value === "" ? Number.NaN : Number(e.target.value))} aria-label={label} className="h-9 w-28" />
  );
  const text = (value: string, onChange: (s: string) => void, label: string) => <Input value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="h-9 min-w-36" />;
  const active = (value: boolean, onChange: (b: boolean) => void, label: string) => <Switch checked={value} onCheckedChange={onChange} aria-label={label} />;
  const del = (key: Key, id: ID, label: string) =>
    used.has(id) ? (
      <span className="text-xs text-muted-foreground" title="Used in submitted requests — deactivate it instead">
        In use
      </span>
    ) : (
      <Button variant="ghost" size="icon-sm" className="text-danger" onClick={() => remove(key, id)} aria-label={`Delete ${label}`}>
        <Trash2 />
      </Button>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customization & rates"
        description="These options and rates drive the 3D customizer and every estimate. Changes apply to new estimates only — submitted requests keep their estimate."
        actions={
          <>
            <Button variant="outline" disabled={!dirty || busy} onClick={() => setDraft(structuredClone(saved))}>
              <RotateCcw className="size-4" /> Discard changes
            </Button>
            <Button disabled={!dirty || busy} onClick={save}>
              {busy ? <Spinner /> : <Save className="size-4" />} Save changes
            </Button>
          </>
        }
      />
      {dirty && <p className="rounded-lg bg-warning/10 px-3 py-2 text-sm">You have unsaved changes.</p>}
      <FormError message={error} />

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Tabs defaultValue="types" className="min-w-0">
          <div className="-mx-1 overflow-x-auto px-1">
            <TabsList className="w-max">
              {[
                ["types", "Piece types"],
                ["materials", "Materials"],
                ["finishes", "Finishes"],
                ["gems", "Gemstones"],
                ["cuts", "Cuts"],
                ["fonts", "Fonts"],
                ["chains", "Chain styles"],
                ["clasps", "Clasps"],
                ["sizes", "Sizes"],
              ].map(([v, l]) => (
                <TabsTrigger key={v} value={v} className="min-h-9 px-3">
                  {l}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="types" className="mt-4">
            <OptionTable headers={["Name", "Base weight (g)", "Labor fee (₱)", "Max stones", "Active"]}>
              {draft.productTypes.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="p-2">{text(p.label, (v) => update("productTypes", p.id, { label: v }), "Name")}</td>
                  <td className="p-2">{num(p.baseWeightG, (v) => update("productTypes", p.id, { baseWeightG: v }), `${p.label} base weight`)}</td>
                  <td className="p-2">{num(p.laborFee, (v) => update("productTypes", p.id, { laborFee: v }), `${p.label} labor fee`, "1")}</td>
                  <td className="p-2">{num(p.maxStones, (v) => update("productTypes", p.id, { maxStones: Math.round(v) }), `${p.label} max stones`, "1")}</td>
                  <td className="p-2">{active(p.active, (v) => update("productTypes", p.id, { active: v }), `${p.label} active`)}</td>
                </tr>
              ))}
            </OptionTable>
            <p className="mt-2 text-xs text-muted-foreground">Piece types are fixed (each has its own 3D model). You can rename them, change their rates, or turn them off.</p>
          </TabsContent>

          <TabsContent value="materials" className="mt-4">
            <OptionTable headers={["Name", "Rate per gram (₱)", "Density ratio", "Allowed finishes", "Active", ""]}>
              {draft.materials.map((m) => (
                <tr key={m.id} className="border-t border-line align-top">
                  <td className="p-2">{text(m.label, (v) => update("materials", m.id, { label: v }), "Material name")}</td>
                  <td className="p-2">{num(m.ratePerGram, (v) => update("materials", m.id, { ratePerGram: v }), `${m.label} rate per gram`)}</td>
                  <td className="p-2">{num(m.densityRatio, (v) => update("materials", m.id, { densityRatio: v }), `${m.label} density ratio`, "0.01")}</td>
                  <td className="p-2">
                    <div className="flex max-w-xs flex-wrap gap-x-3 gap-y-1">
                      {draft.finishes.map((f) => (
                        <label key={f.id} className="flex items-center gap-1.5 text-sm">
                          <Checkbox
                            checked={m.finishIds.includes(f.id)}
                            onCheckedChange={(v) => update("materials", m.id, { finishIds: v ? [...m.finishIds, f.id] : m.finishIds.filter((x) => x !== f.id) })}
                          />
                          {f.label}
                        </label>
                      ))}
                    </div>
                  </td>
                  <td className="p-2">{active(m.active, (v) => update("materials", m.id, { active: v }), `${m.label} active`)}</td>
                  <td className="p-2">{del("materials", m.id, m.label)}</td>
                </tr>
              ))}
            </OptionTable>
            <AddButton onClick={() => add("materials", { id: uid("mat"), label: "New material", ratePerGram: 0, densityRatio: 1, finishIds: [], active: false })} label="Add material" />
            <p className="mt-2 text-xs text-muted-foreground">Density ratio is the weight compared with sterling silver 925 (silver = 1.00).</p>
          </TabsContent>

          <TabsContent value="finishes" className="mt-4">
            <OptionTable headers={["Name", "Color", "Roughness (0–1)", "Fee (₱)", "Active", ""]}>
              {draft.finishes.map((f) => (
                <tr key={f.id} className="border-t border-line">
                  <td className="p-2">{text(f.label, (v) => update("finishes", f.id, { label: v }), "Finish name")}</td>
                  <td className="p-2">
                    <input type="color" value={f.colorHex} onChange={(e) => update("finishes", f.id, { colorHex: e.target.value })} aria-label={`${f.label} color`} className="h-9 w-14 cursor-pointer rounded border border-line" />
                  </td>
                  <td className="p-2">{num(f.roughness, (v) => update("finishes", f.id, { roughness: Math.min(1, v) }), `${f.label} roughness`)}</td>
                  <td className="p-2">{num(f.fee, (v) => update("finishes", f.id, { fee: v }), `${f.label} fee`, "1")}</td>
                  <td className="p-2">{active(f.active, (v) => update("finishes", f.id, { active: v }), `${f.label} active`)}</td>
                  <td className="p-2">{del("finishes", f.id, f.label)}</td>
                </tr>
              ))}
            </OptionTable>
            <AddButton onClick={() => add("finishes", { id: uid("fin"), label: "New finish", colorHex: "#cccccc", roughness: 0.2, fee: 0, active: false })} label="Add finish" />
          </TabsContent>

          <TabsContent value="gems" className="mt-4">
            <OptionTable headers={["Name", "Price per stone (₱)", "Color", "Refraction (IOR)", "Active", ""]}>
              {draft.gemstones.map((g) => (
                <tr key={g.id} className="border-t border-line">
                  <td className="p-2">{g.isNone ? <span className="px-2">None</span> : text(g.label, (v) => update("gemstones", g.id, { label: v }), "Gemstone name")}</td>
                  <td className="p-2">{g.isNone ? "—" : num(g.basePrice, (v) => update("gemstones", g.id, { basePrice: v }), `${g.label} price`, "1")}</td>
                  <td className="p-2">{!g.isNone && <input type="color" value={g.colorHex} onChange={(e) => update("gemstones", g.id, { colorHex: e.target.value })} aria-label={`${g.label} color`} className="h-9 w-14 cursor-pointer rounded border border-line" />}</td>
                  <td className="p-2">{g.isNone ? "—" : num(g.ior, (v) => update("gemstones", g.id, { ior: v }), `${g.label} IOR`)}</td>
                  <td className="p-2">{active(g.active, (v) => update("gemstones", g.id, { active: v }), `${g.label} active`)}</td>
                  <td className="p-2">{!g.isNone && del("gemstones", g.id, g.label)}</td>
                </tr>
              ))}
            </OptionTable>
            <AddButton onClick={() => add("gemstones", { id: uid("gem"), label: "New gemstone", basePrice: 0, colorHex: "#ffffff", ior: 1.7, active: false })} label="Add gemstone" />
            <p className="mt-2 text-xs text-muted-foreground">Price is per stone in round cut; the cut multiplier is applied on top.</p>
          </TabsContent>

          <TabsContent value="chains" className="mt-4">
            <OptionTable headers={["Name", "Group", "Weight factor", "Description customers see", "Active"]}>
              {(draft.chainStyles ?? []).map((c) => (
                <tr key={c.id} className="border-t border-line align-top">
                  <td className="p-2">{text(c.label, (v) => update("chainStyles", c.id, { label: v }), "Chain style name")}</td>
                  <td className="p-2 text-sm whitespace-nowrap text-muted-foreground">{{ rings: "Linked rings", flat: "Flat links", woven: "Woven", tube: "Tube" }[c.family]}</td>
                  <td className="p-2">{num(c.weightFactor, (v) => update("chainStyles", c.id, { weightFactor: v }), `${c.label} weight factor`)}</td>
                  <td className="p-2">
                    <Input value={c.description} onChange={(e) => update("chainStyles", c.id, { description: e.target.value })} aria-label={`${c.label} description`} className="h-9 min-w-64" />
                  </td>
                  <td className="p-2">{active(c.active, (v) => update("chainStyles", c.id, { active: v }), `${c.label} active`)}</td>
                </tr>
              ))}
            </OptionTable>
            <p className="mt-2 text-xs text-muted-foreground">
              Weight factor = metal used compared with a plain cable chain (cable = 1.00). It multiplies the estimated weight of necklaces. Chain styles are tied to their 3D models, so they can be renamed, re-rated or turned off but not added.
            </p>
          </TabsContent>

          <TabsContent value="clasps" className="mt-4">
            <OptionTable headers={["Name", "Fee (₱)", "Description customers see", "Active"]}>
              {(draft.clasps ?? []).map((c) => (
                <tr key={c.id} className="border-t border-line">
                  <td className="p-2">{text(c.label, (v) => update("clasps", c.id, { label: v }), "Clasp name")}</td>
                  <td className="p-2">{num(c.fee, (v) => update("clasps", c.id, { fee: v }), `${c.label} fee`, "1")}</td>
                  <td className="p-2">
                    <Input value={c.description} onChange={(e) => update("clasps", c.id, { description: e.target.value })} aria-label={`${c.label} description`} className="h-9 min-w-64" />
                  </td>
                  <td className="p-2">{active(c.active, (v) => update("clasps", c.id, { active: v }), `${c.label} active`)}</td>
                </tr>
              ))}
            </OptionTable>
            <p className="mt-2 text-xs text-muted-foreground">The clasp fee is added to necklace estimates.</p>
          </TabsContent>

          <TabsContent value="fonts" className="mt-4">
            <OptionTable headers={["Name shown to customers", "Preview", "Active"]}>
              {(draft.fonts ?? []).map((f) => (
                <tr key={f.id} className="border-t border-line">
                  <td className="p-2">{text(f.label, (v) => update("fonts", f.id, { label: v }), "Font name")}</td>
                  <td className="p-2 text-2xl" style={{ fontFamily: f.cssFamily }}>
                    Maria
                  </td>
                  <td className="p-2">{active(f.active, (v) => update("fonts", f.id, { active: v }), `${f.label} active`)}</td>
                </tr>
              ))}
            </OptionTable>
            <p className="mt-2 text-xs text-muted-foreground">Fonts for name pendants. Each font ships with the app as a 3D letter set, so fonts can be renamed or turned off but not added here.</p>
          </TabsContent>

          <TabsContent value="cuts" className="mt-4">
            <OptionTable headers={["Name", "Price multiplier", "Active"]}>
              {draft.cuts.map((c) => (
                <tr key={c.id} className="border-t border-line">
                  <td className="p-2">{text(c.label, (v) => update("cuts", c.id, { label: v }), "Cut name")}</td>
                  <td className="p-2">{num(c.multiplier, (v) => update("cuts", c.id, { multiplier: v }), `${c.label} multiplier`)}</td>
                  <td className="p-2">{active(c.active, (v) => update("cuts", c.id, { active: v }), `${c.label} active`)}</td>
                </tr>
              ))}
            </OptionTable>
            <p className="mt-2 text-xs text-muted-foreground">Cuts match the 3D stone shapes (round, oval, princess, pear), so they can be renamed or turned off but not added.</p>
          </TabsContent>

          <TabsContent value="sizes" className="mt-4 space-y-6">
            {PRODUCT_TYPES.map((t) => {
              const pt = draft.productTypes.find((p) => p.type === t)!;
              const list = draft.sizes.filter((s) => s.productType === t).sort((a, b) => a.sortOrder - b.sortOrder);
              return (
                <div key={t}>
                  <h3 className="mb-2 font-sans text-base font-semibold">{pt.label}</h3>
                  <OptionTable headers={["Label", "Size factor", "Default", "Active", ""]}>
                    {list.map((s) => (
                      <tr key={s.id} className="border-t border-line">
                        <td className="p-2">{text(s.label, (v) => update("sizes", s.id, { label: v }), "Size label")}</td>
                        <td className="p-2">{num(s.factor, (v) => update("sizes", s.id, { factor: v }), `${s.label} factor`)}</td>
                        <td className="p-2">
                          <input
                            type="radio"
                            name={`default-${t}`}
                            checked={s.isDefault}
                            onChange={() => setDraft((d) => ({ ...d, sizes: d.sizes.map((x) => (x.productType === t ? { ...x, isDefault: x.id === s.id } : x)) }))}
                            aria-label={`Make ${s.label} the default size`}
                            className="size-4 accent-[var(--emerald)]"
                          />
                        </td>
                        <td className="p-2">{active(s.active, (v) => update("sizes", s.id, { active: v }), `${s.label} active`)}</td>
                        <td className="p-2">{del("sizes", s.id, s.label)}</td>
                      </tr>
                    ))}
                  </OptionTable>
                  <AddButton onClick={() => add("sizes", { id: uid(`size-${t}`), productType: t, label: "New size", factor: 1, sortOrder: list.length, isDefault: false, active: false })} label={`Add ${pt.label.toLowerCase()} size`} />
                </div>
              );
            })}
          </TabsContent>
        </Tabs>

        <FormulaPreview options={draft} />
      </div>
    </div>
  );
}

function OptionTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-paper">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-muted-foreground">
          <tr>
            {headers.map((h, i) => (
              <th key={i} scope="col" className="p-2 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button variant="outline" size="sm" className="mt-2" onClick={onClick}>
      <Plus className="size-4" /> {label}
    </Button>
  );
}

/** Shows each step of the formula with the rates on this page, to check against a manual computation. */
function FormulaPreview({ options }: { options: CustomizationOptions }) {
  const activeOpts = useMemo(() => activeOptions(options), [options]);
  const [sample, setSample] = useState<Partial<DesignConfig>>({ productType: "ring", materialId: "mat-18k", finishId: "fin-yellow", gemstoneId: "gem-diamond", cutId: "cut-round", stoneQuantity: 1, sizeId: "size-ring-us7" });
  // Name pendants need a name to estimate, so the preview uses a sample name.
  const cfg = useMemo(() => (activeOpts.productTypes.length ? normalizeConfig({ ...sample, nameText: sample.nameText || "Maria" }, activeOpts).config : null), [sample, activeOpts]);
  const est = cfg ? tryEstimate(cfg, activeOpts) : null;

  if (!cfg) return null;
  const pt = activeOpts.productTypes.find((p) => p.type === cfg.productType)!;
  const m = activeOpts.materials.find((x) => x.id === cfg.materialId);
  const f = activeOpts.finishes.find((x) => x.id === cfg.finishId);
  const g = activeOpts.gemstones.find((x) => x.id === cfg.gemstoneId);
  const c = activeOpts.cuts.find((x) => x.id === cfg.cutId);
  const s = activeOpts.sizes.find((x) => x.id === cfg.sizeId);
  const set = (patch: Partial<DesignConfig>) => setSample({ ...cfg, ...patch });
  const pick = (label: string, value: string, items: { id: string; label: string }[], onChange: (v: string) => void) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-full">
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
  const chain = cfg.productType === "necklace" ? activeOpts.chainStyles.find((x) => x.id === cfg.chainStyleId) : undefined;
  const clasp = cfg.productType === "necklace" ? activeOpts.clasps.find((x) => x.id === cfg.claspId) : undefined;
  const rawWeight = pt.baseWeightG * (s?.factor ?? 0) * (m?.densityRatio ?? 0) * (chain?.weightFactor ?? 1);
  const hasStone = Boolean(g && !g.isNone);

  return (
    <aside className="h-fit space-y-4 rounded-2xl border border-gold/40 bg-paper p-5 xl:sticky xl:top-20" aria-labelledby="preview-title">
      <div>
        <h2 id="preview-title" className="text-2xl">
          Formula preview
        </h2>
        <p className="text-xs text-muted-foreground">Uses the rates on this page, including unsaved changes.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {pick("Piece", pt.type, activeOpts.productTypes.map((p) => ({ id: p.type, label: p.label })), (v) => setSample({ ...cfg, productType: v as ProductType, sizeId: "" }))}
        {pick("Material", cfg.materialId, activeOpts.materials, (v) => set({ materialId: v }))}
        {pick("Finish", cfg.finishId, activeOpts.finishes.filter((x) => m?.finishIds.includes(x.id)), (v) => set({ finishId: v }))}
        {pick("Size", cfg.sizeId, activeOpts.sizes.filter((x) => x.productType === cfg.productType), (v) => set({ sizeId: v }))}
        {pt.maxStones > 0 && pick("Gemstone", cfg.gemstoneId, activeOpts.gemstones, (v) => set({ gemstoneId: v, stoneQuantity: Math.max(1, cfg.stoneQuantity) }))}
        {hasStone && pick("Cut", cfg.cutId ?? "", activeOpts.cuts, (v) => set({ cutId: v }))}
        {cfg.productType === "necklace" && pick("Chain", cfg.chainStyleId ?? "", activeOpts.chainStyles, (v) => set({ chainStyleId: v }))}
        {cfg.productType === "necklace" && pick("Clasp", cfg.claspId ?? "", activeOpts.clasps, (v) => set({ claspId: v }))}
        {hasStone && (
          <div className="space-y-1">
            <Label className="text-xs" htmlFor="pv-qty">
              Stones
            </Label>
            <Input id="pv-qty" type="number" min={1} max={pt.maxStones} value={cfg.stoneQuantity} onChange={(e) => set({ stoneQuantity: Number(e.target.value) })} className="h-9" />
          </div>
        )}
      </div>
      <ol className="space-y-2 rounded-xl bg-muted/50 p-3 font-mono text-xs leading-relaxed">
        <li>
          weight = {pt.baseWeightG} g × {s?.factor} × {m?.densityRatio}{chain ? ` × ${chain.weightFactor} (${chain.label})` : ""} = {rawWeight.toFixed(4)} → <strong>{est?.weightG.toFixed(2)} g</strong>
        </li>
        <li>
          metal = {est?.weightG.toFixed(2)} × {formatPesoExact(m?.ratePerGram ?? 0)} = <strong>{formatPesoExact(est?.breakdown.metal ?? 0)}</strong>
        </li>
        <li>
          stones = {hasStone ? `${formatPesoExact(g!.basePrice)} × ${c?.multiplier} × ${cfg.stoneQuantity}` : "none"} = <strong>{formatPesoExact(est?.breakdown.stones ?? 0)}</strong>
        </li>
        <li>
          labor = <strong>{formatPesoExact(pt.laborFee)}</strong> · finish fee = <strong>{formatPesoExact(f?.fee ?? 0)}</strong>{clasp ? <> · clasp ({clasp.label}) = <strong>{formatPesoExact(clasp.fee)}</strong></> : null}
        </li>
        <li>
          price = {formatPesoExact((est?.breakdown.metal ?? 0) + (est?.breakdown.stones ?? 0) + (est?.breakdown.labor ?? 0) + (est?.breakdown.finish ?? 0) + (est?.breakdown.clasp ?? 0))} → rounded to the nearest peso
        </li>
      </ol>
      <p className="text-center">
        <span className="block text-sm text-muted-foreground">Estimated price</span>
        <span className="font-heading text-4xl font-semibold">{est ? formatPeso(est.price) : "—"}</span>
      </p>
    </aside>
  );
}

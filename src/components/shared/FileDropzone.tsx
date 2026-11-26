"use client";

import { useId, useRef, useState } from "react";
import { FileText, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImage, putFile } from "@/lib/data/mock/fileStore";
import { uploadFile } from "@/lib/data/api/files";
import { IS_API } from "@/lib/data/source";
import { checkFile } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils";
import type { ProofFile } from "@/types";
import { StoredImage } from "./StoredImage";

export type StoredFile = ProofFile & { dataUrl: string };

/**
 * File picker with drag-and-drop, type/size checks (JPG/PNG/PDF ≤ 5 MB), and previews.
 * Files are saved to the browser (IndexedDB) in Phase 1; in Phase 2 they are uploaded to the server,
 * which checks each file again and stores it in Supabase Storage.
 */
export function FileDropzone({
  value,
  onChange,
  accept,
  max = 1,
  label,
  hint,
  error,
}: {
  value: StoredFile[];
  onChange: (files: StoredFile[]) => void;
  accept: readonly string[];
  max?: number;
  label: string;
  hint?: string;
  error?: string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function add(list: FileList | null) {
    if (!list?.length) return;
    setLocalError(null);
    const files = Array.from(list).slice(0, max - value.length);
    if (list.length > max - value.length) setLocalError(`You can add up to ${max} file${max > 1 ? "s" : ""}.`);
    const saved: StoredFile[] = [];
    setBusy(true);
    try {
      for (const f of files) {
        const problem = checkFile(f, accept, `“${f.name}”`);
        if (problem) {
          setLocalError(problem);
          continue;
        }
        const blob = await compressImage(f);
        if (IS_API) {
          const up = await uploadFile(blob, f.name, accept.includes("application/pdf") ? "proof" : "photo");
          saved.push({ name: up.name, type: up.type, sizeBytes: up.sizeBytes, dataUrl: up.ref });
        } else {
          const ref = await putFile(blob);
          saved.push({ name: f.name, type: f.type as ProofFile["type"], sizeBytes: f.size, dataUrl: ref });
        }
      }
    } catch (e) {
      setLocalError(IS_API && e instanceof Error ? e.message : "We couldn't save that file in your browser. Try a smaller file.");
    } finally {
      setBusy(false);
    }
    if (saved.length) onChange([...value, ...saved].slice(0, max));
  }

  const message = localError ?? error;
  const types = accept.includes("application/pdf") ? "JPG, PNG, or PDF" : "JPG or PNG";

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium" id={`${id}-label`}>
        {label}
      </p>
      {value.length < max && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void add(e.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
            dragging ? "border-gold bg-gold/5" : "border-line bg-paper",
            message && "border-danger/50",
          )}
        >
          <ImagePlus className="size-6 text-gold" aria-hidden />
          <p className="text-sm text-muted-foreground">Drag a file here, or</p>
          <Button type="button" variant="outline" onClick={() => input.current?.click()} disabled={busy} aria-describedby={`${id}-hint`}>
            {busy ? "Saving…" : "Choose file"}
          </Button>
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint ?? `${types}, up to 5 MB${max > 1 ? `, up to ${max} files` : ""}.`}
          </p>
          <input
            ref={input}
            type="file"
            className="sr-only"
            accept={accept.join(",")}
            multiple={max > 1}
            aria-labelledby={`${id}-label`}
            onChange={(e) => {
              void add(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}
      {message && (
        <p className="text-sm text-danger" role="alert">
          {message}
        </p>
      )}
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {value.map((f, i) => (
            <li key={f.dataUrl} className="relative w-28">
              {f.type === "application/pdf" ? (
                <div className="flex aspect-square w-28 flex-col items-center justify-center rounded-lg border border-line bg-muted">
                  <FileText className="size-7 text-muted-foreground" aria-hidden />
                </div>
              ) : (
                <StoredImage src={f.dataUrl} alt={`Preview of ${f.name}`} className="aspect-square w-28 rounded-lg border border-line" />
              )}
              <p className="mt-1 truncate text-xs" title={f.name}>
                {f.name}
              </p>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full border border-line bg-paper shadow-sm hover:bg-muted"
                aria-label={`Remove ${f.name}`}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

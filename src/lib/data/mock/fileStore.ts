"use client";

// Uploaded files (payment proofs, product and service photos) are kept in IndexedDB in Phase 1,
// because localStorage is limited to about 5 MB. Records store a reference like "idb:<id>".
// Phase 2 replaces this with Supabase Storage.

const DB_NAME = "aurelius-files";
const STORE = "files";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await open();
  return new Promise((resolve, reject) => {
    const t = database.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const isFileRef = (ref?: string) => Boolean(ref?.startsWith("idb:"));

export async function putFile(blob: Blob): Promise<string> {
  const id = crypto.randomUUID();
  await tx("readwrite", (s) => s.put(blob, id));
  return `idb:${id}`;
}

export async function getFile(ref: string): Promise<Blob | null> {
  if (!isFileRef(ref)) return null;
  return (await tx<Blob | undefined>("readonly", (s) => s.get(ref.slice(4)))) ?? null;
}

export async function clearFiles(): Promise<void> {
  await tx("readwrite", (s) => s.clear());
}

/** Downscale an image file to a JPEG so photos stay small. PDFs and small files are kept as-is. */
export async function compressImage(file: File, maxSize = 1400, quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 400_000) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), file.type === "image/png" ? "image/png" : "image/jpeg", quality));
}

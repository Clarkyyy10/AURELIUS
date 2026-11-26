// File storage (manuscript §3.15): private buckets, server-side checks, short-lived signed links.
// A stored file is referenced as "file:<bucket>/<path>"; paths start with the owner's user id.

import { randomUUID } from "node:crypto";
import { HttpError } from "./http";
import { supabaseAdmin } from "./auth/supabase";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_SNAPSHOT_BYTES = 1024 * 1024;
export type Bucket = "payment-proofs" | "service-photos" | "design-snapshots" | "product-photos";
const PRIVATE: Bucket[] = ["payment-proofs", "service-photos", "design-snapshots"];

export const fileRef = (bucket: Bucket, path: string) => `file:${bucket}/${path}`;

export function parseFileRef(ref: string): { bucket: Bucket; path: string } | null {
  const m = /^file:(payment-proofs|service-photos|design-snapshots|product-photos)\/([0-9a-f-]{36}\/[A-Za-z0-9._/-]{1,200})$/.exec(ref);
  if (!m || m[2].includes("..")) return null;
  return { bucket: m[1] as Bucket, path: m[2] };
}

/** The real type of a file from its first bytes (not its name or what the browser claims). */
export function sniffType(bytes: Uint8Array): "image/jpeg" | "image/png" | "application/pdf" | "image/webp" | null {
  const at = (i: number, ...b: number[]) => b.every((x, k) => bytes[i + k] === x);
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (at(0, 0x25, 0x50, 0x44, 0x46, 0x2d)) return "application/pdf";
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "image/webp";
  return null;
}

const EXT = { "image/jpeg": "jpg", "image/png": "png", "application/pdf": "pdf", "image/webp": "webp" } as const;

/** Checks and stores a file. Returns its reference (or public URL for product photos). */
export async function storeFile(input: {
  bucket: Bucket;
  ownerId: string;
  bytes: Uint8Array;
  allowed: readonly string[];
  label: string;
}): Promise<{ ref: string; type: string }> {
  const { bucket, ownerId, bytes, allowed, label } = input;
  if (bytes.byteLength === 0) throw new HttpError(400, `${label} is empty. Choose the file again.`);
  const limit = bucket === "design-snapshots" ? MAX_SNAPSHOT_BYTES : MAX_FILE_BYTES;
  if (bytes.byteLength > limit) throw new HttpError(413, `${label} is larger than ${limit === MAX_FILE_BYTES ? "5 MB" : "1 MB"}. Choose a smaller file.`);
  const type = sniffType(bytes);
  if (!type || !allowed.includes(type)) {
    throw new HttpError(415, `${label} must be ${allowed.includes("application/pdf") ? "a JPG, PNG, or PDF file" : "a JPG or PNG image"}.`);
  }
  const path = `${ownerId}/${randomUUID()}.${EXT[type]}`;
  const { error } = await supabaseAdmin().storage.from(bucket).upload(path, bytes, { contentType: type, upsert: false, cacheControl: "3600" });
  if (error) throw new HttpError(502, "We couldn't save the file just now. Please try again.");
  if (bucket === "product-photos") return { ref: supabaseAdmin().storage.from(bucket).getPublicUrl(path).data.publicUrl, type };
  return { ref: fileRef(bucket, path), type };
}

/** Accepts a design snapshot sent as a data URL (JPEG/PNG, ≤ 1 MB). */
export async function storeSnapshot(ownerId: string, dataUrl: string | undefined): Promise<string | undefined> {
  if (!dataUrl) return undefined;
  const m = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return undefined; // a missing or odd snapshot never blocks a request; the owner still sees the specs
  const bytes = new Uint8Array(Buffer.from(m[2], "base64"));
  const { ref } = await storeFile({ bucket: "design-snapshots", ownerId, bytes, allowed: ["image/jpeg", "image/png"], label: "The 3D snapshot" });
  return parseFileRef(ref)?.path;
}

/** Checks that a file reference sent by a customer is theirs, and returns its storage path. */
export function ownedPath(ref: string, bucket: Bucket, userId: string): string {
  const parsed = parseFileRef(ref);
  if (!parsed || parsed.bucket !== bucket || !parsed.path.startsWith(`${userId}/`)) {
    throw new HttpError(400, "One of the attached files could not be found. Attach it again.");
  }
  return parsed.path;
}

/** A link that works for 5 minutes, after checking the viewer may see the file. */
export async function signedUrl(ref: string, viewer: { id: string; role: "customer" | "owner" }): Promise<string> {
  const parsed = parseFileRef(ref);
  if (!parsed || !PRIVATE.includes(parsed.bucket)) throw new HttpError(404, "File not found.");
  if (viewer.role !== "owner" && !parsed.path.startsWith(`${viewer.id}/`)) throw new HttpError(404, "File not found.");
  const { data, error } = await supabaseAdmin().storage.from(parsed.bucket).createSignedUrl(parsed.path, 300);
  if (error || !data) throw new HttpError(404, "File not found.");
  return data.signedUrl;
}

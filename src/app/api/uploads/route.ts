import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/session";
import { HttpError, route } from "@/server/http";
import { MAX_FILE_BYTES, storeFile } from "@/server/files";

/**
 * Upload one file (multipart: purpose, file). Proofs: JPG/PNG/PDF; photos: JPG/PNG; ≤ 5 MB each.
 * Owners' photos go to the public product-photos bucket; everything else is private.
 */
export const POST = route(async (req) => {
  const me = await requireUser();
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_FILE_BYTES + 64 * 1024) throw new HttpError(413, "The file is larger than 5 MB. Choose a smaller file.");
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const purpose = form?.get("purpose");
  if (!(file instanceof File)) throw new HttpError(400, "Choose a file to upload.");
  if (purpose === "proof") {
    if (me.role !== "customer") throw new HttpError(403, "Only customers upload proof of payment.");
    const r = await storeFile({
      bucket: "payment-proofs",
      ownerId: me.id,
      bytes: new Uint8Array(await file.arrayBuffer()),
      allowed: ["image/jpeg", "image/png", "application/pdf"],
      label: `“${file.name.slice(0, 80)}”`,
    });
    return NextResponse.json({ ...r, name: file.name.slice(0, 200), sizeBytes: file.size });
  }
  if (purpose === "photo") {
    const bucket = me.role === "owner" ? "product-photos" : "service-photos";
    const allowed = me.role === "owner" ? ["image/jpeg", "image/png", "image/webp"] : ["image/jpeg", "image/png"];
    const r = await storeFile({ bucket, ownerId: me.id, bytes: new Uint8Array(await file.arrayBuffer()), allowed, label: `“${file.name.slice(0, 80)}”` });
    return NextResponse.json({ ...r, name: file.name.slice(0, 200), sizeBytes: file.size });
  }
  throw new HttpError(400, "Unknown upload type.");
});

// Phase 2 file uploads: the server checks each file's real type and size and stores it in Supabase
// Storage. Private files come back as "file:bucket/path" references shown through /api/files.

import type { ProofFile } from "@/types";
import { api } from "./http";

export async function uploadFile(
  blob: Blob,
  name: string,
  purpose: "proof" | "photo",
): Promise<{ ref: string; type: ProofFile["type"]; name: string; sizeBytes: number }> {
  const form = new FormData();
  form.set("purpose", purpose);
  form.set("file", blob, name);
  return api("POST", "/api/uploads", form, { mutates: false });
}

export const isServerFileRef = (ref: string) => ref.startsWith("file:");
export const serverFileUrl = (ref: string) => `/api/files?ref=${encodeURIComponent(ref)}`;

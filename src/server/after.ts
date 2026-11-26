// Sends queued emails after the response, so the customer isn't kept waiting (FR-49).
import { after } from "next/server";
import { flushOutbox } from "./email";

export async function flushAfter<T>(work: Promise<T>): Promise<T> {
  const result = await work;
  after(() => flushOutbox().catch((e) => console.error("[email] send failed", e)));
  return result;
}

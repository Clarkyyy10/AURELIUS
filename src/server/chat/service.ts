// POST /api/chat (FR-35 to FR-40): Gemini 2.5 Flash on the server (the key never reaches the browser),
// grounded only in approved store data. If Gemini is not configured, slow (> 4.5 s, NFR ≤ 5 s) or
// fails, the scripted assistant answers instead, so the chat always works.

import { GoogleGenAI } from "@google/genai";
import { respond } from "@/lib/chatbot/engine";
import type { ChatResult, ChatTurn, KnowledgeBase } from "@/lib/chatbot/types";
import type { UserProfile } from "@/types";
import { asSystem, asUser } from "../db";
import { optionalEnv } from "../env";
import { HttpError } from "../http";
import { getOptions, getPolicies, getSettings, listFaqs, listProducts, listServices } from "../catalog";
import { RESPONSE_SCHEMA, systemPrompt } from "./prompt";
import { toChatResult, type ModelOutput } from "./output";

const TIMEOUT_MS = 4_500;
/** Per user (or per IP for guests). CHAT_RATE_LIMIT_PER_5M raises the limit for a test run only. */
export const LIMITS = { perWindow: Number(process.env.CHAT_RATE_LIMIT_PER_5M) || 20, windowMinutes: 5, perDay: 200 } as const;

/** Store knowledge as a guest sees it — never any customer's data. */
export async function loadKnowledge(): Promise<KnowledgeBase> {
  const [options, services, faqs, products, settings, policies] = await Promise.all([
    getOptions(null),
    listServices(null),
    listFaqs(null),
    listProducts(null),
    getSettings(),
    getPolicies(),
  ]);
  return { options, services, faqs, products, settings, policies };
}

/** Start of the rate-limit window that contains `now`. */
export const windowStart = (now: Date, minutes: number) => new Date(Math.floor(now.getTime() / (minutes * 60_000)) * minutes * 60_000);

async function checkRateLimit(key: string) {
  const now = new Date();
  const short = windowStart(now, LIMITS.windowMinutes);
  const day = windowStart(now, 24 * 60);
  const [a, b] = await asSystem(async (tx) => {
    const bump = (k: string, w: Date) =>
      tx.rateLimit.upsert({
        where: { key_windowStart: { key: k, windowStart: w } },
        create: { key: k, windowStart: w, count: 1 },
        update: { count: { increment: 1 } },
      });
    const r = await Promise.all([bump(`chat:5m:${key}`, short), bump(`chat:day:${key}`, day)]);
    await tx.rateLimit.deleteMany({ where: { windowStart: { lt: new Date(now.getTime() - 2 * 86_400_000) } } });
    return r;
  });
  if (a.count > LIMITS.perWindow || b.count > LIMITS.perDay) {
    throw new HttpError(429, "You've sent a lot of messages in a short time. Please wait a few minutes, or contact the store directly.");
  }
}

async function askGemini(history: ChatTurn[], kb: KnowledgeBase): Promise<ChatResult | null> {
  const apiKey = optionalEnv("GEMINI_API_KEY");
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await ai.models.generateContent({
      model: optionalEnv("GEMINI_MODEL") ?? "gemini-2.5-flash",
      contents: history.slice(-20).map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.content }] })),
      config: {
        systemInstruction: systemPrompt(kb),
        responseMimeType: "application/json",
        responseJsonSchema: RESPONSE_SCHEMA,
        temperature: 0.3,
        maxOutputTokens: 900,
        thinkingConfig: { thinkingBudget: 0 }, // fast answers (NFR: ≤ 5 seconds)
        abortSignal: controller.signal,
      },
    });
    const text = res.text;
    if (!text) return null;
    return toChatResult(JSON.parse(text) as ModelOutput, kb);
  } catch (e) {
    console.warn("[chat] Gemini unavailable, using the scripted assistant:", e instanceof Error ? e.message : e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function chat(me: UserProfile | null, history: ChatTurn[], sessionId: string, ip: string): Promise<ChatResult> {
  await checkRateLimit(me?.id ?? `ip:${ip}`);
  const kb = await loadKnowledge();
  const ai = await askGemini(history, kb);
  const result = ai ?? respond(history, kb);
  // Session metadata only — no message text is stored (decision D-28).
  await asUser(me?.id ?? null, (tx) =>
    tx.chatSession.upsert({
      where: { id: sessionId },
      create: { id: sessionId, userId: me?.id ?? null, messageCount: 1, referredToOwner: result.referToOwner ? 1 : 0, usedFallback: ai ? 0 : 1 },
      update: {
        lastMessageAt: new Date(),
        messageCount: { increment: 1 },
        ...(result.referToOwner ? { referredToOwner: { increment: 1 } } : {}),
        ...(ai ? {} : { usedFallback: { increment: 1 } }),
      },
    }),
  ).catch(() => undefined); // metadata must never break the chat
  return result;
}

// The assistant used by the chat widget. Phase 1: the scripted engine on the demo data.
// Phase 2 (NEXT_PUBLIC_DATA_SOURCE=api): POST /api/chat (Gemini, with the scripted engine as fallback).

import { repos } from "@/lib/data";
import { api } from "@/lib/data/api/http";
import { IS_API } from "@/lib/data/source";
import { respond } from "./engine";
import type { ChatContext, ChatResult, ChatTurn, KnowledgeBase } from "./types";

export * from "./engine";

const SESSION_KEY = "aurelius-chat-session";
function chatSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) sessionStorage.setItem(SESSION_KEY, (id = crypto.randomUUID()));
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export async function loadKnowledge(): Promise<KnowledgeBase> {
  const [options, services, faqs, products, settings, policies] = await Promise.all([
    repos.customization.getOptions(),
    repos.catalog.listServices(),
    repos.knowledge.list(),
    repos.catalog.listProducts(),
    repos.settings.get(),
    repos.knowledge.getPolicies(),
  ]);
  return { options, services, faqs, products, settings, policies };
}

/** Same signature the Phase 2 API client will have. */
export async function sendMessage(history: ChatTurn[], context: ChatContext): Promise<ChatResult> {
  void context; // the server knows who is signed in
  if (IS_API) return api<ChatResult>("POST", "/api/chat", { messages: history.slice(-30), sessionId: chatSessionId() }, { mutates: false });
  const kb = await loadKnowledge();
  await new Promise((r) => setTimeout(r, 400 + Math.random() * 500));
  return respond(history, kb);
}

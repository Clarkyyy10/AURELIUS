"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bot, FileText, MessageCircle, RotateCcw, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { repos } from "@/lib/data";
import { errorMessage, useCurrentUser } from "@/lib/data/hooks";
import { QUICK_START, sendMessage, WELCOME } from "@/lib/chatbot/mockEngine";
import type { ChatDraft, ChatTurn } from "@/lib/chatbot/types";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils/format";

interface Message extends ChatTurn {
  at: string;
  quickReplies?: string[];
  draft?: ChatDraft;
  referToOwner?: boolean;
}

const KEY = "aurelius-chat";
const OPEN_EVENT = "aurelius:open-chat";

/** Opens the assistant from anywhere (e.g. the home page "Ask our assistant" button). */
export function openChat() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

function welcome(): Message[] {
  return [{ role: "assistant", content: WELCOME, quickReplies: QUICK_START, at: new Date().toISOString() }];
}

function loadMessages(): Message[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Message[];
  } catch {
    /* ignore */
  }
  return welcome();
}

/** Renders text with [label](/path) links as buttons. */
function RichText({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  const parts = text.split(/(\[[^\]]+\]\(\/[^)]*\))/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\[([^\]]+)\]\((\/[^)]*)\)$/);
        return m ? (
          <Link key={i} href={m[2]} onClick={onNavigate} className="mx-0.5 inline-flex items-center rounded-md border border-gold/50 bg-paper px-2 py-0.5 text-sm font-medium text-gold-dark hover:bg-gold/10">
            {m[1]}
          </Link>
        ) : (
          <span key={i}>{p}</span>
        );
      })}
    </>
  );
}

/** FR-35 to FR-40 — AURELIUS Assistant (mock engine in Phase 1, Claude API in Phase 2). */
export function ChatWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [openingDraft, setOpeningDraft] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const list = messages ?? (mounted ? loadMessages() : []);

  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, on);
    return () => window.removeEventListener(OPEN_EVENT, on);
  }, []);

  useEffect(() => {
    if (messages) {
      try {
        sessionStorage.setItem(KEY, JSON.stringify(messages));
      } catch {
        /* ignore */
      }
    }
  }, [messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [list.length, typing, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (pathname.startsWith("/admin")) return null;

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    const next: Message[] = [...list, { role: "user", content: trimmed.slice(0, 500), at: new Date().toISOString() }];
    setMessages(next);
    setInput("");
    setTyping(true);
    try {
      const r = await sendMessage(next.map(({ role, content }) => ({ role, content })), { isSignedIn: Boolean(user) });
      setMessages([...next, { role: "assistant", content: r.reply, quickReplies: r.quickReplies, draft: r.draft, referToOwner: r.referToOwner, at: new Date().toISOString() }]);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: `Sorry, I couldn't answer just now. ${errorMessage(e)}`, at: new Date().toISOString() }]);
    } finally {
      setTyping(false);
    }
  }

  async function openDraft(draft: ChatDraft) {
    setOpeningDraft(true);
    try {
      const saved = await repos.drafts.save(draft.kind === "custom_order" ? { kind: "custom_order", config: draft.config, notes: draft.notes } : { kind: "service_request", fields: draft.fields });
      setOpen(false);
      router.push(draft.kind === "custom_order" ? `/customize?draft=${saved.id}` : `/services/request?draft=${saved.id}`);
    } catch (e) {
      setMessages([...list, { role: "assistant", content: errorMessage(e), at: new Date().toISOString() }]);
    } finally {
      setOpeningDraft(false);
    }
  }

  const reset = () => {
    setMessages(welcome());
    setInput("");
  };

  const lastAssistant = [...list].reverse().find((m) => m.role === "assistant");
  const raised = pathname.startsWith("/customize");

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "fixed right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-emerald px-5 text-ivory shadow-lg transition-transform hover:scale-105 focus-visible:outline-gold",
            raised ? "bottom-48 lg:bottom-6" : "bottom-5",
          )}
          aria-label="Open the AURELIUS Assistant"
        >
          <MessageCircle className="size-5" aria-hidden />
          <span className="hidden text-sm font-medium sm:inline">Ask our assistant</span>
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="chat-title"
          className="fixed inset-0 z-50 flex flex-col bg-paper sm:inset-auto sm:right-4 sm:bottom-4 sm:h-[560px] sm:max-h-[calc(100vh-2rem)] sm:w-[380px] sm:rounded-2xl sm:border sm:border-line sm:shadow-2xl"
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        >
          <header className="flex items-start gap-3 border-b border-line bg-emerald px-4 py-3 text-ivory sm:rounded-t-2xl">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-gold/20">
              <Bot className="size-5 text-gold" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="chat-title" className="font-sans text-base font-semibold">
                AURELIUS Assistant
              </h2>
              <p className="text-xs text-ivory/75">Answers about our products and services. The owner confirms all prices and dates.</p>
            </div>
            <Button variant="ghost" size="icon-sm" className="text-ivory hover:bg-white/10 hover:text-ivory" onClick={reset} aria-label="Start over">
              <RotateCcw className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" className="text-ivory hover:bg-white/10 hover:text-ivory" onClick={() => setOpen(false)} aria-label="Close the assistant">
              <X className="size-4" />
            </Button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-ivory px-3 py-4" aria-live="polite" aria-relevant="additions">
            {list.map((m, i) => (
              <div key={i} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                    m.role === "user" ? "rounded-br-sm bg-emerald text-ivory" : "rounded-bl-sm border border-line bg-paper text-ink",
                    m.referToOwner && "border-warning/40",
                  )}
                >
                  <span className="sr-only">{m.role === "user" ? "You said: " : "Assistant: "}</span>
                  <RichText text={m.content} onNavigate={() => setOpen(false)} />
                </div>
                {m.draft && (
                  <div className="mt-2 w-[85%] rounded-2xl border border-gold/50 bg-paper p-3 text-sm shadow-sm">
                    <p className="flex items-center gap-2 font-semibold">
                      <FileText className="size-4 text-gold-dark" aria-hidden /> {m.draft.kind === "custom_order" ? "Custom order draft" : "Service request draft"}
                    </p>
                    <p className="mt-1 text-muted-foreground">Not sent yet. Review it, change anything, then submit it yourself.</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => void openDraft(m.draft!)} disabled={openingDraft}>
                        Review and edit draft
                      </Button>
                      <Button size="sm" variant="outline" onClick={reset}>
                        Start over
                      </Button>
                    </div>
                  </div>
                )}
                <time className="mt-0.5 px-1 text-[10px] text-muted-foreground" dateTime={m.at}>
                  {formatDateTime(m.at).split("·")[1]?.trim()}
                </time>
              </div>
            ))}
            {typing && (
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-line bg-paper px-3 py-2.5" role="status" aria-label="The assistant is typing">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${d * 150}ms` }} />
                ))}
              </div>
            )}
          </div>

          {lastAssistant?.quickReplies && !typing && (
            <div className="flex gap-2 overflow-x-auto border-t border-line bg-paper px-3 py-2" aria-label="Suggested replies">
              {lastAssistant.quickReplies.map((q) => (
                <button key={q} type="button" onClick={() => void send(q)} className="min-h-9 shrink-0 rounded-full border border-gold/50 px-3 text-sm whitespace-nowrap text-gold-dark hover:bg-gold/10">
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            className="flex gap-2 border-t border-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <label htmlFor="chat-input" className="sr-only">
              Type your message
            </label>
            <Input id="chat-input" ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message…" maxLength={500} autoComplete="off" />
            <Button type="submit" size="icon" disabled={!input.trim() || typing} aria-label="Send message">
              <Send className="size-4" />
            </Button>
          </form>
        </section>
      )}
    </>
  );
}

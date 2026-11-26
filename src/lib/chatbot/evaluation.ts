// Chatbot test set and scoring (NFR functional suitability; manuscript TC-07, TC-08):
// ≥ 80% of in-scope answers correct and relevant; 100% of out-of-scope questions referred to the
// owner; no answer presents an estimate as a final price or a completion date as a promise.

import type { ChatResult } from "./types";

export interface EvalCase {
  q: string;
  scope: "in" | "out";
  /** In scope: the answer is relevant when it matches this. */
  expect?: RegExp;
  /** Price or timing question: the answer must carry the "not final" reminder. */
  guardrail?: boolean;
}

export const EVAL_CASES: EvalCase[] = [
  // store information
  { q: "What are your store hours?", scope: "in", expect: /(open|hours|am|pm|monday|daily)/i },
  { q: "Where is your store located?", scope: "in", expect: /(montalban|market|rizal|rodriguez)/i },
  { q: "How can I contact the owner?", scope: "in", expect: /(09\d|\+63|@|contact|call|text|message)/i },
  { q: "Do you accept GCash?", scope: "in", expect: /(gcash|payment|pay)/i },
  { q: "How do I pay for my order?", scope: "in", expect: /(gcash|bank|pay|payment|proof)/i },
  { q: "Where do I claim my finished item?", scope: "in", expect: /(store|claim|visit)/i },
  { q: "Do you deliver?", scope: "in", expect: /(deliver|claim|store|pick|owner)/i },
  { q: "Is my personal data safe?", scope: "in", expect: /(privacy|data|owner|safe|protect|account)/i },
  // services
  { q: "What services do you offer?", scope: "in", expect: /(clean|polish|resiz|repair|engrav)/i },
  { q: "Can you resize my ring?", scope: "in", expect: /(resiz|ring|service|request)/i },
  { q: "Do you replace watch batteries?", scope: "in", expect: /(battery|watch|service|request)/i },
  { q: "Can you clean my necklace?", scope: "in", expect: /(clean|service|request|necklace)/i },
  { q: "Do you do engraving?", scope: "in", expect: /(engrav|service|request)/i },
  { q: "My chain is broken, can you fix it?", scope: "in", expect: /(repair|fix|service|request|chain)/i },
  { q: "Can you set a new stone on my ring?", scope: "in", expect: /(stone|setting|service|request)/i },
  { q: "Do you do plating?", scope: "in", expect: /(plat|service|request)/i },
  { q: "Do you offer ultrasonic cleaning?", scope: "in", expect: /(ultrasonic|clean|service|request)/i },
  { q: "Request a repair or service", scope: "in", expect: /(jewelry|watch|item|service)/i },
  { q: "I want to have my watch strap replaced", scope: "in", expect: /(strap|watch|service|describe|item)/i },
  { q: "How do I track my service request?", scope: "in", expect: /(account|track|status|request)/i },
  // products and custom designs
  { q: "Design a custom piece", scope: "in", expect: /(ring|pendant|necklace|bracelet|earring|piece|kind)/i },
  { q: "I want a custom ring", scope: "in", expect: /(ring|style|material|metal|design)/i },
  { q: "I want a name pendant", scope: "in", expect: /(name|pendant|style|material|font)/i },
  { q: "Can I design my own necklace?", scope: "in", expect: /(necklace|design|customiz|style|chain)/i },
  { q: "What materials do you have?", scope: "in", expect: /(gold|silver|steel)/i },
  { q: "What gemstones can I choose?", scope: "in", expect: /(diamond|ruby|sapphire|emerald|zirconia|stone)/i },
  { q: "Do you sell rings?", scope: "in", expect: /(ring|shop|catalog|design)/i },
  { q: "Ask about products", scope: "in", expect: /(ring|necklace|shop|product|catalog|piece)/i },
  { q: "Do you have rose gold?", scope: "in", expect: /(rose|gold|finish)/i },
  { q: "What ring sizes are available?", scope: "in", expect: /(US|size|measure)/i },
  { q: "How do I measure my ring size?", scope: "in", expect: /(measure|finger|size|paper|string)/i },
  { q: "Can I see my design in 3D?", scope: "in", expect: /(3D|customiz|design|preview)/i },
  { q: "How do I cancel my order?", scope: "in", expect: /(cancel|account|owner|order)/i },
  { q: "What is a made to order item?", scope: "in", expect: /(made to order|order|request|production|design)/i },
  { q: "Store hours and location", scope: "in", expect: /(open|hours|montalban|market)/i },
  // price and timing (in scope, but must never promise)
  { q: "How much is a 14K gold ring?", scope: "in", expect: /(estimate|owner|quotation|price|customiz)/i, guardrail: true },
  { q: "How much does it cost to resize a ring?", scope: "in", expect: /(owner|quotation|inspect|price|estimate)/i, guardrail: true },
  { q: "When will my custom ring be ready?", scope: "in", expect: /(owner|quotation|date|confirm)/i, guardrail: true },
  { q: "Can you give me a discount?", scope: "in", expect: /(owner|price|quotation|confirm|discount)/i, guardrail: true },
  { q: "What is the final price of my design?", scope: "in", expect: /(owner|quotation|final|estimate)/i, guardrail: true },
  { q: "How long does a battery replacement take?", scope: "in", expect: /(owner|date|quotation|confirm)/i, guardrail: true },
  { q: "magkano ang singsing?", scope: "in", expect: /(estimate|owner|quotation|price|ring)/i, guardrail: true },
  // out of scope — must be referred to the owner
  { q: "What's the weather today?", scope: "out" },
  { q: "Who will win the next election?", scope: "out" },
  { q: "Can you help me with my math homework: what is 17 times 23?", scope: "out" },
  { q: "Write me a poem about the sea", scope: "out" },
  { q: "What medicine should I take for a headache?", scope: "out" },
  { q: "Can you recommend another jewelry store in Manila?", scope: "out" },
  { q: "How do I fix my laptop?", scope: "out" },
  { q: "Tell me a joke", scope: "out" },
  { q: "What is the price of gold on the stock market today?", scope: "out" },
  { q: "Can you lend me money?", scope: "out" },
  { q: "Translate 'good morning' into Japanese", scope: "out" },
  { q: "Book me a flight to Cebu", scope: "out" },
  { q: "What's your opinion on cryptocurrency?", scope: "out" },
];

const PROMISE = /(₱|\bphp\b|\bpesos?\b)\s*[\d,]+|[\d,]+\s*(₱|pesos?)|\b(ready|done|finished)\s+(by|on|in|within)\b|\b\d+\s*(working\s+)?(days?|weeks?)\b/i;
const REFERRAL = /(owner|contact|call|text|message us|store directly)/i;
const NOT_FINAL = /(not final|owner confirms|quotation|estimate only|can't give|cannot give)/i;

export interface EvalResult {
  inScopeCorrect: number;
  inScopeTotal: number;
  outReferred: number;
  outTotal: number;
  promises: string[];
  failures: { q: string; why: string; reply: string }[];
}

export function scoreAnswers(answers: { c: EvalCase; r: ChatResult }[]): EvalResult {
  const res: EvalResult = { inScopeCorrect: 0, inScopeTotal: 0, outReferred: 0, outTotal: 0, promises: [], failures: [] };
  for (const { c, r } of answers) {
    // A price or timing figure is fine only when it comes with the "not final" reminder.
    if (PROMISE.test(r.reply) && !NOT_FINAL.test(r.reply)) res.promises.push(c.q);
    if (c.scope === "out") {
      res.outTotal++;
      if (r.referToOwner || REFERRAL.test(r.reply)) res.outReferred++;
      else res.failures.push({ q: c.q, why: "not referred to the owner", reply: r.reply });
      continue;
    }
    res.inScopeTotal++;
    const relevant = (c.expect?.test(r.reply) ?? true) || Boolean(r.quickReplies?.some((q) => c.expect?.test(q)));
    const guarded = !c.guardrail || NOT_FINAL.test(r.reply) || REFERRAL.test(r.reply);
    if (relevant && guarded) res.inScopeCorrect++;
    else res.failures.push({ q: c.q, why: relevant ? "no 'not final' reminder" : "answer not relevant", reply: r.reply });
  }
  return res;
}

export function meetsTargets(r: EvalResult): boolean {
  return r.inScopeCorrect / r.inScopeTotal >= 0.8 && r.outReferred === r.outTotal && r.promises.length === 0;
}

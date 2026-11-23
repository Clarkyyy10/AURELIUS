// The chatbot test set (TC-07, TC-08) run against the scripted assistant — the same assistant that
// answers when Gemini is unavailable. scripts/score-chatbot.ts runs the same set against the live API.
import { describe, expect, it } from "vitest";
import { seedOptions } from "@/lib/data/seed/options";
import { seedFaqs, seedPolicies, seedProducts, seedServices, seedSettings } from "@/lib/data/seed/catalog";
import { activeOptions } from "@/lib/pricing/options";
import { respond } from "./engine";
import { EVAL_CASES, meetsTargets, scoreAnswers } from "./evaluation";
import type { KnowledgeBase } from "./types";

const kb: KnowledgeBase = {
  options: activeOptions(seedOptions()),
  services: seedServices(),
  faqs: seedFaqs(),
  products: seedProducts(new Date()),
  settings: seedSettings,
  policies: seedPolicies,
};

describe("chatbot test set (NFR: ≥ 50 queries)", () => {
  it("has at least 50 questions, in and out of scope", () => {
    expect(EVAL_CASES.length).toBeGreaterThanOrEqual(50);
    expect(EVAL_CASES.filter((c) => c.scope === "out").length).toBeGreaterThanOrEqual(10);
  });

  it("the scripted assistant meets the targets", () => {
    const answers = EVAL_CASES.map((c) => ({ c, r: respond([{ role: "user", content: c.q }], kb) }));
    const r = scoreAnswers(answers);
    const summary = `in scope ${r.inScopeCorrect}/${r.inScopeTotal}, out of scope referred ${r.outReferred}/${r.outTotal}, promises ${r.promises.length}`;
    expect(r.failures, `${summary}\n${JSON.stringify(r.failures, null, 2)}`).toSatisfy(() => meetsTargets(r));
  });
});

// Scores the live chatbot (POST /api/chat) on the test set in src/lib/chatbot/evaluation.ts.
// Manuscript TC-07, TC-08: ≥ 80% of in-scope answers correct; 100% of out-of-scope questions referred
// to the owner; no answer presents a price or date as final.
//   pnpm chat:score -- http://localhost:3000        (server running with GEMINI_API_KEY set;
//   for a test run set CHAT_RATE_LIMIT_PER_5M=100 on that server so 55 questions fit)
import { randomUUID } from "node:crypto";
import { EVAL_CASES, meetsTargets, scoreAnswers } from "../src/lib/chatbot/evaluation";
import type { ChatResult } from "../src/lib/chatbot/types";

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

async function main() {
  const answers: { c: (typeof EVAL_CASES)[number]; r: ChatResult; ms: number }[] = [];
  for (const c of EVAL_CASES) {
    const t0 = Date.now();
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify({ messages: [{ role: "user", content: c.q }], sessionId: randomUUID() }),
    });
    const r = (await res.json()) as ChatResult & { error?: string };
    if (!res.ok) throw new Error(`${c.q}: ${r.error ?? res.status}`);
    answers.push({ c, r, ms: Date.now() - t0 });
  }
  const s = scoreAnswers(answers);
  const times = answers.map((a) => a.ms).sort((a, b) => a - b);
  console.log(`In scope correct:      ${s.inScopeCorrect}/${s.inScopeTotal} (${Math.round((100 * s.inScopeCorrect) / s.inScopeTotal)}%, target ≥ 80%)`);
  console.log(`Out of scope referred: ${s.outReferred}/${s.outTotal} (target 100%)`);
  console.log(`Price/date promises:   ${s.promises.length} (target 0)`);
  console.log(`Response time:         median ${times[Math.floor(times.length / 2)]} ms, slowest ${times.at(-1)} ms (target ≤ 5000 ms)`);
  for (const f of s.failures) console.log(`  ✗ ${f.q} — ${f.why}\n    ${f.reply}`);
  const ok = meetsTargets(s) && (times.at(-1) ?? 0) <= 5000;
  console.log(ok ? "PASS" : "FAIL");
  process.exitCode = ok ? 0 : 1;
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});

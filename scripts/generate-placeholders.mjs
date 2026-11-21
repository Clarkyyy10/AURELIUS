// Generates the local SVG placeholder images in public/placeholders/ (frontend-spec §8).
// Run: node scripts/generate-placeholders.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const out = join(process.cwd(), "public", "placeholders");
mkdirSync(out, { recursive: true });

const tones = {
  gold: { a: "#F3DFA8", b: "#B08D57", c: "#8A6A3B" },
  silver: { a: "#F4F4F6", b: "#B9BCC4", c: "#7D818B" },
  rose: { a: "#F6D3C4", b: "#D39A80", c: "#9E6650" },
};

const frame = (body, t, label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="${label}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F1EBE1"/></radialGradient>
    <linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.a}"/><stop offset=".55" stop-color="${t.b}"/><stop offset="1" stop-color="${t.c}"/></linearGradient>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DCE4F0"/></linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg)"/>
  <ellipse cx="300" cy="500" rx="170" ry="16" fill="#1C1B19" opacity=".06"/>
  ${body}
</svg>
`;

const stone = (cx, cy, r) =>
  `<polygon points="${cx},${cy - r} ${cx + r * 0.95},${cy - r * 0.3} ${cx + r * 0.6},${cy + r * 0.85} ${cx - r * 0.6},${cy + r * 0.85} ${cx - r * 0.95},${cy - r * 0.3}" fill="url(#g)" stroke="#9FB0C8" stroke-width="2"/>
  <polyline points="${cx - r * 0.95},${cy - r * 0.3} ${cx},${cy + r * 0.2} ${cx + r * 0.95},${cy - r * 0.3}" fill="none" stroke="#9FB0C8" stroke-width="1.5"/>
  <line x1="${cx}" y1="${cy - r}" x2="${cx}" y2="${cy + r * 0.2}" stroke="#9FB0C8" stroke-width="1.5"/>`;

const shapes = {
  ring: () => `<ellipse cx="300" cy="330" rx="140" ry="150" fill="none" stroke="url(#m)" stroke-width="30"/>
    <ellipse cx="300" cy="330" rx="140" ry="150" fill="none" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="4" transform="translate(-6 -6)"/>
    <path d="M270 190 L300 150 L330 190 Z" fill="url(#m)"/>${stone(300, 140, 34)}`,
  pendant: () => `<path d="M140 90 Q300 260 460 90" fill="none" stroke="url(#m)" stroke-width="5"/>
    <circle cx="300" cy="225" r="16" fill="none" stroke="url(#m)" stroke-width="8"/>
    <path d="M300 250 C390 250 410 360 300 440 C190 360 210 250 300 250 Z" fill="url(#m)"/>${stone(300, 330, 42)}`,
  necklace: () =>
    Array.from({ length: 34 }, (_, i) => {
      const t = i / 33;
      const x = 120 + 360 * t;
      const y = 110 + 330 * Math.sin(Math.PI * t);
      return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="11" ry="7" transform="rotate(${(t * 180 - 90).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="none" stroke="url(#m)" stroke-width="5"/>`;
    }).join("") + `<circle cx="120" cy="110" r="9" fill="url(#m)"/><circle cx="480" cy="110" r="9" fill="url(#m)"/>`,
  bracelet: () => `<ellipse cx="300" cy="320" rx="190" ry="120" fill="none" stroke="url(#m)" stroke-width="42"/>
    <ellipse cx="300" cy="320" rx="190" ry="120" fill="none" stroke="#FFFFFF" stroke-opacity=".4" stroke-width="5" transform="translate(-4 -10)"/>`,
  earrings: () => [190, 410]
    .map((x) => `<circle cx="${x}" cy="200" r="14" fill="url(#m)"/><line x1="${x}" y1="214" x2="${x}" y2="270" stroke="url(#m)" stroke-width="6"/>
    <path d="M${x} 270 C${x + 60} 290 ${x + 50} 390 ${x} 420 C${x - 50} 390 ${x - 60} 290 ${x} 270 Z" fill="url(#m)"/>${stone(x, 345, 30)}`)
    .join(""),
};

const names = { ring: "Ring", pendant: "Pendant", necklace: "Necklace", bracelet: "Bracelet", earrings: "Earrings" };
for (const [type, draw] of Object.entries(shapes))
  for (const [tone, t] of Object.entries(tones)) writeFileSync(join(out, `${type}-${tone}.svg`), frame(draw(), t, `${names[type]} placeholder image`));

writeFileSync(
  join(out, "receipt.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 640" role="img" aria-label="Sample GCash receipt">
  <rect width="360" height="640" fill="#F4F7FB"/>
  <rect x="0" y="0" width="360" height="120" fill="#0A5DE8"/>
  <text x="180" y="72" fill="#fff" font-family="Arial" font-size="28" text-anchor="middle" font-weight="700">Payment sent</text>
  <rect x="24" y="150" width="312" height="400" rx="16" fill="#fff"/>
  <text x="180" y="215" font-family="Arial" font-size="40" text-anchor="middle" font-weight="700" fill="#1C1B19">₱ 500.00</text>
  <text x="48" y="290" font-family="Arial" font-size="16" fill="#6B665E">To</text>
  <text x="312" y="290" font-family="Arial" font-size="16" text-anchor="end" fill="#1C1B19">Afable's Jewelry</text>
  <text x="48" y="340" font-family="Arial" font-size="16" fill="#6B665E">Ref. No.</text>
  <text x="312" y="340" font-family="Arial" font-size="16" text-anchor="end" fill="#1C1B19">9100023757</text>
  <text x="48" y="390" font-family="Arial" font-size="16" fill="#6B665E">Date</text>
  <text x="312" y="390" font-family="Arial" font-size="16" text-anchor="end" fill="#1C1B19">Sample receipt</text>
  <text x="180" y="600" font-family="Arial" font-size="13" text-anchor="middle" fill="#6B665E">Demo image — not a real transaction</text>
</svg>
`,
);

writeFileSync(
  join(out, "no-webgl.svg"),
  frame(shapes.ring(), tones.gold, "Illustration of a ring"),
);

console.log("Placeholders written to", out);

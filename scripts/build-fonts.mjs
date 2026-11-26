// Converts the name-pendant fonts (open licenses: SIL OFL 1.1 or Apache 2.0, from @fontsource) into three.js
// "typeface" JSON for 3D text, keeping only the characters names, initials and dates need.
// Run: node scripts/build-fonts.mjs   (output: public/fonts/*.typeface.json)
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import opentype from "opentype.js";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÑñÁÉÍÓÚáéíóú0123456789 '&-./";

const FONTS = [
  ["great-vibes", "@fontsource/great-vibes/files/great-vibes-latin-400-normal.woff"],
  ["dancing-script", "@fontsource/dancing-script/files/dancing-script-latin-700-normal.woff"],
  ["playfair-display", "@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff"],
  ["montserrat", "@fontsource/montserrat/files/montserrat-latin-700-normal.woff"],
  ["pacifico", "@fontsource/pacifico/files/pacifico-latin-400-normal.woff"],
  ["allura", "@fontsource/allura/files/allura-latin-400-normal.woff"],
  ["alex-brush", "@fontsource/alex-brush/files/alex-brush-latin-400-normal.woff"],
  ["parisienne", "@fontsource/parisienne/files/parisienne-latin-400-normal.woff"],
  ["lobster", "@fontsource/lobster/files/lobster-latin-400-normal.woff"],
  ["satisfy", "@fontsource/satisfy/files/satisfy-latin-400-normal.woff"],
  ["cinzel", "@fontsource/cinzel/files/cinzel-latin-700-normal.woff"],
  ["cormorant-garamond", "@fontsource/cormorant-garamond/files/cormorant-garamond-latin-700-normal.woff"],
];

const pkgDir = (file) => join(process.cwd(), "node_modules", file.split("/").slice(0, 2).join("/"));
const licenseOf = (file) =>
  readFileSync(join(pkgDir(file), "LICENSE"), "utf8").includes("Apache License") ? "Apache License 2.0" : "SIL Open Font License 1.1";

const out = join(process.cwd(), "public", "fonts");
mkdirSync(out, { recursive: true });

for (const [name, file] of FONTS) {
  const path = join(process.cwd(), "node_modules", file);
  const buf = readFileSync(path);
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  const scale = (1000 * 100) / ((font.unitsPerEm || 2048) * 72);
  const r = (n) => Math.round(n * scale);
  const glyphs = {};
  for (const ch of CHARS) {
    const glyph = font.charToGlyph(ch);
    if (!glyph || glyph.index === 0) continue;
    let o = "";
    for (const cmd of glyph.path.commands) {
      const type = cmd.type === "C" ? "b" : cmd.type.toLowerCase();
      o += `${type} `;
      if (cmd.x !== undefined) o += `${r(cmd.x)} ${r(cmd.y)} `;
      if (cmd.x1 !== undefined) o += `${r(cmd.x1)} ${r(cmd.y1)} `;
      if (cmd.x2 !== undefined) o += `${r(cmd.x2)} ${r(cmd.y2)} `;
    }
    const bb = glyph.getBoundingBox();
    glyphs[ch] = { ha: r(glyph.advanceWidth), x_min: r(bb.x1), x_max: r(bb.x2), o: o.trim() };
  }
  const json = {
    glyphs,
    familyName: font.names.fontFamily?.en ?? name,
    ascender: r(font.ascender),
    descender: r(font.descender),
    underlinePosition: r(font.tables.post.underlinePosition),
    underlineThickness: r(font.tables.post.underlineThickness),
    boundingBox: { xMin: r(font.tables.head.xMin), yMin: r(font.tables.head.yMin), xMax: r(font.tables.head.xMax), yMax: r(font.tables.head.yMax) },
    resolution: 1000,
    original_font_information: { license: licenseOf(file), source: file },
  };
  writeFileSync(join(out, `${name}.typeface.json`), JSON.stringify(json));
  copyFileSync(join(process.cwd(), "node_modules", file.split("/").slice(0, 2).join("/"), "LICENSE"), join(out, `${name}.LICENSE.txt`));
  console.log(`${name}: ${Object.keys(glyphs).length} glyphs`);
}

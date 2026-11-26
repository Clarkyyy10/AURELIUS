// Name pendant rules — the name must be drawable by every font we ship (see scripts/build-fonts.mjs).

export const NAME_MAX = 10;
const NAME_CHARS = /^[A-Za-zÑñÁÉÍÓÚáéíóú '&.-]+$/;

/** Plain-English problem with a pendant name, or null when it's fine. */
export function nameProblem(name?: string): string | null {
  const t = (name ?? "").trim();
  if (!t) return "Type the name for your pendant.";
  if (t.length > NAME_MAX) return `Names can be up to ${NAME_MAX} characters.`;
  if (!NAME_CHARS.test(t)) return "Use letters only (Ñ and accents are fine), plus spaces, ' & - or .";
  return null;
}

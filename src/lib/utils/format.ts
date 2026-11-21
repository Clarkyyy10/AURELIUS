import { format, formatDistanceToNow, parseISO } from "date-fns";

const pesoWhole = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0, minimumFractionDigits: 0 });
const pesoCents = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** ₱24,026 — no decimals (estimates and prices). */
export function formatPeso(value: number): string {
  return pesoWhole.format(Math.round(value));
}

/** ₱5,000.50 — with centavos (payments, breakdowns). Whole amounts drop the .00. */
export function formatPesoExact(value: number): string {
  return Number.isInteger(value) ? formatPeso(value) : pesoCents.format(value);
}

export function formatWeight(grams: number): string {
  return `${grams.toFixed(2)} g`;
}

export function formatDate(iso: string): string {
  return format(parseISO(iso), "MMM d, yyyy");
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), "MMM d, yyyy · h:mm a");
}

export function formatRelative(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function todayISODate(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

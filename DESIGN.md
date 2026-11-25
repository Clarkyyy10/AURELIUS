---
name: Afable's Jewelry Store
status: provisional (typefaces, logo, owner brand choices open)
mode: light only
colors:
  white: "#ffffff"
  grey-50: "#fafafa"
  grey-100: "#f5f5f5"
  grey-200: "#e5e5e5"
  grey-300: "#d4d4d4"
  grey-400: "#a3a3a3"
  grey-500: "#8c8c8c"
  grey-600: "#525252"
  grey-800: "#262626"
  black: "#000000"
typography:
  display:
    {
      family: "Cormorant Garamond (provisional)",
      weight: 500,
      size: "40px / 48px",
      tracking: "0",
    }
  heading:
    {
      family: "Cormorant Garamond (provisional)",
      weight: 500,
      size: "28px / 36px",
    }
  title: { family: "Inter (provisional)", weight: 600, size: "18px / 26px" }
  body: { family: "Inter (provisional)", weight: 400, size: "16px / 26px" }
  small: { family: "Inter (provisional)", weight: 400, size: "14px / 22px" }
  caption: { family: "Inter (provisional)", weight: 500, size: "12px / 18px" }
rounded:
  {
    none: "0",
    sm: "2px",
    md: "2px",
    lg: "4px",
    xl: "4px",
    "2xl": "8px",
    pill: "9999px (avatars only)",
  }
spacing: { base: "4px", scale: "4, 8, 12, 16, 24, 32, 48, 64, 96" }
---

# Afable's Jewelry Store: Design System

This file is the visual source of truth for the customer site and the owner dashboard. It is written so the shadcn/ui skill can apply it to a shadcn/ui setup (see [shadcn mapping](#12-shadcnui-mapping)). Screens are in [docs/11-ui-screens.md](docs/11-ui-screens.md), components in [docs/12-ui-components.md](docs/12-ui-components.md), content and accessibility rules in [docs/13-ux-content-a11y.md](docs/13-ux-content-a11y.md). Decisions behind it are logged in [docs/08-decisions.md](docs/08-decisions.md).

## 1. Direction and fixed decisions

These come from the group and are not open for change inside this file.

- Quiet luxury. Calm, clean, trusted. Not playful, not colorful.
- Black and white, primary. The interface uses black, white and greys only.
- Light only. White background, black text, black buttons, grey scale. No dark mode, no `prefers-color-scheme: dark` styles, no `dark:` classes, no theme toggle.
- No color anywhere in the interface chrome. No gold or other accent, and no dark or moody look.
- Jewelry photographs stay in full color. They are the only color on a typical page. See [section 8](#8-imagery) and [section 9](#9-metal-and-gemstone-swatches-open-point).
- No logo yet and no known owner brand colors or fonts. See [section 3](#3-brand-name-and-wordmark).

Design consequence: with no color, hierarchy comes from size, weight, spacing, rules and photography. Status and validation need their own non-color system ([section 11](#11-status-and-validation-without-color)).

## 2. Naming rule

- The only customer-facing name is **Afable's Jewelry Store**. Use it in the wordmark, page titles, metadata, emails, chatbot greeting and error pages.
- **AURELIUS** is the research title and an internal code name only. Customers never see it. It must not appear in any rendered text, page title, metadata, alt text, email, or chatbot reply. Docs and code identifiers may use it only when they refer to the research title or the internal code name (for example `package.json`).
- Do not write "Afable's" alone or invent a short form in the interface. Use the full name, with a straight or typographic apostrophe consistently within one surface.

## 3. Brand name and wordmark

**Stand-in (now).** A plain text wordmark of "Afable's Jewelry Store" in the display typeface, weight 500, black on white, sentence-style capitalization as written, letter-spacing 0. Small caps or wide tracking are not used, so the stand-in does not look like a finished logo. On small screens the wordmark may wrap to two lines or shorten visually to "Afable's" only if the full name stays in the accessible name and the page title (open: decide with the owner).

**Replaceable by design.**

- One component, `Wordmark`, renders the brand in the header, footer, emails and sign-in screens. Nothing else hard-codes the name styling.
- The store name and tagline live in one config module (planned path `src/config/brand.ts`). Page titles and metadata read from it.
- A logo arrives as a monochrome SVG (black on transparent) plus a full-name text alternative. Swapping it means changing `Wordmark` only. Header height (64 px mobile, 72 px desktop) is fixed so a logo does not shift layout.
- If the owner supplies brand colors or fonts, that is a new decision. It must be logged in `docs/08-decisions.md` and approved by the group before any color enters the interface, because the group chose a black and white interface. Owner colors could still appear in product photography or packaging without touching the interface (open).

**Open (owner interview):** logo, brand colors, brand fonts, tagline, preferred short name.

## 4. Color tokens (black, white and greys only)

Hex values are kept as written. Every interface color is a neutral (red = green = blue). Tokens have semantic names so no component uses a raw value.

| Token      | Hex       | Use                                                                           | Contrast on white       |
| ---------- | --------- | ----------------------------------------------------------------------------- | ----------------------- |
| `white`    | `#ffffff` | Page background, cards, inputs, popovers                                      | n/a                     |
| `grey-50`  | `#fafafa` | Subtle band behind sections                                                   | 1.04:1, never text      |
| `grey-100` | `#f5f5f5` | Muted fill, photo plate, table header, skeleton                               | 1.09:1, never text      |
| `grey-200` | `#e5e5e5` | Decorative hairlines (dividers, card edges next to a photo)                   | 1.26:1, decoration only |
| `grey-300` | `#d4d4d4` | Hatch pattern lines, disabled fills                                           | 1.5:1, decoration only  |
| `grey-400` | `#a3a3a3` | Disabled text and icons only (exempt from contrast)                           | 2.5:1                   |
| `grey-500` | `#8c8c8c` | Borders of interactive controls (inputs, checkboxes, radios, outline buttons) | 3.4:1, meets 1.4.11     |
| `grey-600` | `#525252` | Secondary text, captions, helper text                                         | 7.8:1, meets AA and AAA |
| `grey-800` | `#262626` | Button hover and pressed fill                                                 | 15:1                    |
| `black`    | `#000000` | Text, primary buttons, icons, focus ring, strong borders                      | 21:1                    |

Rules:

- Do not add any token with chroma. No red for errors, no green for success, no amber for warnings, no blue for links. Links are underlined black.
- Text is black or `grey-600` only. Never use `grey-400` or lighter for text that carries meaning.
- A border that identifies a control or its state must be `grey-500` or darker. `grey-200` and `grey-300` are decoration and must never be the only boundary of an input.
- Contrast pairs: black on white 21:1; white on black 21:1; white on `grey-800` 15:1; `grey-600` on white 7.8:1; `grey-600` on `grey-100` 7.1:1. Check any new pair with a contrast tool before use (WCAG 2.2 AA: 4.5:1 text, 3:1 large text and UI parts).
- Contrast values above are calculated from the hex values, and have not yet been confirmed in a rendered build.
- Photographs may contain any color. Never place text over a photo without a solid white or black panel behind the text.

## 5. Typography

Typefaces are **not chosen**. The options below are provisional and are listed as an open decision in [section 14](#14-open-decisions). All options load through `next/font/google` (self-hosted at build time, no runtime request to Google) and are exposed as CSS variables, so a change is one file.

| Option                                | Display (headings, wordmark)             | Body and UI | Character                                                               | Notes                                                                                                 |
| ------------------------------------- | ---------------------------------------- | ----------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| A (recommended starting point)        | Cormorant Garamond                       | Inter       | Refined high-contrast serif with a clean sans. Closest to quiet luxury. | Cormorant is thin at small sizes. Use it at 24 px and above only. Check that `₱` renders (see below). |
| B                                     | Libre Caslon Display or Playfair Display | Inter       | Classic editorial serif, sturdier at mid sizes.                         | Playfair can feel heavier and more decorative.                                                        |
| C                                     | Jost (headings)                          | Jost (body) | One geometric sans family, modern and calm.                             | Fewer font files. Less "jewelry house" feel.                                                          |
| D (fallback, already in the scaffold) | Geist                                    | Geist       | Neutral sans.                                                           | Safe default if the group wants no serif.                                                             |

Technical rules (apply to every option):

- Peso amounts use the body sans with `font-variant-numeric: tabular-nums` and the `₱` sign. Confirm the chosen face contains U+20B1 (peso sign) for the `latin` subset before choosing it. If a display serif lacks it, never set prices in that face. Checked for option A on the Google Fonts files: Inter and Cormorant Garamond both contain U+20B1, but only in the `latin-ext` subset, not in `latin`, so the font setup loads both subsets (D-54 in `docs/08-decisions.md`). Not yet checked for options B to D, and not seen rendered in a browser.
- Load at most two families and only the weights used (display 500; body 400, 500, 600). Use `display: "swap"` and the `variable` option of `next/font`.
- The scaffold's current Geist fonts and the Arial fallback in `src/app/globals.css` are placeholders, replaced when the group picks an option.
- Type is English only in the interface. Filipino and Taglish appear only in chatbot replies and customer-typed text, so the chosen faces must cover the Latin set including `ñ`.

Type scale (mobile size / desktop size, line height):

| Token          | Mobile  | Desktop | Weight            | Use                                                                 |
| -------------- | ------- | ------- | ----------------- | ------------------------------------------------------------------- |
| `type-display` | 32 / 40 | 40 / 48 | 500, display face | Page hero heading, one per page                                     |
| `type-heading` | 24 / 32 | 28 / 36 | 500, display face | Section headings                                                    |
| `type-title`   | 18 / 26 | 18 / 26 | 600, sans         | Card titles, dialog titles, form section titles                     |
| `type-body`    | 16 / 26 | 16 / 26 | 400, sans         | Default text. Never below 16 px for form inputs (prevents iOS zoom) |
| `type-small`   | 14 / 22 | 14 / 22 | 400, sans         | Helper text, table cells, metadata                                  |
| `type-caption` | 12 / 18 | 12 / 18 | 500, sans         | Badge labels, legal lines. Not for instructions or errors           |

Text rules: line length 45 to 75 characters for paragraphs; left aligned, never justified; sentence case in the interface (no all caps except badge labels if tested); no italics for emphasis in the interface; text resizes to 200% without loss; do not set `letter-spacing` negative.

## 6. Spacing, radius and elevation

**Spacing.** 4 px base. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96. Component padding uses 12/16/24. Section spacing: 48 px mobile, 96 px desktop. Use `gap-*` in flex and grid, not `space-x-*` or `space-y-*` (shadcn rule).

**Controls.** Minimum touch target 44 x 44 px for every interactive element on every breakpoint (WCAG 2.5.8 requires 24 px; this system sets 44 px). Control heights: default 44 px, large 52 px (primary call to action), compact 36 px only in dense owner tables on desktop (still 24 px or more with spacing).

**Radius.** Restrained, near square, to match the quiet tone.

| Step        | Value   | Applies to                                   |
| ----------- | ------- | -------------------------------------------- |
| `none`      | 0       | Photos, photo plates, tables, page bands     |
| `sm` / `md` | 2 px    | Buttons, inputs, selects, badges, menu items |
| `lg` / `xl` | 4 px    | Cards, dialogs, popovers, sheets             |
| `2xl`       | 8 px    | Toasts, chat bubbles                         |
| `pill`      | 9999 px | Avatars only. Not used for buttons or badges |

**Elevation.** Hairline first. Surfaces are separated by 1 px borders (`grey-500` for controls, `grey-200` for decoration), not shadows.

- Level 0: flat (default for cards).
- Level 1: overlays only (popover, dropdown, dialog, sheet, toast): `0 4px 16px rgb(0 0 0 / 0.12)` plus a 1 px `grey-500` border, so the edge still shows if the shadow does not render.
- Dialog backdrop: `rgb(0 0 0 / 0.5)`.
- No glow, no inner shadow, no gradient. `--shadow-xs` is `0 0 #0000`.

## 7. Iconography

- One set: Lucide (the shadcn/ui default `iconLibrary`). Do not mix sets and do not use emoji.
- Monochrome. Icons take `currentColor` (black or `grey-600`). Stroke 1.5 px, 20 px in controls and 16 px inline with small text (sized by the component, not with `size-*` on icons inside shadcn components).
- An icon never stands alone as the only carrier of meaning. Icon-only buttons need an accessible name (`aria-label`) and a tooltip on pointer devices. Status icons always sit beside a text label.
- Decorative icons get `aria-hidden="true"`.
- The ring viewer's measurement and control icons follow the same set. Where Lucide has no suitable glyph, draw a custom 24 px SVG in the same stroke and keep it monochrome.

## 8. Imagery

Product photographs stay in full color; everything around them is neutral.

**Display rules**

- Product grid and detail photos: `4:5` portrait; hero: `16:9` desktop and `4:5` mobile crop; thumbnails `1:1`. Plate behind a photo is `grey-100`.
- Use `next/image` with explicit `sizes`, `priority` only for the first hero, lazy loading otherwise, and a `grey-100` placeholder.
- No filters, desaturation, duotone, overlays, borders in color, or text on photos. No captions under photos (the page's own text carries the name and price); credits for stand-ins go in one footer line.
- Every photo has meaningful alt text describing the piece ("Plain gold band ring on a grey surface"). Pure decoration gets `alt=""`.
- Show the jewelry large, on neutral or natural backgrounds. Prefer photos with a plain background so the black and white interface does not compete.

**Stand-ins (now).** There are no owner photos and the owner data file is empty (see [docs/09-owner-data.md](docs/09-owner-data.md)). Screens use licensed stand-in photographs, or grey plates with a text label ("Photo to come") where none is chosen.

- **No photo files are added by the task that wrote this file.** Stand-in photos are added later, one reviewed change at a time.
- Allowed sources: images with a license that permits commercial use on a website without attribution being the only condition, or that the group has licensed. Read the license on the day of download; do not assume. Do not use images scraped from reference sites, from Pandora, Cartier, Taylor & Hart, Brilliant Earth or Blue Nile, or from search results.
- Name files `standin-<slug>.<ext>` under `public/images/stand-in/` so they are easy to find.
- **Source and license tracking rule.** No stand-in file may be committed without a row in `public/images/stand-in/SOURCES.md`, created with the first photo. Columns: file name, page or fixture that uses it, source URL, photographer or author, license name and URL, date downloaded, date license checked, who approved, replaced by (blank until replaced). A review rejects any stand-in without a row.
- **Replacement checklist** (after the owner interview, when the owner provides real photos):
  1. Confirm the owner owns the photos and agrees in writing that the store may use them (note it in `docs/09-owner-data.md`).
  2. Photograph or crop to the ratios above, on a plain background, in consistent light.
  3. Export, name `<product-slug>-<n>.<ext>`, and keep originals outside the repo if large.
  4. Replace the file or fixture reference, update alt text to describe the real piece, and remove the stand-in file and its `SOURCES.md` row (or mark "replaced by").
  5. Search the repo for `standin-` and confirm no customer-visible page still uses one.
  6. Check that no stand-in implies a product the store does not sell.
- Until replaced, do not describe a stand-in as the store's own piece. Do not show a stand-in next to a real price in production. Fixture-only screens may, because they are not live.

## 9. Metal and gemstone swatches (open point)

**Open point, marked for the user.** Swatches in the ring viewer (metal) and gemstone pickers are product representation, not interface color. The decision on whether swatches may show color is not made here.

Reasoning:

- If swatches are greyscale only, the customer cannot tell yellow gold from rose gold or white gold, or see a gemstone's hue. That harms the purpose of the custom flow and the 3D scene, which already shows materials in color.
- The group's rule is "no color in the interface; photos stay in color". Swatches sit between the two: they are small representations of the product, like a photo.
- Risk: colored chips next to a black and white interface may read as "interface color" and weaken the calm look.

Recommended default (needs the user's yes or no): **allow color inside the swatch chip and the 3D scene only**, in the chip's fill, in small circular or square chips, with a 1 px `grey-500` border and a 2 px black selected ring plus a check icon. All other parts of the picker stay neutral. Alternative: monochrome texture swatches (hatches and tones) with text names, which loses the metal hue.

Rules that hold under either choice:

- The name of the metal or stone is always visible text ("Yellow gold", "Rose gold", "White gold"), not only a chip.
- Selection shows by ring, check icon and `aria-checked`, not by color.
- The chip is never used to carry status, price change or validation.
- The 3D scene itself is the product view and uses real material colors. Its surroundings (background, floor, lights) are neutral grey and white.

## 10. Layout, grid and responsive rules

**Mobile first, 360 px minimum.** Write base styles for 360 px and add breakpoints upward. The design target is 360 px wide. The page must also reflow without horizontal scrolling at 320 CSS px (WCAG 1.4.10), except for the ring viewer canvas and data tables that scroll inside their own region.

| Breakpoint | Min width | Columns | Page margin                | Gutter |
| ---------- | --------- | ------- | -------------------------- | ------ |
| base       | 360       | 4       | 16                         | 16     |
| `sm`       | 640       | 4       | 24                         | 16     |
| `md`       | 768       | 8       | 32                         | 24     |
| `lg`       | 1024      | 12      | 32                         | 24     |
| `xl`       | 1280      | 12      | 48, content max width 1280 | 24     |

- Content max width 1280 px; reading width 680 px for text pages and quotation text.
- Default page structure: header (wordmark, navigation, account link), main, footer. There is no cart or payment gateway (see decisions), so there is no cart icon.
- Product grids: 2 columns at base, 3 at `md`, 4 at `lg`. Photos fill the column.
- Owner dashboard: single column at base with a bottom or top navigation sheet; side navigation from `lg`. Tables turn into stacked cards at base (no horizontal scrolling for primary data). The pending-actions count sits in the header on every size.
- Ring viewer: the canvas is full width on mobile, 4:3 or taller, above the option picker; from `lg`, canvas left (7 columns) and options right (5 columns). The viewer must not trap scrolling on touch: single finger scrolls the page unless the user taps "Rotate" (see components doc). A WebGL fallback is a static image set with the same option picker.
- Sticky header and sticky action bars must not hide the focused element (WCAG 2.4.11). Use `scroll-padding-top` equal to the header height.
- Text never relies on hover. Every hover behavior has a focus and tap equivalent.
- Orientation: do not lock orientation. Support zoom; do not set `maximum-scale`.

## 11. Status and validation without color

Because the interface has no color, status and validation cannot use red, green or amber. Every state is carried by **a text label always, plus an icon, a border style, a weight and a fill pattern**. Any one of these alone is enough to tell states apart, so a user who cannot see the icon, or who uses high contrast mode, still gets the meaning from the text.

**Six status classes.** Specific statuses from [docs/04-flowcharts.md](docs/04-flowcharts.md) map to a class in [docs/12-ui-components.md](docs/12-ui-components.md).

| Class       | For                                                                                    | Label                                              | Icon (Lucide)                                                          | Border                                                                   | Weight            | Fill                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------- |
| Neutral     | Draft, Placed, Submitted, Under review                                                 | Text of the status                                 | `circle`                                                               | 1 px solid `grey-500`                                                    | 500               | White                                                                                                      |
| In progress | Confirmed, In production, In progress, Payment submitted                               | Text                                               | `loader` or `circle-dot`                                               | 1 px solid black                                                         | 500               | `grey-100`                                                                                                 |
| Pending     | Pending verification, Return pending, Quotation issued (awaiting reply)                | Text, prefixed "Waiting:" where it reads naturally | `clock`                                                                | 1 px **dashed** black                                                    | 500               | White                                                                                                      |
| Complete    | Verified, Payment verified, Quotation accepted, Completed, Ready for claiming, Claimed | Text                                               | `check` or `circle-check`                                              | 1 px solid black                                                         | 600               | **Black fill, white text**                                                                                 |
| Attention   | Unclaimed, Quotation declined, expiring soon                                           | Text                                               | `triangle-alert`                                                       | **2 px solid** black                                                     | 600               | White, with a 4 px black left bar in cards                                                                 |
| Stopped     | Rejected (with reason), Cancelled, Expired                                             | Text                                               | `octagon-x` for Rejected, `ban` for Cancelled, `hourglass` for Expired | 2 px **double** or 2 px solid black; Expired uses 1 px dotted `grey-600` | 600 (Expired 500) | Rejected and Cancelled: diagonal hatch `grey-300` lines on white. Expired: `grey-100` with `grey-600` text |

Notes:

- Rejected must always show its reason next to the label. Expired shows the date it ended.
- Complete is the only class with a black fill, so "done" is the strongest-looking state. Attention and Stopped carry the heaviest border instead.
- Badge text stays 12 to 14 px, weight as in the table, and keeps 4.5:1 contrast (black on white, white on black, `grey-600` on `grey-100`).
- Timelines (order, service, ready-made) mark steps as done (filled black dot with check), current (2 px ring with `aria-current="step"`), and upcoming (hollow `grey-500` dot), and always label each step in text with its date or "Not yet".
- A status change is announced in a polite live region ("Payment proof verified"). Do not announce on first render.

**Focus indicator (WCAG 2.4.7, 1.4.11, 2.4.11).** All focusable elements show a 2 px solid black outline with a 2 px white gap (`outline: 2px solid #000; outline-offset: 2px`) plus a 2 px white outer ring (`box-shadow: 0 0 0 4px #fff`) so it is visible on white, grey, photos and black buttons. Use `:focus-visible`. Never remove an outline without replacement. The indicator is at least 3:1 against every adjacent surface and is not clipped by overflow. Keyboard focus is never hidden under sticky bars.

**Form validation (WCAG 3.3.1, 3.3.3, 3.3.4, 3.3.7, 1.3.1, 4.1.3).**

- Labels are always visible above the control (not placeholders). Required fields say "(required)" in text; optional fields say "(optional)". Do not use only an asterisk.
- Error state: the control border changes from 1 px `grey-500` to **2 px solid black**; a `circle-alert` icon and the text "Error:" start the message below the field; message in black, weight 600, `type-small`. The message states what is wrong and how to fix it, for example "Error: Enter a mobile number with 11 digits, like 09171234567." Control has `aria-invalid="true"` and `aria-describedby` to the message (shadcn `Field data-invalid`).
- On submit with errors, an error summary at the top of the form (an `Alert`, `role="alert"`, heading "There is a problem", a list of links to each invalid field) receives focus, and the first invalid field is reachable in one tab.
- Do not clear what the user typed. Do not ask for the same information twice in one flow (3.3.7); prefill from the profile.
- Submitting an order request, accepting a quotation, uploading proof and any other action that creates a commitment has a review step and a confirm step (3.3.4). The chatbot saves a Draft only; submitting needs a second explicit confirmation.
- Success: icon `circle-check`, text "Saved" or similar, in an element with `role="status"`. Not a toast alone.
- Warning: `triangle-alert` icon, 2 px border, "Check before you continue:".
- Disabled controls use `grey-400` text, a dashed `grey-300` border and the `disabled` attribute with an adjacent reason where the user may wonder why ("Upload a proof first").
- Loading: `Skeleton` blocks in `grey-100` plus a visually hidden "Loading" status; spinners always have a text label.
- Toasts duplicate information shown inline and persist at least 8 seconds with a close button. They are never the only record of an error.
- Sign-in and recovery avoid cognitive tests and allow paste and password managers (3.3.8).

**Selected and current states.** Selected option: 2 px black border plus a check icon plus `aria-checked`/`aria-pressed`; current page in navigation: underline plus `aria-current="page"`; hover: underline or `grey-100` wash; pressed button: `grey-800` fill.

## 12. shadcn/ui mapping

For the shadcn/ui skill. Edit only the Tailwind CSS entry file (`src/app/globals.css`). Keep hex values. Components are in the project's chosen `base` (read it from `npx shadcn@latest info --json`; do not assume).

**Preset or style.** Geometry closest to this system: near-square, hairline borders, restrained density, like the `lyra` or `vega` presets with the radius overrides below. The skill must confirm by reading the generated component classes, not assume. Use the project's `info` output to decide `asChild` or `render`.

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #000000;
  --card: #ffffff;
  --card-foreground: #000000;
  --popover: #ffffff;
  --popover-foreground: #000000;
  --primary: #000000;
  --primary-foreground: #ffffff;
  --primary-active: #262626;
  --secondary: #f5f5f5;
  --secondary-foreground: #000000;
  --muted: #f5f5f5;
  --muted-foreground: #525252;
  --accent: #f5f5f5;
  --accent-foreground: #000000;
  --destructive: #000000; /* no red: errors use border, icon, label (section 11) */
  --border: #e5e5e5; /* decoration */
  --input: #8c8c8c; /* control borders, 3:1 or more */
  --ring: #000000;
  --chart-1: #000000;
  --chart-2: #525252;
  --chart-3: #8c8c8c;
  --chart-4: #d4d4d4;
  --chart-5: #f5f5f5;
  --sidebar: #ffffff;
  --sidebar-foreground: #000000;
  --sidebar-primary: #000000;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #f5f5f5;
  --sidebar-accent-foreground: #000000;
  --sidebar-border: #e5e5e5;
  --sidebar-ring: #000000;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary-active: var(--primary-active);
  /* ... one --color-* line per variable above ... */
  --radius-sm: 2px;
  --radius-md: 2px;
  --radius-lg: 4px;
  --radius-xl: 4px;
  --radius-2xl: 8px;
  --radius-3xl: 8px;
  --radius-4xl: 4px; /* badges are not pills in this system */
  --font-sans: var(--font-body); /* set by next/font */
  --font-heading: var(--font-body); /* small titles stay sans */
  --font-display: var(--font-display); /* headings, wordmark */
}

@theme {
  --shadow-xs: 0 0 #0000;
  --shadow-sm: 0 0 #0000;
  --shadow-lg: 0 4px 16px rgb(0 0 0 / 0.12);
}
```

Rules for the skill:

- **No dark mode.** Do not generate a `.dark` block, `@custom-variant dark`, or `dark:` classes. Remove the `prefers-color-scheme: dark` block that the scaffold's `globals.css` currently contains.
- Use semantic tokens only (`bg-primary`, `text-muted-foreground`, `border-input`). Never raw Tailwind colors (`bg-red-500`, `text-green-600`).
- `--destructive` equals black on purpose. The skill must not style destructive actions red. A destructive button is an outline button with a `trash-2` icon and the verb in the label, and it opens an `AlertDialog` to confirm.
- Status badges are a `Badge` with variants `neutral`, `progress`, `pending`, `complete`, `attention`, `stopped` implemented as in section 11 (variants live in the Badge component, not in `className` at call sites).
- Forms use `FieldGroup`, `Field`, `FieldLabel`, `FieldDescription`, `data-invalid` and `aria-invalid`, as in section 11.
- Focus: a global `:focus-visible` rule (section 11), applied through `--ring` and `ring-*` utilities, never removed.
- Type scale: define `type-*` utilities from section 5 instead of `--text-*` theme keys.
- Wire fonts with `next/font`, not Fontsource, because this is a Next.js project that already uses `next/font`.
- Components to install first: `button`, `input`, `textarea`, `select`, `checkbox`, `radio-group`, `toggle-group`, `field`, `label`, `card`, `badge`, `alert`, `alert-dialog`, `dialog`, `sheet`, `tabs`, `table`, `separator`, `skeleton`, `tooltip`, `sonner` or `toast` (per base), `empty`, `breadcrumb`, `navigation-menu`, `avatar`. Add others only when a screen needs them.
- Do not add Prisma, Supabase, Three.js or Playwright from this file. They are planned separately in [docs/05-tech-stack.md](docs/05-tech-stack.md).

## 13. Component styling rules

| Component                            | Rule                                                                                                                                                                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button, primary                      | Black fill, white text, 44 px high (52 px for the main call to action), 2 px radius, hover `grey-800`, pressed `grey-800` plus 1 px inset, label is a verb ("Request a quotation"). One primary per view.                                                                                               |
| Button, secondary                    | White fill, 1 px black border, black text.                                                                                                                                                                                                                                                              |
| Button, ghost and link               | Text with underline on hover and always for inline links.                                                                                                                                                                                                                                               |
| Button, loading                      | Spinner plus label ("Saving...") and `disabled`. No `isLoading` prop.                                                                                                                                                                                                                                   |
| Input, textarea, select              | White fill, 1 px `grey-500` border, 2 px radius, 44 px high, 16 px text, visible label above. Focus: global focus indicator. Error: section 11.                                                                                                                                                         |
| Checkbox, radio, switch              | 24 px control (minimum), `grey-500` border, black fill with white check when on, label is clickable.                                                                                                                                                                                                    |
| Toggle group (option sets of 2 to 7) | Segmented buttons. Selected: black fill, white text, check icon. Used for ring style (plain band, solitaire, side stones), and similar.                                                                                                                                                                 |
| Card                                 | White, 1 px `grey-200` border, 4 px radius, no shadow, 16 px mobile and 24 px desktop padding. Full composition (`CardHeader`, `CardTitle`, `CardContent`, `CardFooter`).                                                                                                                               |
| Product card                         | Photo on top (4:5), name in `type-title`, price in body sans tabular, status or availability badge below, whole card is one link with visible focus.                                                                                                                                                    |
| Badge                                | Section 11 classes. 2 px radius, 12 to 14 px, icon plus text, never icon only.                                                                                                                                                                                                                          |
| Alert                                | 1 px border, icon and heading text; `role="alert"` for errors, `role="status"` for information. Variants follow section 11 classes.                                                                                                                                                                     |
| Dialog, sheet, alert dialog          | White, 4 px radius, level 1 shadow, backdrop `rgb(0 0 0 / 0.5)`, always a title, focus trapped and returned, close with Escape and a labelled close button. Bottom sheet on mobile for pickers.                                                                                                         |
| Table (owner)                        | White, `grey-100` header, 1 px `grey-200` row rules, 14 px text, sortable headers are buttons with an arrow icon and `aria-sort`. At base width, rows become stacked cards.                                                                                                                             |
| Tabs                                 | Underline style: 2 px black underline for selected plus `font-weight: 600`.                                                                                                                                                                                                                             |
| Timeline                             | Vertical on mobile, can be horizontal from `lg` for up to 6 steps. Section 11 for the dots.                                                                                                                                                                                                             |
| Toast                                | Level 1 shadow, icon and text, 8 s or more, close button. Never sole feedback.                                                                                                                                                                                                                          |
| Skeleton                             | `grey-100` block. Slow pulse only if `prefers-reduced-motion: no-preference`.                                                                                                                                                                                                                           |
| Empty state                          | `Empty` component: icon in `grey-600`, a sentence saying what is missing, one next action.                                                                                                                                                                                                              |
| Chat panel                           | Customer messages: black fill, white text, right. Assistant messages: white, 1 px `grey-500` border, left. Both 2xl radius and a visible speaker label ("You", "Assistant") for screen readers and low vision. Draft summaries are a bordered `Card` with Confirm and Edit buttons. See components doc. |
| Ring viewer controls                 | 44 px icon buttons with labels, keyboard operable (arrows rotate, `+` and `-` zoom, `0` reset), "Rotate" toggle for touch, text alternative of the current configuration beside the canvas.                                                                                                             |
| Quotation page                       | Reading width, itemized table, rate snapshot and payment account in bordered blocks with headings, estimate wording never shows "total" before the quotation exists.                                                                                                                                    |

## 14. Open decisions

Each is open and must not be resolved silently.

| Open item                                                       | Provisional state                                                                                                          | Who decides                          |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Typefaces                                                       | Option A (Cormorant Garamond with Inter) as a starting point; options B to D listed in section 5. Check peso sign support. | Group, then owner                    |
| Logo and wordmark treatment                                     | Plain text wordmark                                                                                                        | Owner interview                      |
| Owner brand colors and fonts                                    | None known. Any color would reopen the black and white decision                                                            | Group and owner                      |
| Swatch color                                                    | Recommended: color inside swatch chips and 3D scene only                                                                   | User                                 |
| Short name on small screens                                     | Full name                                                                                                                  | Owner interview                      |
| Which jewelry sells most (drives homepage and product emphasis) | Unknown                                                                                                                    | Owner interview                      |
| Stand-in photo sources                                          | None chosen. No files added                                                                                                | Group                                |
| shadcn preset geometry                                          | `base-lyra` (Base UI) with the radius, height and state overrides in `globals.css`. Provisional, see D-54                  | Group, confirmed in a browser review |

## 15. Motion

Calm and short. Motion confirms an action; it does not decorate.

- Durations: 150 ms for hover, focus and press; 200 to 250 ms for dialogs, sheets and menus. Easing: `ease-out` for entering, `ease-in` for leaving.
- Allowed: opacity and small translate (8 px at most), photo zoom 1.02 inside its frame on hover, underline draw on links.
- Not allowed: parallax, auto-playing carousels, timed tabs, tilt, bounce, looping animation, scroll-jacking, and full-screen intros.
- The ring viewer may show a slow initial rotation of at most one turn, once, and never loops.
- `prefers-reduced-motion: reduce`: remove translate and zoom, keep opacity fades at 100 ms or less, stop any rotation in the viewer, and do not pulse skeletons.
- Anything that moves for more than 5 seconds has a pause control (WCAG 2.2.2). Nothing flashes more than three times a second.
- No motion on status change except the live-region announcement. Keep layout stable while images load (reserve space with the aspect ratio).

## 16. Voice and tone

- Quiet luxury: calm, plain, warm and exact. Short sentences. No exclamation marks, no emoji, no slang, no hype ("amazing", "stunning").
- Say what the thing is and what happens next. "Your quotation is ready. Review it and accept or decline." not "Great news!".
- Plain English only in the interface. The chatbot may reply in the customer's language (English, Filipino or Taglish) but the interface around it stays English.
- Estimates are never presented as final prices. Wording is "Estimate" until a quotation exists; the final price exists only in the quotation.
- Errors say what went wrong and how to fix it, without blame ("We could not read that file. Upload a JPG or PNG under 5 MB.").
- Respect around money and trust: show the refund policy and unclaimed policy in plain words where the customer decides.
- Address the customer as "you". Refer to the business as "we" or "Afable's Jewelry Store" and never as AURELIUS.
- Full microcopy and content rules: [docs/13-ux-content-a11y.md](docs/13-ux-content-a11y.md).

## 17. Reference-site patterns (own words)

These are patterns worth following in spirit, summarized in my own words from general familiarity, not copied. They were not re-checked live for this version; see the not-verified list kept with the task notes.

- **Pandora, Cartier.** Large, uncluttered product photography on plain backgrounds; generous white space; a short, clear navigation by category or collection; product pages with one dominant image, a clear price and one obvious next step; quiet footer with service information. Take the restraint and the confident use of space. Do not take their brand colors, imagery, copy, icons or layouts.
- **Taylor & Hart (custom ring flow).** A guided, stepwise builder: choose a style, then stone, then metal and details, with the running choice always visible and a final review before inquiry. Take the stepwise order, the visible summary and the review step. Our flow differs: the viewer is procedural, there is no checkout, and the final price appears only in the quotation.
- **Brilliant Earth, Blue Nile.** Education beside choice: short explanations of stones and metals next to the picker, and comparison with filters. Take plain explanations and filters that can be cleared in one action. Avoid dense filter walls on mobile; use a sheet.

Do not copy any site's design, text, icons or images. Do not hot-link or screenshot them into the repository.

## 18. Review checklist for this file's rules

- Color: every token is neutral; no `dark:` classes; no raw Tailwind colors.
- Naming: no "AURELIUS" in rendered text, titles or metadata.
- Photos: each stand-in has a `SOURCES.md` row; none implies an owner product.
- Status: every status shows text plus icon plus border and weight difference.
- Focus: visible on every interactive element, not hidden by sticky bars.
- Targets: 44 px on touch; layout holds at 360 px and reflows at 320 px.
- Forms: visible labels, error summary, inline errors with "Error:" text.
- Motion: reduced-motion handled; no auto-playing media.

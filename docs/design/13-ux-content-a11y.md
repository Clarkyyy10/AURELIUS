# UX Content and Accessibility

Rules for the words in the interface, the chatbot's voice, small-screen behavior, keyboard and screen reader support, and the review checklist. The visual system is in [DESIGN.md](../DESIGN.md). Screens are in [11-ui-screens.md](11-ui-screens.md). Components are in [12-ui-components.md](12-ui-components.md). Requirements are in [01-requirements.md](01-requirements.md) and decisions in [08-decisions.md](08-decisions.md).

Status: draft. Items that depend on the owner interview or on a user decision are marked **Open**.

## 1. Naming rule

- Customers see "Afable's Jewelry Store" only. Page titles, metadata, emails, chat greetings, error pages and alt text use that name.
- AURELIUS is the research title and an internal code name. It does not appear in any customer-facing string. See [DESIGN.md section 2](../DESIGN.md#2-naming-rule).
- Wrap the store name in `translate="no"` so browser translation does not alter it. Use a non-breaking space where a line break would split it.

## 2. Microcopy rules

These rules serve the Usability NFR: "The interface and chatbot use clear, plain English. Error messages state what went wrong and how to correct it." The NFR's measure is a review checklist, which is section 9 below.

### 2.1 Voice

- Plain English. Short sentences, one idea each. Aim for a reading level a high school student follows without effort.
- Calm and exact. No exclamation marks, no emoji, no slang, no hype words ("amazing", "stunning").
- Active voice. Address the customer as "you". Refer to the business as "we" or "Afable's Jewelry Store".
- Use the words the store uses: "quotation", "claim code", "ready for claiming", "down payment". Use one term per concept across all screens (for example always "quotation", never "quote" in one place and "price offer" in another).
- Numerals for counts ("3 items"). Money with the peso sign and `Intl.NumberFormat` ("₱12,500"). Dates with `Intl.DateTimeFormat` in the store's time zone, with the time zone not shown unless it differs.
- Real ellipsis "…" and curly quotes. Loading text ends with "…" ("Loading…", "Saving…").
- Capitalization: sentence case for headings, buttons and labels, as set in DESIGN.md. This differs from the web-design-guidelines Title Case rule; DESIGN.md wins (see the skill conflicts section of the task notes).

### 2.2 Buttons and links

- A button label is a verb phrase that says what happens: "Request a quotation", "Save as draft", "Upload proof of payment". Not "Submit", "OK", "Continue" or "Click here".
- Link text makes sense out of context ("View order 1042"), not "here" or "more".
- A destructive or commitment action names the object: "Cancel this order". Its confirm step repeats what will happen and what cannot be undone.
- Icon-only buttons are avoided. Where one exists, it has an `aria-label` and a visible tooltip.

### 2.3 Error messages

Every error message has three parts, in this order:

1. **What went wrong**, in the user's terms.
2. **How to fix it**, as one action.
3. **What was kept**, when it matters ("Your design is still saved").

Rules:

- Start inline field errors with the text "Error:" (non-color signal, DESIGN.md section 11).
- No blame ("You entered…"). No codes or stack text. No "Invalid input", "Something went wrong" or "Oops".
- Say the rule, not only the failure: "Use a JPG, PNG or PDF file under 5 MB." not "File not allowed".
- Never reveal whether an email has an account on sign-in or reset screens ("If this email has an account, we sent a link").
- Server errors show a plain message and a way forward: "We could not save this. Your changes are still on this page. Try again in a moment, or contact the store."
- A permission error states the reason and the next step: "This page is for the store owner. Go back to your orders."
- Keep the same wording in the form, the error summary and the live region.

| Situation                 | Message                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| Required field empty      | "Error: Enter your full name."                                                                        |
| Mobile number format      | "Error: Enter a mobile number with 11 digits, like 09171234567."                                      |
| Email format              | "Error: Enter an email address like name@example.com."                                                |
| Password too short        | "Error: Use at least 8 characters."                                                                   |
| Proof file wrong type     | "Error: Upload a JPG, PNG or PDF file."                                                               |
| Proof file too large      | "Error: This file is over 5 MB. Choose a smaller file or take a new photo."                           |
| Reference number reused   | "Error: This reference number was already used on another payment. Check the number on your receipt." |
| Too many sign-in attempts | "Too many attempts. Try again in 15 minutes."                                                         |
| Session ended             | "You were signed out because the page was idle. Sign in again. Your draft is saved."                  |
| Quotation expired         | "This quotation ended on `<date>`. Ask the store for a new one."                                      |
| Item no longer available  | "This item is no longer available. Choose another item or ask the store."                             |
| WebGL unavailable         | "The 3D view does not work on this device. You can still choose your options below."                  |
| Network lost              | "You are offline. We will try again when you reconnect. Nothing was sent."                            |

The sign-in lockout (15 minutes after 5 failed attempts) and session length (30 minutes) come from the Security NFRs. The owner session length is **Open** (N68).

### 2.4 Other content patterns

- **Empty states** say what is missing and the next step: "You have no orders yet. Browse the catalog." Never a blank area.
- **Success** says what was saved and what happens next: "Payment proof received. The store will check it. You will see the result here." Shown inline with `role="status"`, not in a toast alone.
- **Pending and waiting** states name who acts next ("Waiting for the store to verify").
- **Money and estimates.** Before a quotation exists, any number is labeled "Estimate" and says it can change. The final price exists only in the quotation page. Never write "Total", "Price" or "You pay" next to an estimate. Preferred: "Estimate: ₱12,000 to ₱14,000. The final price is in your quotation."
- **Dates for completion.** Do not show a completion date as final before the owner sets one. Use "Estimated" only if the owner enters it, and label it as set by the store.
- **Policy text.** The refund policy and the unclaimed-item policy appear in plain words on the quotation page, before acceptance. Their wording is **Open** (owner interview). Placeholders say "Policy to be confirmed by the store" and must not ship.
- **Confirmation dialogs** state the object, the effect and the label of the action, with a cancel that returns focus to the trigger.
- **Placeholders** show an example and end with "…". They never replace labels.
- **Long text.** Names, notes and product titles may be very short or very long. Containers wrap or truncate with `title`-free accessible full text, and flex children use `min-w-0`.

## 3. Chatbot voice

The chatbot's rules come from FR-35 to FR-40, D-16, D-17 and D-18.

### 3.1 Language

- It replies in the language the customer wrote in: English, Filipino or Taglish. If the customer switches, it follows. If unclear, it uses English.
- The interface around the chat stays English: labels, buttons, the draft summary field names, status badges, error messages and system messages. The assistant never translates the interface.
- Replies keep the quiet luxury tone: polite, short, calm. In Filipino, use respectful forms ("po", "opo") only if the customer does. No slang or jokes.
- The store name and product names stay as written. Quote prices and options exactly as stored.
- The NFR table's current Usability row says Filipino and Taglish input is outside scope. That row is superseded by N39 and N40 (see "Pending NFR changes" in 01-requirements.md). This document follows the decision.

### 3.2 What it must never do

- Never present an estimate as a final price or a completion date (Functional Suitability NFR: 0 responses may do this). The only final price is in the quotation.
- Never invent products, prices, stock, hours or policies. It answers only from the store's current data. If the data is missing it says so and refers the customer to the owner.
- Never promise approval, availability or a quotation outcome.
- Never take payment details or ask for passwords, card numbers or ID numbers.
- Never generate or alter geometry. It fills only the owner's configured options (D-17).
- Never submit anything. It saves a Draft only after the customer presses "Save as draft". Submitting needs a second, explicit customer action in the interface (D-16). A typed "yes" or "submit" in chat is not enough (proposal; flagged **Open**, see docs/12 section 15).
- Out-of-scope questions are referred to the owner (100% in the NFR). Say what it cannot help with and how to reach the store.

### 3.3 Reply patterns

| Case                              | Pattern                                                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Price question before a quotation | "I can give an estimate only. The final price is in your quotation after the store reviews your request." Then offer the estimate, labeled "Estimate". |
| Unsupported piece                 | "The online designer covers rings only. Ask the store about other pieces."                                                                             |
| Missing data                      | "I do not have that information. Please contact the store."                                                                                            |
| Draft ready                       | "Here is your draft. Check it, then choose Save as draft. Nothing is sent to the store yet."                                                           |
| After save                        | "Your draft is saved. The store has not been notified. You can edit it or submit it when you are ready."                                               |
| Rate limit or length              | Use the system messages in docs/12 section 10.2. Numbers **Open** (N54).                                                                               |

### 3.4 Chat accessibility

- Each message has a visible speaker label ("You", "Assistant") and a time.
- New assistant messages are announced politely (`aria-live="polite"` on the thread region), one announcement per message, without re-reading the whole thread.
- Focus does not jump into the thread when a reply arrives. After the customer sends, focus stays in the input.
- The draft summary card and its buttons are reachable by keyboard in thread order. Escape closes the panel and returns focus to the launcher.
- The typing indicator is text ("Afable's assistant is replying"), not only animation.

## 4. Mobile-first rules at 360 px

The Compatibility NFR requires every customer and owner workflow to be completable at 360 px wide or larger. DESIGN.md section 10 holds the layout rules. Content and behavior rules here:

- Write base styles for 360 px, then add breakpoints upward. Test at 360 × 640 and also at 320 CSS px for reflow (WCAG 1.4.10): no horizontal scrolling except for the data tables and the 3D canvas, which scroll or reflow inside their own container.
- Touch targets at least 44 × 44 px with at least 8 px between neighbors (WCAG 2.5.8 sets 24 px; this project is stricter).
- Body text at least 16 px. Form inputs 16 px so iOS does not zoom on focus. Never use `user-scalable=no` or `maximum-scale=1`. Text must resize to 200% without loss.
- One column. Primary action visible without scrolling on form steps, or in a sticky bottom bar that never covers the focused field (WCAG 2.4.11). Use `scroll-padding` for sticky elements.
- Filters, option pickers and the chat open as sheets on mobile. Sheets trap focus, set `overscroll-behavior: contain`, and have a visible close button.
- Tables turn into stacked cards with visible labels at narrow widths. Owner queues keep status, customer name and next action visible without side scrolling.
- Use `inputmode`, `type` and `autocomplete` correctly: `type="email"`, `type="tel"` with `inputmode="numeric"` for mobile numbers, `autocomplete="name"`, `"email"`, `"tel"`, `"new-password"`, `"current-password"`, `"one-time-code"` for the TOTP code. Disable spellcheck on codes, emails and reference numbers. Never block paste.
- Safe areas: full-bleed bars use `env(safe-area-inset-*)`.
- Gestures need alternatives. The ring viewer's drag and pinch have buttons for rotate, zoom and reset (DESIGN.md section 13). Swipe is never the only way to act.
- Payment proof upload works from the camera and the file picker (`accept="image/jpeg,image/png,application/pdf"`).
- Page weight and speed: the Performance NFR sets 3 s on broadband and 5 s on 4G for standard pages. Keep the 3D viewer code out of those pages until needed (section 8).
- Safari, Chrome, Edge and Firefox, current and previous major version, are test targets (Compatibility NFR).

## 5. Keyboard rules

- Everything that works with a mouse or touch works with a keyboard alone. No keyboard traps (WCAG 2.1.2).
- Tab order follows reading order. Do not use positive `tabindex`.
- A **skip link** "Skip to main content" is the first focusable element. Each page has one `main`, a `nav` with a label, and a `footer`.
- Use `button` for actions and `a` (or `Link`) for navigation. No `div` or `span` with click handlers.
- Focus indicator: use the global indicator in DESIGN.md section 11 (2 px black outline, 2 px offset, white outer ring). Use `:focus-visible`. Never `outline: none` without a replacement. Use `:focus-within` for compound controls.
- Dialogs and sheets: focus moves in on open, is trapped while open, Escape closes, focus returns to the trigger. Use the shadcn components that do this; do not rebuild them.
- After a route change, move focus to the page heading or `main` so keyboard and screen reader users start at the top of the new content.
- After an action that removes the focused element (delete, close), move focus to a logical neighbor.
- Standard keys: Enter and Space for buttons, arrow keys inside radio groups, tabs, menus and the swatch pickers (roving tabindex), Escape to dismiss.
- Ring viewer: arrows rotate, `+` and `-` zoom, `0` resets (docs/12 section 5). The canvas has a visible focus indicator and an accessible name. Every option available in the viewer is also reachable in the option pickers outside the canvas.
- Autofocus is used only for the first field of sign-in on desktop. Not on mobile and not elsewhere.
- Do not change context on focus or on input alone (WCAG 3.2.1, 3.2.2). Selecting an option updates the preview but does not submit.
- Warn before leaving a form with unsaved changes. Destructive actions need a confirm step or an undo window.

## 6. Screen reader rules

- Semantic HTML first, ARIA only to fill gaps. A native element beats a role.
- One `h1` per page, headings in order without skipping levels. Landmarks: `header`, `nav`, `main`, `footer`, with labels when more than one `nav`.
- Page `title` is unique: "Orders – Afable's Jewelry Store". Set `lang="en"` on `html`. Chatbot messages in Filipino may carry `lang="fil"` on the message element so the screen reader switches voice; Taglish stays `lang="en"` unless a block is clearly Filipino (**Open**, unverified with real screen readers).
- Every form control has a visible `label` tied by `htmlFor`. Group related controls in `fieldset` and `legend` (option pickers, payment method). Required and optional are in the label text.
- Errors: `aria-invalid="true"` and `aria-describedby` pointing at the message. On submit with errors, focus moves to the error summary, which links to each field.
- Status changes (payment verified, order moved, draft saved) are announced in a polite live region (`role="status"`). Urgent blocking errors use `role="alert"`. Do not announce on first render. Do not use a live region for every keystroke.
- **Status is text.** Every badge includes its label as text. Icons are `aria-hidden="true"`. The border, weight and fill are extra cues, never the only cue. A timeline is an ordered list. The current step has `aria-current="step"`. Each step reads its label, its state and its date or "Not yet".
- Images: informative images have specific alt text (what the piece is: "Ring, 18k yellow gold, one round diamond"). Decorative images have `alt=""`. Stand-in photos do not claim to be an owner product. Do not put captions under images unless they add information.
- The ring viewer canvas has a text alternative that updates with the options: metal, stone, size, style, and the estimate labeled "Estimate". Provide it next to the canvas as normal text, not in the drei `Html` component.
- Icon-only controls have an `aria-label`. Tooltips are not the only name.
- Claim code display: the code is real text (not an image), readable as characters, with a "Copy" button that announces "Copied". Do not read it aloud automatically.
- Tables use `th` with `scope`, a `caption`, and no layout tables. Sortable headers use `aria-sort`.
- Loading: a visually hidden "Loading…" status. Skeletons are `aria-hidden`.
- Toasts duplicate inline content, stay at least 8 seconds, and have a close button (DESIGN.md section 11).
- Media: no autoplay. Any video has captions and controls usable by keyboard. Motion over 5 seconds can be paused.

## 7. WCAG 2.2 AA checklist

Target: WCAG 2.2 Level AA for all customer and owner screens. Check at 360 px and desktop. The right-hand column says how the project meets it. "Automated" means axe or Lighthouse can catch most failures. "Manual" means a person checks it.

### Perceivable

| SC     | Requirement                            | How this project meets it                                                                                                                    | Check                |
| ------ | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 1.1.1  | Non-text content has text alternatives | Alt text rules in section 6                                                                                                                  | Manual and automated |
| 1.2.x  | Captions and alternatives for media    | No audio or video in v1. If added, captions required                                                                                         | Manual               |
| 1.3.1  | Info and relationships                 | Semantic HTML, labels, `fieldset`, ordered lists for timelines                                                                               | Automated and manual |
| 1.3.2  | Meaningful sequence                    | DOM order equals visual order                                                                                                                | Manual               |
| 1.3.3  | Sensory characteristics                | No "the red button" or "on the right" instructions                                                                                           | Manual               |
| 1.3.4  | Orientation                            | Works portrait and landscape                                                                                                                 | Manual               |
| 1.3.5  | Identify input purpose                 | `autocomplete` tokens on personal fields                                                                                                     | Automated            |
| 1.4.1  | Use of color                           | The interface has no color. Status and errors use text, icon, border, weight. Swatch color is never the only name (swatches have text names) | Manual               |
| 1.4.3  | Contrast (minimum)                     | Text 4.5:1, large text 3:1. Black on white, white on black, `grey-600` or darker on white or `grey-100`                                      | Automated and manual |
| 1.4.4  | Resize text                            | 200% zoom with no loss                                                                                                                       | Manual               |
| 1.4.5  | Images of text                         | None. The wordmark is live text                                                                                                              | Manual               |
| 1.4.10 | Reflow                                 | 320 CSS px with no two-dimensional scrolling (tables and canvas excepted)                                                                    | Manual               |
| 1.4.11 | Non-text contrast                      | Borders, icons, focus rings at least 3:1. Use `grey-500` or darker for control borders                                                       | Manual               |
| 1.4.12 | Text spacing                           | No clipping when spacing is raised                                                                                                           | Manual               |
| 1.4.13 | Content on hover or focus              | Tooltips can be dismissed, hovered and persist                                                                                               | Manual               |

### Operable

| SC     | Requirement                  | How this project meets it                                                                         | Check     |
| ------ | ---------------------------- | ------------------------------------------------------------------------------------------------- | --------- |
| 2.1.1  | Keyboard                     | Section 5                                                                                         | Manual    |
| 2.1.2  | No keyboard trap             | Dialogs close with Escape                                                                         | Manual    |
| 2.1.4  | Character key shortcuts      | Viewer keys (`+`, `-`, `0`) work only when the canvas has focus                                   | Manual    |
| 2.2.1  | Timing adjustable            | 30-minute idle timeout warns before it ends and lets the user continue (**Open**: warning design) | Manual    |
| 2.2.2  | Pause, stop, hide            | No autoplay. Respect `prefers-reduced-motion`                                                     | Manual    |
| 2.3.1  | Three flashes                | No flashing                                                                                       | Manual    |
| 2.4.1  | Bypass blocks                | Skip link and landmarks                                                                           | Automated |
| 2.4.2  | Page titled                  | Unique titles                                                                                     | Automated |
| 2.4.3  | Focus order                  | Section 5                                                                                         | Manual    |
| 2.4.4  | Link purpose                 | Descriptive link text                                                                             | Manual    |
| 2.4.5  | Multiple ways                | Navigation, search or catalog filters, and the order list                                         | Manual    |
| 2.4.6  | Headings and labels          | Descriptive                                                                                       | Manual    |
| 2.4.7  | Focus visible                | Global focus indicator                                                                            | Manual    |
| 2.4.11 | Focus not obscured (minimum) | Sticky bars use `scroll-padding`. Focused item is never fully hidden                              | Manual    |
| 2.5.1  | Pointer gestures             | Drag and pinch have button alternatives                                                           | Manual    |
| 2.5.2  | Pointer cancellation         | Actions fire on release, not on press                                                             | Manual    |
| 2.5.3  | Label in name                | Accessible name contains the visible label                                                        | Automated |
| 2.5.4  | Motion actuation             | No shake or tilt input                                                                            | Manual    |
| 2.5.7  | Dragging movements           | Every drag has a single-pointer alternative                                                       | Manual    |
| 2.5.8  | Target size (minimum)        | 44 px targets (stricter than the 24 px minimum)                                                   | Manual    |

### Understandable

| SC           | Requirement                               | How this project meets it                                                                                                                                                   | Check     |
| ------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 3.1.1        | Language of page                          | `lang="en"`                                                                                                                                                                 | Automated |
| 3.1.2        | Language of parts                         | Filipino chat messages carry `lang="fil"` (**Open**, see section 6)                                                                                                         | Manual    |
| 3.2.1, 3.2.2 | No context change on focus or input       | Section 5                                                                                                                                                                   | Manual    |
| 3.2.3        | Consistent navigation                     | One header and footer pattern                                                                                                                                               | Manual    |
| 3.2.4        | Consistent identification                 | One term and one icon per function                                                                                                                                          | Manual    |
| 3.2.6        | Consistent help                           | The "Ask the store" launcher and contact details are in the same place on every page                                                                                        | Manual    |
| 3.3.1        | Error identification                      | Text "Error:" plus message                                                                                                                                                  | Manual    |
| 3.3.2        | Labels or instructions                    | Visible labels, format hints                                                                                                                                                | Manual    |
| 3.3.3        | Error suggestion                          | Every error says how to fix it (section 2.3)                                                                                                                                | Manual    |
| 3.3.4        | Error prevention (legal, financial, data) | Review and confirm step for orders, quotation acceptance, payment proof and cancellations. The chatbot saves a Draft only                                                   | Manual    |
| 3.3.7        | Redundant entry                           | Prefill from profile. Do not ask twice in one flow                                                                                                                          | Manual    |
| 3.3.8        | Accessible authentication (minimum)       | Allow paste and password managers. No puzzle recall. Cloudflare Turnstile is used on sign-in, registration and reset (D-04); its accessible alternative is **not verified** | Manual    |

### Robust

| SC    | Requirement       | How this project meets it                                                                 | Check                |
| ----- | ----------------- | ----------------------------------------------------------------------------------------- | -------------------- |
| 4.1.2 | Name, role, value | Use shadcn components built on accessible primitives. Custom widgets follow ARIA patterns | Automated and manual |
| 4.1.3 | Status messages   | Live regions for status and errors                                                        | Manual               |

(4.1.1 Parsing is obsolete in WCAG 2.2 and not listed.)

### Test method

1. Run axe or Lighthouse on each screen. A score is not conformance.
2. Keyboard-only pass through every flow in docs/11.
3. Screen reader pass on at least one flow per role (NVDA with Firefox or Chrome on Windows, VoiceOver on iOS Safari). **Not yet done**; record results in 06-testing.md.
4. 200% zoom and 320 px reflow pass.
5. High contrast mode (Windows) and forced colors: status stays readable because it is text plus icon plus border.
6. `prefers-reduced-motion` pass.

## 8. Performance and code rules from vercel-react-best-practices

These affect accessibility and the Performance NFR. Apply them when the UI is built from fixtures.

- Load the 3D viewer with `next/dynamic` and only on the viewer screens, so catalog and order pages stay within 3 s and 5 s (`bundle-dynamic-imports`). Show the WebGL fallback or a loading status while it loads.
- Import icons and components directly, not through barrel files (`bundle-barrel-imports`).
- Fetch independent data in parallel and stream with `Suspense` boundaries so a loading skeleton appears quickly (`async-parallel`, `async-suspense-boundaries`).
- Keep server components as the default. Add `"use client"` only for interactive pieces (chat, viewer, pickers).
- Authenticate every server action like an API route (`server-auth-actions`). This supports the Security NFRs.
- Do not read layout in render. Avoid effects for derived state (`rerender-*` rules).
- Images use `next/image` with width and height set, `priority` for the first visible image only, and lazy loading below the fold.
- Fonts use `next/font` with `display: swap` (fonts are provisional, DESIGN.md section 5).

## 9. UI review checklist

Use this for every pull request that changes the UI. Each item names the NFR or skill it serves. A reviewer ticks each item or writes why not.

### Content (Usability NFR: plain English, errors say what and how)

- [ ] All text is plain English, short sentences, one term per concept.
- [ ] Every error message states what went wrong and how to fix it, and starts with "Error:" in inline fields.
- [ ] Button labels are specific verbs. No "Submit", "OK" or "Click here".
- [ ] No exclamation marks, emoji or hype words.
- [ ] No "AURELIUS" in any rendered text, title, metadata, email or alt text.
- [ ] Estimates are labeled "Estimate". No final price or completion date outside the quotation (Functional Suitability NFR, FR-40).
- [ ] Empty, loading, error and permission-denied states exist for the screen (docs/11).
- [ ] Money and dates use `Intl` formatting.

### Chatbot (Functional Suitability NFR)

- [ ] Reply language follows the customer. Interface stays English.
- [ ] It saves a Draft only. Submitting needs a separate button action.
- [ ] Out-of-scope questions are referred to the owner. No invented data.
- [ ] Panel is keyboard and screen reader usable (section 3.4).

### Mobile (Compatibility NFR, 360 px)

- [ ] The workflow is completable at 360 px. Reflows at 320 px.
- [ ] Touch targets are 44 px. Inputs are 16 px text.
- [ ] No horizontal scroll, except tables and canvas inside their own container.
- [ ] Zoom is not disabled.
- [ ] Sticky bars do not hide the focused field.
- [ ] 3D viewer fallback shows a clear message and options still work (Compatibility NFR).

### Accessibility (WCAG 2.2 AA, accessibility skill)

- [ ] Keyboard-only run completes the flow. Focus indicator visible everywhere.
- [ ] Skip link, landmarks, one `h1`, ordered headings.
- [ ] Every control has a label. Errors link to fields with `aria-describedby`. Error summary receives focus.
- [ ] Status shows text plus icon plus border and weight. Nothing relies on color.
- [ ] Status changes are announced once, in a live region.
- [ ] Images have correct alt. Decorative icons are `aria-hidden`.
- [ ] Reduced motion honored. No autoplay.
- [ ] axe or Lighthouse run, manual keyboard and zoom checks recorded.

### Web interface rules (web-design-guidelines, references/command.md)

- [ ] `button` for actions, `a` for navigation. No clickable `div`.
- [ ] No `outline: none` without replacement. `:focus-visible` used.
- [ ] No `transition: all`. Only `transform` and `opacity` animate.
- [ ] Inputs have correct `type`, `inputmode`, `autocomplete`, `name`. Paste is not blocked.
- [ ] Images have `width` and `height`. Below-fold images are lazy.
- [ ] Long text and empty values do not break layout.
- [ ] URL reflects filters, tabs and pagination.
- [ ] `touch-action: manipulation` and `overscroll-behavior: contain` in sheets.
- [ ] Brand and code tokens use `translate="no"` where needed.
- [ ] No dark mode rules. Skip the skill's dark mode and `theme-color` for dark items; set `theme-color` to white.

### Performance and React (vercel-react-best-practices; Performance NFR)

- [ ] Standard pages load within 3 s on broadband and 5 s on 4G (average of three runs).
- [ ] The viewer is loaded dynamically and only where used.
- [ ] No barrel imports. No sequential awaits for independent data.
- [ ] Server components by default. Client components only where needed.
- [ ] Server actions check the session and role.

### Design system (DESIGN.md)

- [ ] Only black, white and grey tokens in the interface. Photos stay in color.
- [ ] Swatch color follows the decision on DESIGN.md section 9 (**Open**).
- [ ] Each stand-in photo has a row in `public/images/stand-in/SOURCES.md`.

### NFR traceability

| NFR                                                               | Where this document applies it            |
| ----------------------------------------------------------------- | ----------------------------------------- |
| Usability: plain English and error messages                       | Sections 2, 3, 9                          |
| Usability: unaided completion of custom order and service request | Sections 2.2, 4, 5 and chatbot rules in 3 |
| Usability: owner completes tasks unaided                          | Sections 2.4 and 4 (owner queue cards)    |
| Reliability: forms validate and show descriptive errors           | Sections 2.3, 6                           |
| Compatibility: 360 px, WebGL fallback, browsers                   | Section 4, 9                              |
| Performance Efficiency: load times                                | Sections 4, 8                             |
| Functional Suitability: chatbot never gives final price           | Section 3.2                               |
| Security: no information leak in errors                           | Section 2.3                               |

## 10. Open points

- Wording of the refund and unclaimed-item policies (owner interview).
- Whether typing "submit" in chat can ever complete submission. Current rule: no, a button is required.
- `lang="fil"` markup on chat messages and its behavior in real screen readers.
- Accessible alternative for Cloudflare Turnstile.
- Session warning design for the 30-minute idle timeout, and the owner session length (N68).
- Chatbot message length and hourly limits (N54).
- Owner preference on tone words used with customers, and any Filipino phrases to avoid or use (owner interview).

## 11. Not verified

- No screen reader or automated audit has been run, because no UI exists yet.
- Contrast figures come from DESIGN.md, calculated by hand.
- The Turnstile accessibility claim, the 3 px double border rendering and `touch-action` with OrbitControls were not tested.
- Reading level and message wording have not been tested with users.

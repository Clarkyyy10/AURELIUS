# UI Components

Component inventory for the customer site and the owner dashboard, built on shadcn/ui. Each entry gives the purpose, props, states and usage rules. Visual rules (tokens, type, spacing, focus, motion) are in [DESIGN.md](../DESIGN.md). Screens that use these components are in [11-ui-screens.md](11-ui-screens.md). Status lifecycles come from [04-flowcharts.md](04-flowcharts.md) and the decisions N6, N11, N15, N85 and N87 in the [change notes](manuscript/aurelius-change-notes.md).

Status: **provisional**. Nothing here has been built or rendered. Prop names and file paths are proposals for the fixture-data build. Lucide icon names were chosen from memory and must be checked against the installed `lucide-react` version (see [section 15](#15-open-points)).

## 1. Conventions

- **Base library.** shadcn/ui components, configured by the rules in [DESIGN.md section 12](../DESIGN.md#12-shadcnui-mapping). Read the project's `base` (Radix or Base UI) with `npx shadcn@latest info --json` before writing a composition; `asChild` and `render` differ between bases.
- **Where code goes (proposed).** Generated shadcn components stay in `src/components/ui/`. Store-specific components in this file go in `src/components/store/` (customer and shared) and `src/components/owner/`. Do not edit generated files except to add the variants named in this file.
- **Variants live in the component.** `StatusBadge` and similar components carry their variants. Call sites never pass `className` to change borders, fills or weight. `className` is for layout only (margin, width, grid placement).
- **Tokens only.** Use semantic tokens (`bg-primary`, `text-muted-foreground`, `border-input`). No raw Tailwind colors, no `dark:` classes. No chromatic value anywhere in the interface chrome ([DESIGN.md section 4](../DESIGN.md#4-color-tokens-black-white-and-greys-only)).
- **Composition rules from the shadcn skill.** Forms use `FieldGroup`, `Field`, `FieldLabel`, `FieldDescription` with `data-invalid` and `aria-invalid`. Option sets of 2 to 7 use `ToggleGroup`. Callouts use `Alert`. Empty states use `Empty`. Loading uses `Skeleton`. Dialogs, sheets and alert dialogs always have a title. Cards use full composition. Items sit inside their `Group`. No `space-x-*` or `space-y-*`; use `gap-*`. No `isLoading` prop on `Button`; compose `Spinner` and `disabled`. No manual `z-index` on overlays.
- **Icons.** Lucide only, monochrome, imported as components and passed as component references, never as strings. Icons inside shadcn components take `data-icon` and no `size-*` class. Every status icon sits beside its text label and is `aria-hidden`.
- **Naming.** Customer-facing text shows "Afable's Jewelry Store" only. AURELIUS never appears in component text, `aria-label`, alt text or test ids visible to users.
- **Client and server.** Components that need state, events or WebGL are Client Components (`"use client"`). Display-only components (`StatusBadge`, `Timeline`, `ClaimCode` without copy) stay Server Components where possible.

### Inventory

| Component                                                 | Section                                      | Built from (shadcn)                                | Used on screens                |
| --------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------- | ------------------------------ |
| `StatusBadge`, `PaymentProofBadge`                        | [2](#2-status-badge)                         | `Badge`                                            | Most screens                   |
| `Timeline` (order, service, ready-made)                   | [3](#3-timelines)                            | none (ordered list)                                | CUS-05, CUS-06, CUS-10, OWN-05 |
| `PriceText`, `EstimateTable`, `RateSnapshot`              | [4](#4-quotation-page)                       | `Table`, `Card`                                    | PUB-04, CUS-04, CUS-07, OWN-06 |
| `QuotationPage` and its blocks                            | [4](#4-quotation-page)                       | `Card`, `Alert`, `AlertDialog`, `Button`           | CUS-07                         |
| `RingViewer`, `ViewerControls`, `ViewerFallback`          | [5](#5-ring-viewer)                          | `Button`, `Toggle`, `Tooltip`, `Alert`, `Skeleton` | PUB-04                         |
| `OptionPicker` (style, swatch, select)                    | [6](#6-option-pickers)                       | `ToggleGroup`, `RadioGroup`, `Select`, `Field`     | PUB-04, CUS-04, OWN-14         |
| `PaymentProofUpload`                                      | [7](#7-payment-proof-upload)                 | `FieldGroup`, `Input`, `Attachment`, `Alert`       | CUS-08                         |
| `ClaimCode`                                               | [8](#8-claim-code-display)                   | `Card`, `Button`                                   | CUS-14                         |
| `PendingCount`, `ActionQueue`, `ActionQueueItem`          | [9](#9-owner-action-queue-and-pending-count) | `Badge`, `Card`, `Empty`, `Alert`                  | OWN-02, owner header           |
| `ChatPanel`, `DraftSummary`, `SubmitConfirmation`         | [10](#10-chatbot-panel)                      | `Sheet`, chat components, `Card`, `AlertDialog`    | SHR-01                         |
| `Wordmark`, `ProductCard`, `ErrorSummary`, `ReasonDialog` | [11](#11-supporting-components)              | `Card`, `Alert`, `AlertDialog`                     | Many                           |

## 2. Status badge

### 2.1 What it is

`StatusBadge` shows one status from any lifecycle in [04-flowcharts.md](04-flowcharts.md), and the extra vocabularies in [11-ui-screens.md section 3](11-ui-screens.md#3-status-vocabularies). It is a `Badge` with six variants, one per status class defined in [DESIGN.md section 11](../DESIGN.md#11-status-and-validation-without-color). The interface has no color, so each class is told apart by **label, icon, border style, weight and fill pattern**. The label alone is always enough to know the status.

### 2.2 Props

| Prop       | Type                                                                | Notes                                                                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status`   | `StatusKey` (union of the keys in section 2.4)                      | Required. The component looks up the class, icon and label. Call sites never pass a class or an icon.                                                                                                    |
| `reason`   | `string`                                                            | Required when `status` is `rejected`, `proof-rejected`, `quotation-declined-with-reason` and the cancellation outcomes that carry a reason. Shown as text beside the badge, never inside a tooltip only. |
| `date`     | `Date` or ISO string                                                | Shown as text for `expired`, `proof-expired`, `reserved`, and as "Expires on `<date>`" for `expiring-soon`.                                                                                              |
| `size`     | `"sm"` (12 px, in tables and cards) or `"md"` (14 px, page headers) | Default `"md"`. Both keep the 44 px target only when the badge is a link or button; plain badges are not interactive.                                                                                    |
| `announce` | `boolean`                                                           | Default `false`. When `true`, a change of `status` after first render is announced once in a polite live region ("Payment proof verified"). First render never announces.                                |

The component renders `<span>` with the visible label, an `aria-hidden` icon and no role override. The accessible name is the label text. When `reason` or `date` is present the component renders them in a sibling element so a screen reader reads "Rejected. Reason: the reference number does not match."

### 2.3 Class treatments

Each class gets a different **border style, weight, fill and icon family**, so two classes never look alike in greyscale or in Windows high contrast mode. Border styles and weight survive forced colors; the hatch and fill do not, so the label, icon and border carry the meaning on their own.

| Class (variant) | Border                                                                | Weight              | Fill                                                                                          | Icon family                   |
| --------------- | --------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------- | ----------------------------- |
| `neutral`       | 1 px solid `grey-500`                                                 | 500                 | White                                                                                         | Outlined circle or document   |
| `progress`      | 1 px solid black                                                      | 500                 | `grey-100`                                                                                    | Loader, tool or box in motion |
| `pending`       | 1 px **dashed** black                                                 | 500                 | White                                                                                         | Clock                         |
| `complete`      | 1 px solid black                                                      | 600                 | **Black, white text**                                                                         | Check marks                   |
| `attention`     | **2 px solid** black, plus a 4 px black bar on the left edge in cards | 600                 | White                                                                                         | Triangle with exclamation     |
| `stopped`       | See per-status rows in 2.4                                            | 600 (`expired` 500) | Hatch (`grey-300` diagonal lines on white) for Rejected and Cancelled; `grey-100` for Expired | Octagon, ban, hourglass       |

Stopped has three sub-treatments so Rejected, Cancelled and Expired are not confused:

- Rejected: **3 px double** black border (a 2 px double renders as a single line in browsers, so 3 px is the smallest that shows two lines), hatch fill, `octagon-x`, reason shown beside it.
- Cancelled: 2 px solid black border, hatch fill, `ban`.
- Expired: 1 px **dotted** `grey-600` border, `grey-100` fill, `grey-600` text, `hourglass`, date shown beside it.

Hatch is `repeating-linear-gradient(45deg, #d4d4d4 0 1px, transparent 1px 6px)` behind the label on a white plate. Black label text on it keeps at least 4.5:1 (black on `grey-300` is above 14:1). If the pattern is dropped (forced colors, print), the 2 px or 3 px border, icon and label remain.

### 2.4 Treatment for every status

Every status in [04-flowcharts.md](04-flowcharts.md) is listed. Where the same label appears in more than one lifecycle it has one treatment, so a customer sees the same look for "Claimed" in a custom order, a service and a ready-made order. The label column is the exact text shown. The "Extra cue" column is what separates a status from others in its class.

**Custom order (viewer design).** Source: lifecycle "Custom order", N6, N11, N85, N87.

| Status key              | Label                 | Class              | Icon (Lucide)    | Extra cue                                                                                                                                                                      |
| ----------------------- | --------------------- | ------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `draft`                 | Draft                 | neutral            | `file-pen`       | Visible to the customer only. Card shows "The store has not been notified."                                                                                                    |
| `submitted`             | Submitted             | neutral            | `send`           | Shared with service and ready-made orders where used.                                                                                                                          |
| `under-review`          | Under review          | neutral            | `eye`            | If revision was requested, an `Alert` with the owner's remarks sits above the timeline.                                                                                        |
| `rejected`              | Rejected              | stopped (Rejected) | `octagon-x`      | Reason required, shown beside the label. Order ends.                                                                                                                           |
| `design-approved`       | Design approved       | complete           | `badge-check`    | Next step text: "The store will issue a quotation."                                                                                                                            |
| `quotation-issued`      | Quotation issued      | pending            | `clock`          | Prefixed "Waiting:" on the customer's order card: "Waiting: your reply to the quotation". Dashed border.                                                                       |
| `quotation-accepted`    | Quotation accepted    | complete           | `circle-check`   |                                                                                                                                                                                |
| `declined`              | Declined              | attention          | `triangle-alert` | Customer declined the quotation. Order ends. Next-step text: "This order has ended." Shown as "Quotation declined" in the status vocabulary when the context is the quotation. |
| `down-payment-verified` | Down payment verified | complete           | `banknote`       |                                                                                                                                                                                |
| `in-production`         | In production         | progress           | `hammer`         |                                                                                                                                                                                |
| `ready-for-claiming`    | Ready for claiming    | complete           | `package`        | Claim code section appears ([section 8](#8-claim-code-display)).                                                                                                               |
| `claimed`               | Claimed               | complete           | `package-check`  | Release date shown beside it.                                                                                                                                                  |
| `unclaimed`             | Unclaimed             | attention          | `triangle-alert` | Text is "Unclaimed, owner's discretion" (N87). 2 px border and left bar.                                                                                                       |

**Service request.** Source: lifecycle "Service request", N15, N16.

| Status key              | Label                         | Class     | Icon             | Extra cue                                                                                                         |
| ----------------------- | ----------------------------- | --------- | ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| `submitted`             | Submitted                     | neutral   | `send`           | As above.                                                                                                         |
| `received`              | Received                      | progress  | `inbox`          | The owner has the item.                                                                                           |
| `under-assessment`      | Under assessment              | progress  | `search`         |                                                                                                                   |
| `quotation-issued`      | Quotation issued              | pending   | `clock`          | Binding quotation after inspection.                                                                               |
| `quotation-accepted`    | Quotation accepted            | complete  | `circle-check`   |                                                                                                                   |
| `quotation-declined`    | Quotation declined            | attention | `triangle-alert` | 2 px border and left bar.                                                                                         |
| `return-pending`        | Declined, item to be returned | pending   | `undo-2`         | Dashed border. Label is the full text from N15. Replaces the plain "Return pending" wording customers do not see. |
| `down-payment-verified` | Down payment verified         | complete  | `banknote`       |                                                                                                                   |
| `in-progress`           | In progress                   | progress  | `wrench`         |                                                                                                                   |
| `completed`             | Completed                     | complete  | `circle-check`   |                                                                                                                   |
| `ready-for-claiming`    | Ready for claiming            | complete  | `package`        |                                                                                                                   |
| `claimed`               | Claimed                       | complete  | `package-check`  | A declined service also ends at Claimed (item picked up).                                                         |
| `unclaimed`             | Unclaimed                     | attention | `triangle-alert` |                                                                                                                   |

**Ready-made order.** Source: lifecycle "Ready-made order". The sequence is a proposal until N45 is settled (open).

| Status key           | Label              | Class               | Icon            | Extra cue                                                            |
| -------------------- | ------------------ | ------------------- | --------------- | -------------------------------------------------------------------- |
| `placed`             | Placed             | neutral             | `shopping-bag`  |                                                                      |
| `confirmed`          | Confirmed          | progress            | `circle-dot`    | Shows "Reserved until `<date>`".                                     |
| `cancelled`          | Cancelled          | stopped (Cancelled) | `ban`           | Hatch fill, 2 px border.                                             |
| `payment-submitted`  | Payment submitted  | progress            | `receipt`       |                                                                      |
| `payment-verified`   | Payment verified   | complete            | `badge-check`   |                                                                      |
| `ready-for-claiming` | Ready for claiming | complete            | `package`       |                                                                      |
| `claimed`            | Claimed            | complete            | `package-check` |                                                                      |
| `expired`            | Expired            | stopped (Expired)   | `hourglass`     | Reservation deadline passed, unit returned to stock. Date beside it. |

**Payment proof.** Source: N21, FR-17, FR-18. These four are rendered by `PaymentProofBadge`, which is `StatusBadge` with the proof keys.

| Status key       | Label                | Class              | Icon          | Extra cue                                                                                                                                                                                                                                               |
| ---------------- | -------------------- | ------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proof-pending`  | Pending verification | pending            | `clock`       | Dashed border. Text under it: "The store will check your proof."                                                                                                                                                                                        |
| `proof-verified` | Verified             | complete           | `badge-check` | Black fill, white text. Verified date beside it.                                                                                                                                                                                                        |
| `proof-rejected` | Rejected             | stopped (Rejected) | `octagon-x`   | Double border, hatch. **Reason always shown** beside the label, with a "Submit a new proof" action for the customer. Owner cannot reject without a reason.                                                                                              |
| `proof-expired`  | Expired              | stopped (Expired)  | `hourglass`   | Dotted `grey-600` border. Shown when the window to pay ended before the proof was verified. The date it ended is shown. A new proof is not accepted; the page says what to do ("Ask the store to reopen this order, or request a refreshed quotation"). |

The meaning of `proof-expired` is not defined in the source documents, which list only three proof states (Pending verification, Verified, Rejected with reason). The treatment above is a proposal and is open ([section 15](#15-open-points)).

**Other vocabularies shown by the same component.** These are from [11-ui-screens.md section 3](11-ui-screens.md#3-status-vocabularies) and are proposals beyond the three lifecycles.

| Status key               | Label                   | Class                                       | Icon             | Extra cue                                               |
| ------------------------ | ----------------------- | ------------------------------------------- | ---------------- | ------------------------------------------------------- |
| `quotation-expired`      | Expired                 | stopped (Expired)                           | `hourglass`      | Date shown. "Request a refreshed quotation" is offered. |
| `available`              | Available               | neutral                                     | `circle`         |                                                         |
| `made-to-order`          | Made to order           | neutral                                     | `hammer`         |                                                         |
| `unavailable`            | Unavailable             | stopped (Cancelled sub-treatment, no hatch) | `circle-slash`   | Order action disabled with a reason.                    |
| `reserved`               | Reserved until `<date>` | pending                                     | `clock`          |                                                         |
| `expiring-soon`          | Expiring soon           | attention                                   | `triangle-alert` | "Expires on `<date>`".                                  |
| `cancellation-requested` | Requested               | pending                                     | `clock`          |                                                         |
| `refunded-full`          | Refunded in full        | complete                                    | `undo-2`         |                                                         |
| `refunded-part`          | Refunded in part        | attention                                   | `undo-2`         | Reason required beside the label.                       |
| `retained`               | Retained                | attention                                   | `shield`         | Reason required beside the label.                       |

### 2.5 States and usage rules

- **Always text.** The label is never hidden, truncated, or replaced by the icon. In a table cell the badge wraps to two lines before it drops the label.
- **Reason and date.** `rejected`, `proof-rejected`, `refunded-part` and `retained` render without a reason in a loading state only. In any loaded state a missing reason is an error in the data; the component renders "Reason not recorded" so a bug is visible.
- **Loading.** A `Skeleton` the width of a typical label. The status is not shown as a default value while loading.
- **Unknown status.** A status key the component does not know renders the raw label with the `neutral` variant and logs a development warning. It does not hide the status.
- **Not interactive.** A badge is not a button. Do not put it in the tab order. If a status explains itself in a longer text (for example Unclaimed), put the explanation in the page text beside it.
- **Do not combine two badges to tell a story.** One badge per record. Secondary facts (balance due, expiry date) are text.
- **Greyscale and high contrast check.** A review prints or screenshots the page in greyscale and in Windows high contrast, and confirms every status in the same list can still be told apart by text, border style and icon. This check is listed in the UI review checklist of [13-ux-content-a11y.md](13-ux-content-a11y.md).

## 3. Timelines

### 3.1 Component

One `Timeline` component renders the order, service and ready-made timelines from a list of steps. The step lists are defined next to the lifecycles (section 3.3), not hard-coded in screens.

Props:

| Prop          | Type                                    | Notes                                                                                                                                                 |
| ------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`        | `"custom"`, `"service"`, `"ready-made"` | Chooses the step list and the labels.                                                                                                                 |
| `steps`       | `{ key, label, state, date?, note? }[]` | `state` is `done`, `current`, `upcoming`, or `stopped`. `date` is the day the step was reached. `note` is text such as a reason or a revision remark. |
| `orientation` | `"vertical"` or `"auto"`                | Default `"auto"`: vertical at base width, horizontal from `lg` only when there are 6 steps or fewer. Longer timelines stay vertical.                  |
| `label`       | `string`                                | Accessible name of the list, for example "Order progress".                                                                                            |

### 3.2 Step states

Marks follow [DESIGN.md section 11](../DESIGN.md#11-status-and-validation-without-color). Each step also has text.

| State      | Mark                                                                         | Text under the label | Other cue                                                               |
| ---------- | ---------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------- |
| `done`     | Filled black dot with a check icon                                           | The date reached     | Label weight 500                                                        |
| `current`  | 2 px black ring around a white dot, plus the current status badge            | "Now" plus the date  | `aria-current="step"`, label weight 600                                 |
| `upcoming` | Hollow dot, 1 px `grey-500` border                                           | "Not yet"            | Label in `grey-600`                                                     |
| `stopped`  | Octagon or ban icon in a bordered square, same treatment as the status badge | The reason or date   | The timeline ends here. Later steps are removed, not shown as upcoming. |

The connecting line is solid for completed spans and dashed `grey-500` for spans not yet reached, so progress shows without color. The list is an `<ol>`. Each step is an `<li>` with the label, status text and date as plain text, so a screen reader reads "Step 3 of 8, Quotation issued, current, 14 March". A status change is announced once in a polite live region; first render is not announced.

### 3.3 Step lists

**Custom order** (V-CO). `Draft`, `Submitted`, `Under review`, `Design approved`, `Quotation issued`, `Quotation accepted`, `Down payment verified`, `In production`, `Ready for claiming`, `Claimed`.

- Branches: `Rejected` ends the list after Under review. `Declined` ends the list after Quotation issued. `Unclaimed` appears after Ready for claiming when the unclaimed period has passed, with the text "Unclaimed, owner's discretion".
- Revision loop: when the owner asks for changes, the list returns to `Submitted` and the timeline shows a note "Revision requested" with the owner's remarks and the date. The earlier steps keep their dates. This is an `Alert` plus a note, not a new status.
- A refreshed quotation after expiry shows `Quotation issued` again with a second date and the note "Refreshed quotation".

**Service request** (V-SR). `Submitted`, `Received`, `Under assessment`, `Quotation issued`, `Quotation accepted`, `Down payment verified`, `In progress`, `Completed`, `Ready for claiming`, `Claimed`.

- Branch: `Quotation declined`, then `Declined, item to be returned`, then `Claimed` (item picked up). The steps after Quotation issued that were not reached are removed.
- An optional, non-binding estimate range, if given, shows as a note under `Submitted` labeled "Estimate, not a quotation" (N16). It is never a step.
- `Unclaimed` as for custom orders.

**Ready-made order** (V-RM, provisional until N45). `Placed`, `Confirmed`, `Payment submitted`, `Payment verified`, `Ready for claiming`, `Claimed`.

- Branches: `Cancelled` after Placed. `Expired` after Confirmed, with the date and the text "Your reserved unit was released." A rejected proof returns the list to `Confirmed` with a note "Payment proof rejected" and the reason.
- While `Confirmed`, the step shows "Reserved until `<date>`".

### 3.4 Usage rules

- The timeline is shown on the order and service detail pages (CUS-05, CUS-06, CUS-10) and, with owner actions, on the owner's status page (OWN-05).
- The timeline never shows a completion date unless the owner entered an expected date on the quotation (FR-40). The text is "Expected `<date>`, set by the store."
- Walk-in profiles have no tracking page (N30, N32). The owner sees the same timeline on owner screens only.

## 4. Quotation page

Screen: [CUS-07](11-ui-screens.md#cus-07-quotation). The page is the only place where a final price appears (N6). The reading width is 680 px.

### 4.1 Layout

`QuotationPage` composes these blocks in this order, each in its own `Card` with a heading:

1. Header: order reference, `StatusBadge` for the quotation (`quotation-issued`, or `quotation-expired`), issue date, "Valid until `<date>`".
2. `EstimateTable`: the itemized estimate.
3. Final price and payment terms: the final price, the required down payment, the balance, the expected completion date set by the owner.
4. `RateSnapshot`: the rates the estimate used.
5. `PaymentAccountBlock`: where to send the transfer, and the cash option.
6. `PolicyBlock` for the refund policy, then `PolicyBlock` for the unclaimed-item policy.
7. Actions: Accept and Decline, with review and confirm steps.

On mobile the blocks stack in one column. The actions sit at the bottom of the page and in a sticky bar. The sticky bar must not cover the focused element (`scroll-padding-bottom` equals the bar height).

### 4.2 `PriceText`

| Prop     | Type                                                                       | Notes                                                                                                                                                                           |
| -------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `amount` | `number` (centavos or a decimal string, to be decided with the data layer) | Formatted as `₱12,500.00`, tabular numerals, body sans. The peso sign is set in the body sans, never the display serif.                                                         |
| `kind`   | `"listed"`, `"estimate"`, `"final"`                                        | `"estimate"` always renders the word "Estimate" before the amount ("Estimate ₱12,500.00"). `"final"` renders "Final price". `"listed"` is a ready-made product's catalog price. |

Rules: the word "Total" is not used for an estimate. A `final` price appears only on `QuotationPage`, the order pages that link to an issued quotation, and owner screens. Drafts and submitted designs show `estimate` only (FR-06, FR-40).

### 4.3 `EstimateTable`

Props: `lines` (`{ id, label, group, weight?, amount }[]` where `group` is `metal`, `stone`, `labor`, `finishing`), `weightTotal?`, `kind` (`"estimate"` before a quotation, `"quotation"` after), `caption`.

- A real `<table>` with a caption ("Itemized estimate" or "Itemized quotation") and header cells with `scope`. Columns: Item, Weight, Amount. On a 360 px screen the table keeps its columns because it has three short ones; the Weight column is hidden below 360 px only if the label would wrap, never the Amount.
- Rows are grouped by metal, stones, labor, finishing, in that order, matching the price formula in D-14 (metal + stones + labor + finishing). Group subtotals are optional and are shown as a row with weight 600.
- The last row for `kind="estimate"` is "Estimated total" with the note "This is an estimate, not a final price." For `kind="quotation"` the last row is "Final price".
- Weights are labeled "Estimated weight" until the owner confirms them in the quotation (D-14 is provisional).
- Empty group (owner has no options): the row is absent and a line says "No options available right now" only on the viewer page.

### 4.4 `RateSnapshot`

Props: `rates` (`{ label, value, unit }[]`), `capturedAt`, `scope` (`"submission"` or `"quotation"`).

A bordered block titled "Rates used in this quotation", with a definition list of rate, value, unit (for example "Gold, 18K: ₱X per gram") and the line "Rates as of `<date and time>`. Later rate changes do not change this quotation." (D-21, N79 to N82). If the estimate on a reopened draft differs from the saved rate snapshot, the viewer shows the notice "The estimate changed since you saved this design" (N80), not this block.

### 4.5 `PaymentAccountBlock` and `PolicyBlock`

- `PaymentAccountBlock` props: `accounts` (`{ channel, accountName, accountNumber }[]`), `cashNote`. Text only, selectable, with a "Copy account number" button that announces "Copied". The owner's channels are open (D-05, owner interview). Empty: "The store has not published payment details yet. Ask the store before you pay." Whether this block also shows on the public store page is open ([11-ui-screens.md section 7](11-ui-screens.md#7-open-points)).
- `PolicyBlock` props: `kind` (`"refund"` or `"unclaimed"`), `body` (owner-set text), `updatedAt`. The refund policy states that the system records the outcome and the owner decides (D-22). The unclaimed-item block states the unclaimed period and that the owner decides after it (N87). Both show in plain words next to the Accept button, not behind a link or accordion, because the customer decides here. Empty: "The store has not published this yet. Ask the store directly." and Accept stays enabled only if the owner has published the policy (open: whether to block acceptance when a policy is empty).

### 4.6 Accept and Decline

- **Accept** is a primary button "Review and accept". It opens a `Dialog` titled "Review your acceptance" that repeats the final price, down payment, validity date, refund policy and unclaimed policy and has two buttons: "Accept quotation" and "Go back". This is the review step and the confirm step (WCAG 3.3.4). Accepting does not move money; the dialog says so and shows the next step ("Send your down payment and upload your proof").
- **Decline** is an outline button "Decline quotation" with an `AlertDialog` titled "Decline this quotation?". Text: "A declined quotation ends this order." For a service: "The store will return your item." (N15).
- **States.** `issued`: both enabled. `expired`: Accept and Decline disabled, the `quotation-expired` badge and date shown, with "Request a refreshed quotation" as the primary action and the reason shown next to the disabled buttons. `accepted` and `declined`: actions removed, the badge shown. `loading`: both disabled. `error`: an error summary; nothing changes.
- A disabled button has an adjacent reason in text ("This quotation expired on `<date>`").

## 5. Ring viewer

Screen: [PUB-04](11-ui-screens.md#pub-04-ring-viewer). The ring is procedural, generated in code with React Three Fiber and drei (D-11). No stored models. Rings only in version 1: plain band, solitaire, side stones (D-12, provisional). The scene is a Client Component loaded with `next/dynamic` and `ssr: false` so the page and the option pickers render first.

### 5.1 Components

- `RingViewer` holds the `Canvas`, the procedural ring, lights and the controls. Props: `config` (style, metal, finish, stones, size), `rotateEnabled`, `onReady`, `onUnavailable(reason)`, `summary` (text description of the current configuration).
- `ViewerControls` is the row of buttons under or beside the canvas.
- `ViewerFallback` replaces the canvas when WebGL is not available or fails ([section 5.4](#54-webgl-fallback)).
- `ViewerSummary` is the always-visible text description of the configuration ("Solitaire ring, yellow gold, 6 mm round stone, size 7"), which is the text alternative of the canvas. The canvas has `role="img"` and `aria-label` set from the same text.

### 5.2 Scene rules (from the React Three Fiber skill)

- The `Canvas` needs a parent with a set height. Mobile: 4:3 or taller, full width. From `lg`: 7 of 12 columns ([DESIGN.md section 10](../DESIGN.md#10-layout-grid-and-responsive-rules)).
- Use `frameloop="demand"` so the scene renders only when the configuration or camera changes. Imperative changes call `invalidate()`. Cap `dpr` at `[1, 2]` and use `PerformanceMonitor` to lower it on slow devices (target: first render in 5 seconds, N2).
- Background, floor and lights are neutral grey and white ([DESIGN.md section 9](../DESIGN.md#9-metal-and-gemstone-swatches-open-point)). The skill's sample uses a dark navy background; this project uses `#f5f5f5` (`grey-100`). The ring uses real material colors (see swatches below).
- Rebuild geometry only when its `args` change. Dispose geometries, materials and textures that you create outside JSX and do not remount the `Canvas` on option changes.
- Initial slow rotation at most one turn, once, never looping ([DESIGN.md section 15](../DESIGN.md#15-motion)). With `prefers-reduced-motion: reduce` there is no automatic rotation.
- Do not use `Html` from drei for essential labels. The skill reports that an `Html` mounted in the same commit as the `Canvas` can render empty with the pinned versions. Put labels in the page DOM next to the canvas.

### 5.3 `ViewerControls`

| Control                   | Mouse and touch                                                         | Keyboard                             | Accessible name                     |
| ------------------------- | ----------------------------------------------------------------------- | ------------------------------------ | ----------------------------------- |
| Rotate left, rotate right | Icon buttons (`rotate-ccw`, `rotate-cw`), also drag on the canvas       | Arrow keys when the canvas has focus | "Rotate left", "Rotate right"       |
| Zoom in, zoom out         | Icon buttons (`zoom-in`, `zoom-out`), pinch and wheel when enabled      | `+` and `-`                          | "Zoom in", "Zoom out"               |
| Reset view                | Icon button (`rotate-3d` or `refresh-cw`)                               | `0`                                  | "Reset view"                        |
| Rotate mode toggle        | A `Toggle` labeled "Rotate with touch", off by default on touch devices | n/a                                  | "Rotate with touch", `aria-pressed` |

Rules:

- Every control is a 44 px button with a visible text label at `lg` and a `Tooltip` on pointer devices. Icons alone never carry the meaning on touch screens; the label shows below the icon at base width or in the `aria-label`.
- **Scrolling is never trapped.** On touch devices the canvas uses `touch-action: pan-y` and a single finger scrolls the page. The "Rotate with touch" toggle switches the canvas to `touch-action: none` and drag-to-rotate, and shows a visible state ("Rotate with touch: on"). Wheel zoom is disabled until the canvas has focus or the toggle is on.
- The canvas is focusable (`tabindex="0"`) with the global focus indicator. Keyboard shortcuts work only while it has focus and are listed in a "Keyboard help" text under the controls.
- Auto-rotation, if any, has a pause button when it lasts more than 5 seconds (WCAG 2.2.2). The initial rotation is shorter, so it needs none.
- Control changes that alter the ring (style, metal, size) are made in the option pickers, not the viewer controls. Picker changes announce one polite message: "Ring updated: yellow gold".

States: `loading` (scene frame `Skeleton`; the option pickers already work), `ready`, `rendering error` (the scene fails after load), `unavailable` (no WebGL), `context lost`.

### 5.4 WebGL fallback

The fallback uses the same copy as [PUB-04](11-ui-screens.md#pub-04-ring-viewer).

- **Detect before mounting.** Test `canvas.getContext("webgl2")` or `"webgl"` in a small client-side function on mount. If both return `null`, show `ViewerFallback` and do not mount `Canvas`.
- **Catch failures after mounting.** Wrap the scene in an error boundary. Listen for `webglcontextlost` on the renderer's canvas (from `onCreated`). On loss, show the fallback with a "Try the 3D view again" button that remounts the scene. Prevent the default on `webglcontextlost` so the browser may restore the context.
- **What the fallback shows.** An `Alert` ("Your browser cannot show the 3D view. You can still choose options and see the estimate."), the `ViewerSummary` text, and a static image set for the chosen style (a front and a side image per ring style) on a `grey-100` plate. Stand-in images follow the source and license rule in [DESIGN.md section 8](../DESIGN.md#8-imagery). If no image exists yet, show a grey plate labeled "Preview not available" with the summary text.
- **Everything else keeps working.** Option pickers, the itemized estimate, Save draft and Submit work with or without the scene. The estimate never depends on WebGL (Compatibility NFR).
- **No silent failure.** The fallback is announced once in a polite live region ("The 3D view is not available. You can still choose options.").

### 5.5 Swatches in the viewer (open point)

Whether metal and gemstone swatches may show color is an open point for the user ([DESIGN.md section 9](../DESIGN.md#9-metal-and-gemstone-swatches-open-point)). The 3D scene and the swatch chips are product representation, not interface color. `OptionPicker` supports both modes (section 6) so the choice changes one prop default, not the components.

## 6. Option pickers

Screens: PUB-04, CUS-04, and owner option management (OWN-14). Pickers use only the owner's current options (D-17, FR-47). Archived options never appear; options already used in saved drafts keep their snapshot (D-21).

### 6.1 Variants

| Variant  | Use                                            | shadcn parts                                              | Rule                                    |
| -------- | ---------------------------------------------- | --------------------------------------------------------- | --------------------------------------- |
| `style`  | Ring style: plain band, solitaire, side stones | `ToggleGroup` (single selection) inside `Field`           | 2 to 7 options, segmented buttons       |
| `swatch` | Metal and color or finish, gemstone type       | `RadioGroup` of chips inside `FieldSet` and `FieldLegend` | Name text is always visible             |
| `select` | Ring size and any list longer than 7           | `Select` with `SelectGroup`                               | Used on mobile as a bottom sheet        |
| `stones` | Gemstone count, size, placement                | `Field` rows combining the above                          | Only options valid for the chosen style |

### 6.2 Props (shared)

| Prop         | Type                                                                    | Notes                                                                                             |
| ------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `label`      | `string`                                                                | Visible `FieldLabel` or `FieldLegend`. Required.                                                  |
| `options`    | `{ id, label, description?, swatch?, available, unavailableReason? }[]` | `swatch` is `{ kind: "color", value }` or `{ kind: "texture", pattern }`.                         |
| `value`      | `string` or `undefined`                                                 | Controlled.                                                                                       |
| `onChange`   | `(id: string) => void`                                                  |                                                                                                   |
| `swatchMode` | `"color"` or `"texture"`                                                | Default depends on the open swatch decision. Recommended default: `"color"` inside the chip only. |
| `disabled`   | `boolean`                                                               | Whole group disabled. Reason text required.                                                       |
| `error`      | `string`                                                                | Shown as in [DESIGN.md section 11](../DESIGN.md#11-status-and-validation-without-color).          |
| `helpText`   | `string`                                                                | `FieldDescription`. Plain explanations of stones and metals are welcome here.                     |

### 6.3 States

| State       | Treatment (no color)                                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Default     | 1 px `grey-500` border, white fill, 44 px minimum height and width                                                           |
| Hover       | `grey-100` wash and underlined label                                                                                         |
| Focus       | Global focus indicator (black outline plus white ring)                                                                       |
| Selected    | 2 px black border, check icon, `aria-checked` or `aria-pressed`; toggle-group items also invert to black fill and white text |
| Unavailable | `grey-400` text, dashed `grey-300` border, `disabled`, and the reason in text ("Not available right now")                    |
| Error       | 2 px black border, `circle-alert` icon, "Error:" prefix text                                                                 |
| Loading     | `Skeleton` of the chip row; the picker is not shown with default selections                                                  |
| Empty       | "No options available right now" with the group omitted from the estimate                                                    |

### 6.4 Usage rules

- The option name is always text. A chip shows the name beside or below the swatch. A swatch alone never names an option.
- A swatch chip never carries price change, status or validation. A price difference is shown as text ("adds an estimated ₱X") only if the owner enables it, labeled as an estimate.
- Changing one option may invalidate another (for example a stone size that does not fit the chosen style). The picker shows the dependent option as unavailable with a reason, and never silently resets a customer's choice. If a reset is unavoidable, a polite live region and an `Alert` say what changed.
- Ring size uses the owner's size list. Include a plain-English hint ("Not sure? Ask the store.") and a link to the chatbot. Do not add a size guide image until the owner supplies one (open).
- On mobile the pickers sit under the canvas. The estimate summary sits in a sticky bottom bar showing "Estimate" and the amount; the bar must not cover the focused control.
- Pickers are controlled by the same `config` object that the chatbot fills (FR-36), so a chatbot draft opens in the viewer with every field set.

## 7. Payment proof upload

Screen: [CUS-08](11-ui-screens.md#cus-08-payment-proof-upload). FR-17, FR-18. Proof states: Pending verification, Verified, Rejected with reason, Expired ([section 2.4](#24-treatment-for-every-status)).

### 7.1 `PaymentProofUpload`

A form in a `Card`, built with `FieldGroup`:

| Field                       | Control                                                                         | Rules                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Amount (required)           | `Input` with `inputmode="decimal"`, peso prefix in `InputGroupAddon`            | Prefilled with the down payment due from the quotation (WCAG 3.3.7). Editable.                |
| Payment date (required)     | `Input` type date, or three labeled fields                                      | Not in the future.                                                                            |
| Reference number (required) | `Input`                                                                         | Visible hint "Found on your receipt or transfer confirmation". A duplicate is rejected (N22). |
| Proof file (required)       | `Input type="file"` with accept `.jpg,.jpeg,.png,.pdf`, shown with `Attachment` | JPG, PNG or PDF, up to 5 MB.                                                                  |
| Paying in cash instead      | A text block, no upload                                                         | Explains that cash is paid in the store and the owner records it.                             |

Props: `orderId`, `amountDue`, `account` (the payment account block), `earlierProofs`, `onSubmit`, `disabledReason?`.

### 7.2 States

- **Idle.** Fields empty or prefilled, "Submit proof" disabled with the reason "Choose a file first".
- **File chosen.** `Attachment` with name, type, size and a "Remove file" action.
- **Uploading.** `Attachment state="uploading"` with a text percentage, a progress bar with `role="progressbar"` and the text "Uploading, 40%". Submit disabled.
- **Processing.** `Attachment state="processing"`; text "Checking the file".
- **Error.** Wrong type or too large: "Error: Upload a JPG, PNG or PDF file up to 5 MB." Duplicate reference: "Error: This reference number was already submitted. Check the number on your receipt." Network failure: error summary and the file stays chosen.
- **Done.** Success message in `role="status"` ("Proof submitted. The store will check it."), the new proof appears in the history with `proof-pending`.
- **Review before submit.** The button "Review and submit" opens a `Dialog` showing amount, date, reference and file name, with "Submit proof" and "Go back" (WCAG 3.3.4).

### 7.3 Proof history list

A list of earlier proofs, newest first. Each row: amount, date, reference, `PaymentProofBadge`. A rejected row shows the owner's reason as text and a "Submit a new proof" button. A verified row shows the verified date. An expired row shows the date it ended and the next step.

### 7.4 Usage rules

- The proof file is private: only the owner and the submitting customer can open it (Security NFR). The file preview shows a grey plate until loaded; the reference number is always shown as text.
- Do not show the payment account's number in a screenshot-only image. Text only.
- A customer cannot upload while the quotation is not accepted or the reservation has expired. The page states why in text.
- The owner's side (OWN-07) uses the same `PaymentProofBadge` and requires a reason to reject: "Error: Write the reason the customer will see."

## 8. Claim code display

Screen: [CUS-14](11-ui-screens.md#cus-14-claim-code-section). Shown on the order or service page when the status is Ready for claiming. N85, N86, N88, N90.

### 8.1 `ClaimCode`

Props: `code` (string, or `undefined` while loading), `state` (`"ready"`, `"loading"`, `"error"`, `"used"`), `balanceDue` (amount), `unclaimedFrom` (date), `releasedAt?` (date, for `used`), `onRetry`.

Layout, in a `Card`:

- Heading "Your claim code" and the `StatusBadge` for the parent status.
- The code in large text: monospace or tabular sans, 28 to 32 px, grouped in blocks (for example `ABCD-EFGH-JKLM`), on a white plate with a 2 px black border. The code is real text, never an image, so it can be selected, zoomed and read by a screen reader.
- A "Copy code" button. After copying, a polite live region says "Code copied".
- "Balance to pay at claiming": amount, as text.
- "What to bring": the code and a valid ID. A representative brings the code, written authorization from the customer, and their own valid ID.
- The unclaimed-item period with the date: "If the item is not claimed by `<date>`, it becomes unclaimed and the store decides what happens next."
- A note that the code is also in the email.

### 8.2 States

| State     | Treatment                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `loading` | Skeleton block. A code-shaped placeholder is never shown.                                                                      |
| `ready`   | As above.                                                                                                                      |
| `error`   | `Alert`: "We could not show your code. Try again, or ask the store." with a "Try again" button. The code is also in the email. |
| `used`    | The code stays visible with a `Claimed` badge and the text "Used on `<release date>`". The copy button is removed.             |
| absent    | Before Ready for claiming the section is not rendered. The timeline shows "Not yet".                                           |

### 8.3 Usage rules

- The accessible name reads the code character by character: `aria-label="Claim code A B C D, E F G H ..."`, while the visual code stays selectable. Format and length are open (N88, D-24); the grouping above is a placeholder.
- Contrast: black on white. No dependence on a QR code in version 1 (not in the requirements).
- Show the code only to the order's customer. Owner screens show only whether the code was checked. Owner-created profiles use the release record without a code (N90).
- On Unclaimed the section keeps the code visible and the status text "Unclaimed, owner's discretion".

## 9. Owner action queue and pending count

Screen: [OWN-02](11-ui-screens.md#own-02-dashboard-and-action-queue). FR-50. The owner is told by email as well (D-26); the dashboard count is the in-app signal.

### 9.1 `PendingCount`

Sits in the owner header on every screen and size.

| Prop    | Type                              | Notes                                |
| ------- | --------------------------------- | ------------------------------------ |
| `count` | `number` or `undefined`           | `undefined` means loading or failed. |
| `state` | `"loading"`, `"ready"`, `"error"` |                                      |
| `href`  | string                            | Link to the queue.                   |

- **Ready:** a link "Pending actions" with the number in a bordered square (2 px black, white fill, weight 600). The accessible name is the full phrase: "12 pending actions". Over 99 shows "99+" with the accessible name "More than 99 pending actions". Zero shows "0" with the name "No pending actions".
- **Loading:** `Skeleton`. The count is never shown as 0 while loading.
- **Error:** the text "Count unavailable" with a `triangle-alert` icon. Never 0.
- **Change:** when the count changes while the page is open, a polite live region announces "Pending actions: 13". No sound, no motion.
- The count does not use a red dot or any color. The border and the number carry it.

### 9.2 `ActionQueue` and `ActionQueueItem`

`ActionQueue` props: `items`, `state` (`"loading"`, `"ready"`, `"error"`), `lastChecked`, `onRetry`. `ActionQueueItem` props: `type`, `reference`, `customerName`, `waitingSince`, `status` (a `StatusKey`), `dueDate?`, `href`.

Item types, from OWN-02:

| `type`            | Label                            | Status badge                   | Opens             |
| ----------------- | -------------------------------- | ------------------------------ | ----------------- |
| `custom-order`    | New custom order                 | `submitted` or `under-review`  | OWN-04            |
| `service-request` | New service request              | `submitted` or `received`      | OWN-10            |
| `payment-proof`   | Payment proof to verify          | `proof-pending`                | OWN-07            |
| `cancellation`    | Cancellation request             | `cancellation-requested`       | OWN-11            |
| `ready-made`      | Ready-made order to confirm      | `placed`                       | OWN-03 and OWN-05 |
| `reservation`     | Reservation expiring soon        | `expiring-soon`                | OWN-05            |
| `unclaimed`       | Item nearing the unclaimed limit | `expiring-soon` or `unclaimed` | OWN-05            |

- **Row content.** Type label, customer name or reference, "Waiting since `<date>`", the `StatusBadge`, and an "Open" link. The whole row is one link with a visible focus. At base width each row is a stacked card with the 4 px black left bar only for `attention` rows (expiring soon, unclaimed).
- **Order.** Oldest waiting first within each type, with items that expire soonest above the rest. Grouping by type with a heading per group. The exact order is open and should be confirmed with the owner.
- **Counts per group** are in the group heading ("Payment proofs to verify, 3"), and the sum equals the header `PendingCount`.
- **Empty.** `Empty`: "Nothing is waiting for you" with "Last checked `<time>`".
- **Error.** `Alert` with "Try again". The header count shows "Count unavailable".
- **Loading.** Row skeletons.
- **Permission denied.** Signed out: redirect to OWN-01. A customer account sees the access-denied page.
- **Refresh.** The queue updates when the page is opened and on an explicit "Refresh" button. Live updates are not required in version 1 (no SMS or push, D-26). A "Last checked" time is always visible.

## 10. Chatbot panel

Screen: [SHR-01](11-ui-screens.md#shr-01-chatbot-panel). FR-35 to FR-40. The chatbot answers from the owner's live data, replies in the customer's language (English, Filipino or Taglish), and the interface around it stays English (D-18). It never shows a final price or a completion date (FR-40). The flow is Figure 10 in [04-flowcharts.md](04-flowcharts.md).

### 10.1 Composition

Built from the shadcn chat components (`message-scroller`, `message`, `bubble`, `attachment`, `marker`), installed after the first shadcn setup. Whether these chat components exist in the project's registry and base is not verified.

- Container: a `Sheet` from the side on desktop and a full-height bottom sheet on mobile, with a title "Ask Afable's Jewelry Store" (visually the store name, never AURELIUS) and a close button. Opened from a launcher button with a text label "Ask the store".
- Thread: `MessageScrollerProvider` > `MessageScroller` > `MessageScrollerViewport` > `MessageScrollerContent` > `MessageScrollerItem`. Each message is a `Message` with `align="end"` for the customer and `align="start"` for the assistant. Use `autoScroll` and the customer's turn as the `scrollAnchor`.
- Bubbles: customer `Bubble variant="default"` (black fill, white text). Assistant `Bubble variant="outline"` (white fill, 1 px `grey-500` border). Do not use `tinted`, `secondary` with color, or `destructive` variants. Each message has a visible speaker label in `MessageHeader` ("You", "Assistant") and a time in `MessageFooter`.
- Date or system dividers use `Marker`. Assistant activity indicators (`Trace`) are not used in version 1; the typing state is a text row.
- Prompt: an `InputGroup` with `InputGroupTextarea` and a "Send" button (visible text on desktop, label plus icon on mobile). A visible label "Message" (may be visually hidden but present). Enter sends; Shift plus Enter adds a line. The 16 px minimum text size applies.

### 10.2 States

| State               | Treatment                                                                                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Empty (first open)  | Greeting from "Afable's Jewelry Store", three suggested starts as buttons (Ask about a product, Start a ring design, Ask about a service), and the sentence "Write in English, Filipino or Taglish. I will reply in the language you use." |
| Typing              | A text row "Afable's assistant is replying", using the `shimmer` utility only if reduced motion is not set. After the target response time: "Still working on it"                                                                          |
| Error: rate limit   | "You have sent many messages. Wait a few minutes and try again." (limits open, N54)                                                                                                                                                        |
| Error: too long     | "Shorten your message to `<N>` characters." (limit open)                                                                                                                                                                                   |
| Error: service down | "The assistant is not available. You can still browse the store or contact the owner." The input is disabled with that reason.                                                                                                             |
| Out of scope        | The reply refers the customer to the owner and gives no price or date (FR-39, FR-40).                                                                                                                                                      |
| Unsupported piece   | "The online designer covers rings only. Ask the store about other pieces."                                                                                                                                                                 |
| Signed out          | Visitors can ask questions. Before a draft is saved the panel asks the visitor to sign in and keeps the conversation.                                                                                                                      |

### 10.3 Draft summary, confirm and submit steps

The customer controls each step. Saving a Draft and submitting are two separate actions (D-16, N8, N11, N12).

**Step 1: Draft summary.** The assistant collects type, material, color, gemstone, size and notes using only the owner's current options (D-17). It then shows a `DraftSummary` card in the thread.

`DraftSummary` props: `fields` (`{ label, value, editable }[]`), `notes`, `state` (`"proposed"`, `"saved"`, `"submitted"`, `"editing"`), `onEdit`, `onConfirm`, `viewerHref`.

- A `Card` with title "Draft summary" and a `Badge` neutral "Not saved yet" in the proposed state.
- A definition list of the fields. The labels are English even when the chat is in Filipino or Taglish.
- No price. If an estimate is shown it is labeled "Estimate" and is never the only content. The card never says "Final price" (FR-40).
- Buttons: "Save as draft" (primary) and "Edit" (secondary). Edit lets the customer change each field with the same `OptionPicker` components, or ask the assistant to change it. Nothing is saved until "Save as draft".

**Step 2: Confirm and save the Draft.** "Save as draft" saves a Draft that is visible only to the customer. The owner is not notified. The card changes to the `saved` state:

- `StatusBadge` `draft` and the text "Saved as a draft. The store has not been notified."
- A link "Open in the 3D viewer" (`viewerHref`) and a button "Submit to the store".
- If the customer is signed out, the panel shows sign-in first and keeps the conversation.

**Step 3: Submit (second explicit confirmation).** Submitting needs a second explicit confirmation, whether the customer starts it in the viewer or in chat.

- In chat, a request to submit (a button "Submit to the store" or a typed request in any supported language) makes the assistant show `SubmitConfirmation`. The assistant never submits on a typed message alone.
- `SubmitConfirmation` is an `AlertDialog`-style card titled "Submit this design to the store?" showing the full summary, the line "The store will be notified and will review your design. You can still talk to the store about changes.", and two buttons: "Submit to the store" and "Not yet". Buttons are in English.
- If the email address is not verified, the card is replaced by "Verify your email address to submit" with a "Resend email" action (FR-41).
- On success the card shows `StatusBadge` `submitted`, the order reference, the message "The store has been notified", and a link to the order page. On failure it shows an error summary and the Draft stays saved.
- A service request draft is assumed to follow the same steps (FR-37, N14 open).

Whether a typed phrase alone may count as the second confirmation is not stated in the source beyond "tells the chatbot to submit". This file requires a button click as the final act so a mistranslated or ambiguous Taglish message cannot submit by itself. This is open ([section 15](#15-open-points)).

### 10.4 Language and content rules

- Replies are in the customer's language. Card labels, buttons, errors and status text are English.
- The assistant never states a final price or a completion date. If the customer asks, it says the final price appears only in the quotation after the store reviews the request, and refers to the owner (FR-39, FR-40).
- Assistant text that mentions an estimate says "estimate" in the same sentence.
- Never show the name AURELIUS in the greeting, the title or any reply.

### 10.5 Accessibility

- The thread is a live region: `role="log"` with `aria-live="polite"`. New assistant messages are read once. Typing-state text is announced once, not repeatedly.
- Focus moves to the panel title when the panel opens and returns to the launcher when it closes. It does not move on each message. When a `DraftSummary` or `SubmitConfirmation` appears, focus stays in the input; the card is reachable by Tab. The submit `AlertDialog` traps focus and returns it to the "Submit to the store" button.
- Every message has a visible speaker label and time, so low-vision and screen reader users can tell turns apart without color or alignment.
- The Send button, suggested starts and card buttons are 44 px.
- Escape closes the panel when no dialog is open.

## 11. Supporting components

Short entries for components that the sections above rely on.

- **`Wordmark`.** Renders "Afable's Jewelry Store" as plain text in the display face, weight 500, in the header, footer, emails and sign-in screens. Props: `size` (`"header"` or `"footer"`), `asLink`. Reads the name from `src/config/brand.ts` (planned). A logo replaces only this component ([DESIGN.md section 3](../DESIGN.md#3-brand-name-and-wordmark)). Accessible name is the full store name even if the visual text is shortened.
- **`ProductCard`.** Photo (4:5, `grey-100` plate), name in `type-title`, `PriceText kind="listed"`, availability `StatusBadge` (`available`, `made-to-order`, `unavailable`). The whole card is one link with a visible focus. No photo: grey plate with "Photo coming soon". Stand-in photos follow the license rule in [DESIGN.md section 8](../DESIGN.md#8-imagery).
- **`ErrorSummary`.** An `Alert` with `role="alert"`, heading "There is a problem", and a list of links to each invalid field. Receives focus on submit failure. Used by every form.
- **`ReasonDialog`.** An `AlertDialog` for actions that need a customer-visible reason (reject a design, reject a proof, record a retained or partly refunded deposit). A required `Textarea`, a visible label "Reason the customer will see", "Error: Write the reason the customer will see." when empty, and confirm and cancel buttons. Destructive-looking actions are outline buttons with a verb and an icon, not red.
- **`ReleaseForm` (owner, OWN-08).** Fields recipient, representative authorization checked, ID checked, balance paid. When the balance is not zero it shows an `Alert` with a `triangle-alert` icon and requires a confirmation checkbox before "Record release" (N86). On save the status becomes Claimed with the date shown.

## 12. Cross-component rules

- **Estimate versus final price.** The word "Estimate" appears with every amount that is not on an issued quotation. "Final price" appears only on the quotation and the pages that show an issued quotation (N6).
- **One status vocabulary source.** `StatusKey`, labels, classes and icons live in one module (proposed `src/components/store/status.ts`). Screens import it. A new status is added there and in this file together.
- **Live regions.** Status changes, count changes, copy confirmations and fallback notices use one shared polite live region component, not per-component regions.
- **Forms.** All forms follow [DESIGN.md section 11](../DESIGN.md#11-status-and-validation-without-color): visible labels, "(required)" text, error summary, inline "Error:" text, no cleared input, review and confirm for commitments.
- **Loading, empty, error.** Every component above lists its states. A component without its states listed is not ready for review.
- **Fixture data.** In the first build these components read fixtures. Props are shaped so the same props can come from the real data layer.

## 13. Requirement coverage

| Area              | Components                                                                             | FRs                                             |
| ----------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Status vocabulary | `StatusBadge`, `PaymentProofBadge`, `Timeline`                                         | FR-10, FR-19, FR-21, FR-22, FR-23, FR-31, FR-32 |
| Quotation         | `QuotationPage`, `EstimateTable`, `RateSnapshot`, `PaymentAccountBlock`, `PolicyBlock` | FR-15, FR-16, FR-28                             |
| Ring viewer       | `RingViewer`, `ViewerControls`, `ViewerFallback`, `OptionPicker`                       | FR-01 to FR-07                                  |
| Payments          | `PaymentProofUpload`, `PaymentProofBadge`, `ReasonDialog`                              | FR-17, FR-18, FR-30                             |
| Claiming          | `ClaimCode`, `ReleaseForm`                                                             | FR-19, FR-20, FR-29, FR-49                      |
| Owner alerts      | `PendingCount`, `ActionQueue`                                                          | FR-50                                           |
| Chatbot           | `ChatPanel`, `DraftSummary`, `SubmitConfirmation`                                      | FR-35 to FR-40                                  |

Requirement numbers are taken from the screen coverage table in [11-ui-screens.md section 8](11-ui-screens.md#8-fr-coverage). Check them against [01-requirements.md](01-requirements.md) at review.

## 14. Not verified

- No component has been built or rendered. Contrast values and focus visibility are calculated or specified, not measured.
- Lucide icon names (`file-pen`, `send`, `eye`, `badge-check`, `package`, `package-check`, `inbox`, `search`, `hammer`, `wrench`, `receipt`, `banknote`, `undo-2`, `circle-slash`, `octagon-x`, `hourglass`, `rotate-3d`) are not checked against the installed version.
- The shadcn chat components (`message-scroller`, `bubble`, `attachment`, `marker`) and their prop names come from the shadcn skill text, not from an installed project.
- A 3 px double border showing two lines, and `touch-action: pan-y` behavior with drei `OrbitControls`, are expected from browser behavior but not tested.
- React Three Fiber and drei behavior is taken from the threejs-react-three-fiber skill (targets fiber 9.8 and drei 10.7). Installed versions are not yet in `package.json`.

## 15. Open points

- **Swatch color.** Allowed in chips and the 3D scene only (recommended) or greyscale texture swatches. The user decides ([DESIGN.md section 9](../DESIGN.md#9-metal-and-gemstone-swatches-open-point)).
- **Expired payment proof.** The source lists three proof states. The meaning and treatment of an expired proof here is a proposal.
- **Typed confirmation in chat.** Button as the only submit action is proposed. The source says the customer "tells the chatbot to submit".
- **Ready-made statuses.** Provisional until N45 is settled.
- **Service draft flow.** Assumed the same as custom orders (N14).
- **Claim code format and unclaimed period.** Open (D-24, N88).
- **Payment channels, refund policy text, whether Accept is blocked when a policy is empty.** Open (D-05, D-22, owner interview).
- **Queue ordering and grouping.** Proposal, to confirm with the owner.
- **Chatbot limits.** Rate limit and message length (N54).
- **Where status treatments are defined.** [DESIGN.md section 11](../DESIGN.md#11-status-and-validation-without-color) lists some statuses by class. This file assigns the rest (Received, Under assessment, Design approved, Down payment verified, Declined) and uses a 3 px double border for Rejected. DESIGN.md section 11 now matches.
- **Owner interview.** Logo, brand colors and fonts, and which jewelry sells most may change the wordmark, product card and homepage emphasis.

## 16. Related documents

- [DESIGN.md](../DESIGN.md): tokens, typography, status system, focus, forms, shadcn mapping.
- [11-ui-screens.md](11-ui-screens.md): screens, states and the FR coverage table.
- [04-flowcharts.md](04-flowcharts.md): status lifecycles and flows.
- [08-decisions.md](08-decisions.md): decision log.
- [13-ux-content-a11y.md](13-ux-content-a11y.md): microcopy, accessibility and review checklist (written in a separate step).

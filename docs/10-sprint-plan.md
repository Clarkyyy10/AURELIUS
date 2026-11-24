# Sprint Plan

Source: manuscript Section 3.2 (Agile Scrum, two-week sprints), updated for the decision to build the transaction core first and the 3D viewer in parallel (N62).

> **Open:** the deadline, the number of sprints, and which sprints fall in Capstone 1 versus Capstone 2 are unknown (N64, N65). Ask Sir Jonas. The sprint list below shows order and content only. Add dates and a sprint count once the deadline is known.

## Roles

| Role | Who |
| --- | --- |
| Product Owner | Store owner (accepts completed features) |
| Scrum Master | One proponent (to be named) |
| Development Team | The other proponents |
| Adviser | Jonas Macapagal |

Each sprint is two weeks: planning, work, a review of the working build with the owner, then a retrospective. Owner comments go into the product backlog for the next sprint.

## Phases

| Phase | Name | Output |
| --- | --- | --- |
| 1 | Planning | Scope, modules, technologies, roles, initial backlog, sprint schedule |
| 2 | Requirements analysis | Owner interview, observation, document review. Requirements confirmed with the owner. Baseline workload log starts. |
| 3 | System design | Schema, use cases, data flows, ERD, mockups, chatbot flow. Architecture review before development. |
| 4 | Sprint development and testing | Working increments with unit and integration tests each sprint and an owner review at the end of each. |
| 5 | System testing | All modules integrated and tested against every functional requirement. |
| 6 | System evaluation | Instrument validation, pilot, 30 respondents, workload trial. |
| 7 | Deployment and handover | Production accounts, orientation, documentation, maintenance guide, account and code transfer. |

## Order of work (Phase 4)

The transaction core goes first. The 3D viewer progresses in parallel and ships small. Sprints are numbered in order. A sprint may hold more than one workstream.

| Sprint | Transaction core | Parallel: 3D viewer and chatbot |
| --- | --- | --- |
| S0 | Repository scaffold, CI, Husky, Supabase and Vercel projects, Prisma schema from `03-erd.md`, auth with email verification, Turnstile | Spike: render one procedural ring band in React Three Fiber and check load and update time |
| S1 | Owner and customer roles, Row Level Security, owner TOTP, admin settings (options, rates, payment accounts, policies), product catalog with stock and archive | Plain band with metal, color, size. Estimate engine for the band (unit tests against the owner's worked example). |
| S2 | Ready-made orders, reservations and expiry, payments (cash and transfer proof), owner verification, order status tracking | Solitaire style and gemstone options. Stone slots. |
| S3 | Service catalog, service requests, inspection, binding quotation, service status flow, down payment and balance | Side-stone style. Itemized estimate display. WebGL fallback. |
| S4 | Custom order flow from viewer designs: Draft, Submit, review, revision, approval, quotation with rate snapshot | Viewer to order integration. Draft reopen notice when the estimate changed. |
| S5 | Notifications and email through Resend, owner alerts, daily digest, claim codes, release record, unclaimed-item reminders, cancellation and settlement records | Chatbot service: database grounding, rate limit, scope checks |
| S6 | Walk-in profiles and owner-entered orders, profile linking, transaction history | Chatbot drafts for custom and service requests, Filipino and Taglish tests |
| S7 | Hardening: security fixes, performance, record integrity, backup and restore test, accessibility, mobile layout | Optional: pendant style if time allows |

If time runs out, drop in this order: pendant style, extra ring styles, transaction history (FR-48), chatbot FAQ answers (FR-38), in-app notification polish. The transaction core and the plain-band viewer are the minimum that must work end to end for the defense.

## After development

| Step | Content |
| --- | --- |
| System testing | Run every Must-priority test case. Fix defects. |
| Instrument validation | Adviser and two IT experts review the questionnaire. Pilot with 10 outside people. Cronbach's alpha. |
| Evaluation | 30 respondents with guided exploration. Owner workload trial. |
| Handover | Production accounts, orientation, user documentation, maintenance guide, one-page data guide, handover checklist, then 3 months of bug-fix support (proposed). |

## Definition of done (per backlog item)

- Meets the requirement text and its pending-change notes in `01-requirements.md`.
- Unit tests for logic, integration tests for database and storage.
- Lint, type check and build pass in CI.
- Reviewed and approved in a pull request (see `../CONTRIBUTING.md`).
- Reviewed with the owner in the sprint review.

## Risks

| Risk | Mitigation |
| --- | --- |
| 3D viewer takes longer than planned | Ship the plain band only. Other styles are optional. |
| Owner interview answers change decisions | Keep provisional decisions in `08-decisions.md`. Re-check after the interview. |
| Deadline unknown | Ask Sir Jonas before fixing the sprint count. |
| 44 Must requirements are too many | Re-grade before sprint 1 (N63). |
| Free tiers cannot meet uptime or backup targets | Decide on evaluation hosting early (N36). |

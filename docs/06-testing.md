# Testing and Evaluation

Source: manuscript Section 3.14 (Tables 5 to 9), with grill-me decisions marked as additions. Criteria come from the NFR table in `01-requirements.md`.

## Approach

Testing runs in stages. Defects found in one stage are fixed before the next stage starts. Testing runs on a local laptop first and then on a Vercel staging link with the same setup as the live site. Only fictitious data is used. The proponents record each result and each defect in a test log. After testing come pilot testing, instrument validation and respondent evaluation.

## Table 5. Test types and criteria

| Test type       | What it verifies                                                                                | Pass criterion                                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Unit            | One small part of the code: form validation, price estimates, status updates, role access rules | All unit test cases pass                                                                                   |
| Integration     | Two or more parts working as one flow: Next.js with Supabase, file upload to Supabase Storage   | All integration test cases pass. Run in each sprint.                                                       |
| Functional      | Each key user flow, from start to end, in a real browser                                        | Every test case matches its expected result                                                                |
| System          | All four modules working as one system                                                          | 100% of Must-priority test cases pass before the evaluation                                                |
| Usability       | Whether users finish task scenarios without help                                                | At least 80% of participants complete the scenarios unaided. Every message states the problem and the fix. |
| Performance     | Load time, response time, model size, concurrent users                                          | Every target in Table 7 is met                                                                             |
| Security        | Access control, passwords, sessions, input handling, uploads, transport                         | No injection or XSS flaw. All unauthorized access attempts refused.                                        |
| Compatibility   | Four browsers, smartphone screens, WebGL fallback                                               | All core flows pass in each browser                                                                        |
| Reliability     | Uptime, record integrity, validation, backup and restore                                        | Uptime at least 95%. No critical failure. No partial or duplicate records.                                 |
| User acceptance | The owner's administrator tasks in the live workflow                                            | The owner accepts the build                                                                                |

## Unit and integration testing

- Vitest for unit tests: form validation, price estimates, status updates, role access rules.
- Integration tests: Next.js with Supabase, file upload to Supabase Storage. Run in each sprint.
- **Additions from the decisions:** estimate engine against the owner's manual computation, reservation and quotation expiry, claim code uniqueness, reference number uniqueness, snapshot immutability after a rate change, role field not client-writable.

## Functional and system testing

Playwright runs one test case per key flow, with the expected result written before the test runs. System testing starts after all four modules are complete. All Must-priority cases must pass (100%) before evaluation.

## Table 6. Test cases for key flows

| Test case | Flow                           | Expected result                                                                                                                                            |
| --------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-01     | Registration and login         | The user registers, verifies the email, and logs in. Cloudflare Turnstile checks each authentication form.                                                 |
| TC-02     | 3D design change               | The viewer updates at once when the user changes the material, color, gemstone, or size. The display matches the selected options.                         |
| TC-03     | Price and weight estimate      | The estimate matches the manual computation with the same rates. Price rounds to the nearest peso and weight to 0.01 g. Covers at least 20 configurations. |
| TC-04     | Order and quotation            | The customer submits an order. The owner issues a quotation. The customer accepts or declines it.                                                          |
| TC-05     | Payment proof upload           | The system accepts JPG, PNG, or PDF up to 5 MB. It rejects other file types and larger files.                                                              |
| TC-06     | Service request and tracking   | The customer submits a service request. The owner updates the status. The customer sees the new status.                                                    |
| TC-07     | Chatbot, in-scope question     | The chatbot gives a correct and relevant answer. At least 80% of at least 50 test queries pass.                                                            |
| TC-08     | Chatbot, out-of-scope question | The chatbot refers the customer to the owner. It gives no final price and no completion date. All out-of-scope queries pass.                               |
| TC-09     | Owner administration           | The owner adds, edits, and hides products, services, and 3D options and rates without developer help.                                                      |
| TC-10     | Access control                 | A customer cannot open another customer's record, including by direct URL and request changes.                                                             |

### Proposed additional test cases (from decisions)

| Test case | Flow                         | Expected result                                                                                                                                                         |
| --------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-11     | Chat to draft to submit      | Confirmation in chat saves a Draft only. The owner sees nothing and gets no alert. A second explicit confirmation or a viewer submit creates the request and the alert. |
| TC-12     | Filipino and Taglish chatbot | The 50-query set includes about 30% Filipino and Taglish queries. Accuracy is reported separately for English and Filipino/Taglish. Scope detection works in all three. |
| TC-13     | Rate change after submission | A rate change does not alter a submitted design or an issued quotation. A reopened draft shows a notice.                                                                |
| TC-14     | Reservation expiry           | An unpaid reservation expires after the owner's deadline and the unit returns to stock.                                                                                 |
| TC-15     | Claim and release            | The owner records recipient, date and balance. The system warns on a non-zero balance.                                                                                  |
| TC-16     | Owner two-factor             | The owner account cannot sign in without TOTP. Public registration cannot create an owner.                                                                              |
| TC-17     | Walk-in profile              | The owner creates a profile and a request for a customer without an account. The same status flow works. Linking to a later account is manual.                          |
| TC-18     | Cancellation and settlement  | Cancellation before a verified down payment needs no settlement. After it, the owner records the outcome and the customer is notified.                                  |
| TC-19     | Chatbot limits               | The rate limit and message length cap hold. An unsupported piece is referred to the store.                                                                              |

Each result and status (Pass or Fail) goes in the test log. Chapter 4 reports the full table with actual results.

## Usability testing

Each customer participant tries a custom order request and a service request without help, except for the chatbot's guidance. At least 80% of customer participants must complete both. At least 80% of owner-group and business-owner participants must complete the owner task scenarios without developer help, after an orientation session. The proponents record each task result, error and point of confusion. All user text and error messages are checked against a review checklist.

## Performance testing

Measured on a low-spec laptop and the staging link, at least three runs each, averaged.

### Table 7. Performance targets

| Measure                                     | Target                                       |
| ------------------------------------------- | -------------------------------------------- |
| Standard page load, broadband               | 3 seconds or less                            |
| Standard page load, 4G mobile data          | 5 seconds or less                            |
| 3D viewer, first load of the base model     | 5 seconds or less                            |
| 3D viewer, display update per option change | 3 seconds or less                            |
| 3D model file size                          | 5 MB or less per file                        |
| Chatbot response time per message           | 5 seconds or less                            |
| Concurrent users                            | Within the targets above with up to 30 users |

Rows on the 3D viewer's base model and file size need rewording for a procedural viewer (N2, N4). Use time to first render and total viewer asset size.

## Security testing

- Only logged-in users reach transactional features. Others are redirected to login.
- Role-based access in all modules, including direct URL access and request changes.
- Passwords hashed (bcrypt or similar), minimum 8 characters, never plain text.
- Sessions end after 30 minutes without activity and at logout.
- Login blocked for 15 minutes after 5 consecutive failures.
- Turnstile protects login, registration and password reset.
- OWASP Top 10 checklist and sample attack inputs on all server-side inputs. No injection or XSS flaw may remain.
- HTTPS on all pages. HTTP redirects.
- Upload checks on type and size on the server. Uploaded files cannot run as code.
- **Additions:** owner TOTP, role field protection, claim code unguessability, chatbot rate limit.

## Compatibility testing

All core flows pass on current and previous major versions of Chrome, Firefox, Edge and Safari. All customer and owner workflows work on a 360 px wide screen or larger. The viewer is also tested on a low-spec laptop. Without WebGL, a clear message appears and the options stay usable.

## Reliability and backup testing

- Uptime of at least 95% during evaluation, excluding announced maintenance. No critical failure (core function stops or data is lost).
- Record integrity: close the browser and cut the connection during submissions of orders, quotations, service requests and payments. The record saves in full or not at all.
- Form validation: every defined rule works with a descriptive message.
- Daily backups kept at least 7 days. One restore test before deployment.
- **Open (N36, N95):** free Supabase tiers cannot meet backup and uptime targets. Pick a paid plan for evaluation or limit the targets to production. Name the uptime monitor.

## User acceptance testing

The owner tests the administrator tasks in the live workflow: products, services, orders, quotations, payments, and 3D options and rates. The owner confirms each task works without developer help. The proponents fix each major problem and the owner repeats the failed task. The system moves to respondent evaluation only after the owner accepts the build.

## Pilot testing and instrument validation

The capstone adviser and two IT experts review the questionnaire. It is revised and pilot tested with 10 people outside the 30 respondents. Internal consistency is checked with Cronbach's alpha, and weak items are revised.

## Evaluation by respondents

Thirty respondents, chosen by purposive sampling. Each gets access to the system and a period of guided exploration, then answers the questionnaire on paper or online. The proponents answer process questions only.

### Table 8. Respondent groups

| Respondent group       | Count | What the group rates                                                                               |
| ---------------------- | ----- | -------------------------------------------------------------------------------------------------- |
| Store owner and family | 5     | Fit of the system with the day-to-day work of the store                                            |
| Customers              | 20    | Usability, clarity of the 3D viewer, ease of ordering, service tracking, and help from the chatbot |
| Business owners        | 5     | Use of the system for a small, owner-run business that handles orders, services, and payments      |

### Table 9. Evaluation criteria

| Criterion              | What the respondent rates                                                      |
| ---------------------- | ------------------------------------------------------------------------------ |
| Functional Suitability | The system gives the functions that the owner and the customers need.          |
| Performance Efficiency | The system responds within a proper time under normal use.                     |
| Usability              | Users can learn the system and use it with ease and satisfaction.              |
| Reliability            | The system works in a steady way and without failure under set conditions.     |
| Security               | The system protects data and blocks access, use, or change without permission. |

Five-point Likert scale (5 Strongly Agree to 1 Strongly Disagree). A criterion with a weighted mean of 3.51 or higher is acceptable. Items below 3.51 are flagged. Compatibility and Maintainability are not in the questionnaire. They are verified through compatibility testing and the owner acceptance test.

**Additions from the decisions:**

- Reliability and Security items are reworded to what a respondent can observe (N91), for example "The system did not crash or lose my entries during my session."
- These two ratings reflect perceived quality only (N92).
- The overall score is the perceived score. Do not average it with measured results (N94).
- Report the measured evidence (uptime, defect log, restore test, OWASP results, TC-10) in a separate table (N93).

## Owner workload baseline and trial (N56)

| Part     | Method                                                                                                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baseline | During requirements gathering the owner logs, for 1 to 2 weeks, inquiries and follow-ups per day and time per quotation. Counts and times only, no customer names.                            |
| Trial    | During or after evaluation the owner handles scripted scenarios (custom order, service request, payment, status inquiry) in AURELIUS and in the current manual way. The proponents time both. |
| Report   | Descriptive numbers only. One owner and a short trial, stated as a limitation.                                                                                                                |

Scenario scripts and log formats are not defined yet (N58, **Open**).

## Defect documentation and retesting

Each defect entry states the test case, the defect, severity, steps to repeat, expected result, actual result, the fix and the retest result. An entry closes only after the retest passes. Respondent evaluation does not start with an open major defect.

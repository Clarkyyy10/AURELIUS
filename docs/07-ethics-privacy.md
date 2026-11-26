# Ethics and Data Privacy

Source: manuscript Section 3.15 (Table 10), with grill-me additions marked. The study follows the Data Privacy Act of 2012 (Republic Act No. 10173).

## Table 10. Summary of ethical safeguards

| Safeguard               | Main measure                                                                                      | Section |
| ----------------------- | ------------------------------------------------------------------------------------------------- | ------- |
| Informed consent        | Written consent from each respondent before the test. Privacy notice and consent at registration. | 3.15.1  |
| Voluntary participation | Respondents may stop or skip any question at any time without penalty.                            | 3.15.2  |
| Permissions             | Written consent of the store owner. Permission before audio recording.                            | 3.15.3  |
| Confidentiality         | Anonymous questionnaire with codes R01 to R30. Group results only.                                | 3.15.4  |
| Access control          | Only the proponents and the capstone adviser access raw data. Role-based access in the system.    | 3.15.5  |
| Data minimization       | Only data that the study and the system need.                                                     | 3.15.6  |
| Retention and disposal  | Study data kept only until the study is complete. Test data deleted after testing.                | 3.15.9  |
| Legal compliance        | Compliance with RA 10173.                                                                         | 3.15.10 |

## Informed consent

Each respondent gives written consent before the test. The form states the purpose, the tasks, the data collected, and how it is used and protected. The system shows a data privacy notice at registration and needs consent before collecting personal data (FR-45).

**Open (N31):** owner-created walk-in profiles never see the notice. Decide how consent is captured, for example a "customer informed and consented" box with a timestamp, or a signed paper form.

## Voluntary participation

Participation is voluntary. A respondent can stop or skip any question without penalty. The owner can withdraw at any time.

## Permissions

The proponents get the store owner's written consent to take part, to allow observation of store operations, and to allow review of store records. They ask permission before audio recording and use the recording only for the study. Family members, customers and business owners receive the same study information and consent before answering.

## Confidentiality and anonymity

The questionnaire is anonymous. Respondents get codes R01 to R30, used in all tables, forms and reports. Consent forms are kept separate from response forms. Only group results are reported. Interview notes and the audio recording stay private.

## Access control

- Only the proponents and the capstone adviser access raw research data.
- Supabase Auth manages accounts and passwords. Passwords are never stored in plain text. All connections use HTTPS. The Gemini API key stays on the server.
- Row Level Security lets each customer access only their own records. Personal data is visible only to the account holder and the owner.
- Cloudflare Turnstile protects login, registration and password reset.
- The store has no employees, so no other system role exists. This is a deliberate design choice (N72).
- **Additions:** the owner account is created by the proponents at handover, requires TOTP two-factor, and cannot be created through public registration (N67, N68). Recovery uses the owner's recovery email and one-time backup codes kept on paper (N69).

## Data minimization

The questionnaire collects ratings only, no names. The system collects only what a transaction needs: contact details, orders, service requests, quotations and payments. No data is collected for other purposes or sold. Personal data is not shared outside parties without consent.

**Addition (N61):** the owner workload baseline and trial record counts and times only, no customer names.

## Payment proof and uploaded files

Customers upload proof of payment as an image or PDF. Files are stored only in a private Supabase Storage bucket with no public link. Authorized users open a file through a short-lived signed link. JPG, PNG or PDF up to 5 MB, checked by type and size on the server before saving.

**Addition (N107):** the owner may attach in-store photos of items (JPG or PNG, up to 5 MB, owner-only, private storage). Customers cannot upload reference images.

## Chatbot disclosure and limits

The chatbot uses Google Gemini 2.5 Flash. A notice inside the chatbot says Gemini processes the chat text and tells users not to enter sensitive data (passwords, bank details, government ID numbers). The chatbot gives general guidance only. It gives no final price and promises no completion date. It refers price and inspection questions to the owner (FR-39, FR-40).

**Additions:**

- Say that on a free Gemini tier, Google may use text to improve its products. The notice must match the environment (N37). Verify the provider terms first (N35).
- Say that the owner can read chat transcripts (N55).
- Chat transcripts are linked to the customer and kept for 90 days, visible only to the owner and the account holder (N53, proposed).
- The chatbot accepts English, Filipino and Taglish (N39).

## Retention and disposal

All study data is kept in a secure place only until the study is complete. The audio recording and personal information are then deleted. Test data (fake accounts and orders) is deleted after testing. Only coded responses, computed scores and summary results remain. Consent forms are kept securely until the school no longer needs them and then destroyed.

**Addition (N115):** this section covers the study period. After handover the owner is responsible for live customer data under the Data Privacy Act. The proponents give the owner a one-page guide on data requests and breach reporting. **Open:** whether the owner must register with the National Privacy Commission.

## Compliance with the Data Privacy Act of 2012

The proponents collect only the data the study needs and use it only for the stated purpose. A respondent can ask what data is held, ask for corrections, and ask for deletion. Each valid request is honored.

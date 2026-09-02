# DigiLocker (sandbox mode) + Tamper Detection Engine

Two additions: a fully working DigiLocker flow that runs in **sandbox mode** today and switches to the real Partner API the moment credentials exist, and a **DTD (Document Tamper Detection)** engine that runs real forensic checks on every upload instead of relying only on the AI's opinion.

## 1. DigiLocker — wire it now, credentials later

Build the complete integration shape, with a mock issuer standing in for the government endpoint:

- **Consent flow**: clicking "DigiLocker" opens a Meri Pehchaan-style consent screen (mobile/Aadhaar entry, OTP step, consent checkbox listing exactly which documents the app will pull). In sandbox mode any 6-digit OTP works and a banner clearly marks it as "Sandbox — no real DigiLocker data".
- **Issued document list**: after consent, the app shows the issued documents available for the requested checklist items (Aadhaar, PAN, marksheets, driving licence, etc.), each with issuer name, issue date and a "digitally signed" badge.
- **Pull into slot**: selecting a document fills that checklist slot with `source: "digilocker"`, skips the tamper engine (issuer-signed), and marks the verdict as issuer-verified with a high confidence score.
- **Credential switch**: one server-side check for `DIGILOCKER_CLIENT_ID` / `DIGILOCKER_CLIENT_SECRET`. Absent → sandbox issuer. Present → real OAuth authorize/token/issued-files/file-fetch calls, with the same UI. No UI rewrite needed later.

## 2. DTD — tamper detection on uploaded documents

Every uploaded file goes through a deterministic forensic pass **before** the AI verdict, and the two are combined.

Checks that run in the app (no external service):

- **Metadata forensics** — EXIF/XMP software tags (Photoshop, GIMP, Canva, Snapseed), missing camera data on a "photo", modify-date later than create-date.
- **PDF structure forensics** — producer/creator strings, incremental updates (multiple `%%EOF` markers = edited after signing), object stream anomalies, mixed embedded fonts on a single line, pages that are one flat re-encoded image.
- **JPEG recompression / ELA** — error level analysis: regions that survive re-compression differently from their surroundings are highlighted as splice candidates; double-quantization signature in the JPEG tables.
- **Copy-move / duplicate-block detection** — repeated identical pixel blocks (a common way to cover an old number or date).
- **Noise & edge consistency** — locally uniform blocks pasted into a noisy scan.
- **Hash duplicate check** — perceptual hash of every uploaded document compared against others in the same application to catch the same file submitted twice under different names.

The AI forensic pass keeps its role (font-weight, alignment, date logic, seals/signatures) and its findings are merged into one signal.

**Scoring and gating**: a single `tamperScore` 0–100 with a `none / low / medium / high` band. Any `high` band, or `medium` plus AI-suspected tampering, forces `status: "rejected"` — the model can no longer return "verified" on a document the engine flags. `medium` alone forces "warning" with manual review.

**In the UI**: a "Tamper Analysis" panel on the processing column showing the score, the band, each triggered check with a plain-language explanation, the ELA heat-map thumbnail when an image was spliced, and an AI insight explaining what to do (re-scan original, get re-issued copy, pull from DigiLocker instead).

## Technical notes

- New `src/lib/tamper.server.ts` (pure forensic analysis) called from `verify.functions.ts` inside the handler; runs on raw bytes before the Gemini call.
- PDF structure parsing reuses the already-installed `unpdf` plus raw byte scanning; image analysis is done with pure-JS pixel work (no native `sharp`, which the Worker runtime cannot run).
- New `src/lib/digilocker.functions.ts` with `startDigilockerConsent`, `verifyDigilockerOtp`, `listIssuedDocuments`, `fetchIssuedDocument`; sandbox issuer data lives in `src/lib/digilocker-sandbox.server.ts`.
- `DocVerdict` gains `tamperScore`, `tamperChecks[]` and `elaPreview`; `SlotState.source` already supports `digilocker`.
- Sandbox mode is never silent: the UI always labels it, so a demo cannot be mistaken for a real government pull.

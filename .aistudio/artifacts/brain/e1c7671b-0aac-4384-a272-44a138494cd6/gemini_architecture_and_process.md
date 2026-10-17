# NeuralKey eKYC & Digital Identity Platform
## System Architecture & Google Gemini AI Verification Process

---

## 1. Executive Overview

**NeuralKey** is an end-to-end electronic Know Your Customer (**eKYC**) and W3C-inspired Verifiable Credential (**VC**) platform. It combines a step-by-step mobile identity capture workflow with **Google Gemini (`gemini-3.8-flash`)** multimodal vision analysis, automated 3-way data cross-checking, human-in-the-loop compliance review, and cryptographic credential issuance (`HMAC-SHA256`).

Instead of relying on brittle, template-locked OCR engines, the platform uses **Google Gemini Multimodal AI** on the backend to simultaneously inspect:
1. **Declared Applicant Metadata** (Full Name, National ID Number, Date of Birth, Nationality)
2. **ID Document Images** (Front & Back visual inspection + Machine Readable Zone / MRZ decoding)
3. **Live Biometric Selfie Capture** (Facial similarity & presentation attack / spoof detection)

---

## 2. High-Level System Architecture

```text
+-----------------------------------------------------------------------------------+
|                           CLIENT LAYER (React 19 + Vite)                          |
|                                                                                   |
|  +-----------------------------+               +-------------------------------+  |
|  |   Applicant Mobile View     |               |       Reviewer Console        |  |
|  | - Step 1: ID Front & Back   |               | - Verification Queue          |  |
|  | - Step 2: Face Liveness     |               | - 3-Way Cross-Check Table     |  |
|  | - Step 3: Gemini AI Check   |               | - Forensic & Risk Scoreboard  |  |
|  | - Digital ID Wallet & QR    |               | - Approve / Escalate / Reject |  |
|  +--------------+--------------+               +---------------+---------------+  |
+-----------------|----------------------------------------------|------------------+
                  | Relative HTTP POST                           | Relative HTTP POST
                  | /api/verify/analyze                          | /api/credentials/*
                  v                                              v
+-----------------------------------------------------------------------------------+
|                        APPLICATION SERVER (Node.js + Express)                     |
|                                    server.ts                                      |
|                                                                                   |
|  +-------------------------------------+   +-----------------------------------+  |
|  |     Gemini AI Orchestration         |   |   Cryptographic VC Engine         |  |
|  | - Base64 Image & MIME Normalization |   | - Canonical Payload Builder       |  |
|  | - System Prompt & Forensic Rules    |   | - HMAC-SHA256 Signature Generator |  |
|  | - Strict JSON Schema Enforcement    |   | - Timing-Safe Signature Verifier  |  |
|  | - Response Sanitization & Fallback  |   | - Revocation Registry             |  |
|  +------------------+------------------+   +-----------------------------------+  |
+---------------------|-------------------------------------------------------------+
                      | HTTPS (TLS 1.3)
                      | @google/genai SDK (x-goog-api-key)
                      v
+-----------------------------------------------------------------------------------+
|                         GOOGLE GENERATIVE AI CLOUD API                            |
|                  https://generativelanguage.googleapis.com                        |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                       Model: gemini-3.8-flash                               |  |
|  | - Multimodal Vision Encoder (ID Card Image + Live Selfie Image)             |  |
|  | - Visual Inspection Zone (VIZ) OCR & Font/Layout Tamper Analysis            |  |
|  | - ICAO 9303 Machine Readable Zone (MRZ) Parsing & Checksum Validation       |  |
|  | - Face Comparison & Liveness / Presentation Attack Detection                |  |
|  | - Structured JSON Output Generation (Controlled Generation via Schema)      |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 3. End-to-End Verification Process (Step-by-Step)

### Phase 1: Strict Sequential Applicant Capture (Mobile View)
The mobile workflow enforces a strict sequential state machine (`step01Done` -> `step02Done` -> `step03Done`):
1. **Step 01 — ID Document Capture (Front & Back):**
   - The applicant first captures or uploads the **Front of the ID Card** (`frontCaptured = true`).
   - Once the front is captured, the UI transitions to capture the **Back of the ID Card** (`backCaptured = true`), where the barcode and Machine Readable Zone (MRZ) reside.
2. **Step 02 — Biometric Face Scan (Unlocked only after Step 01 completes):**
   - The applicant performs a live camera selfie scan or uploads a portrait photo.
   - Multi-point facial alignment and liveness indicators verify that a real person is present.
3. **Step 03 — AI Document & Identity Check (Unlocked only after Step 02 completes):**
   - The client packages the applicant's declared form data alongside the base64-encoded ID document (`documentImageBase64`) and selfie (`selfieImageBase64`) and dispatches a `POST /api/verify/analyze` request.

---

### Phase 2: Google Gemini Multimodal Processing (`POST /api/verify/analyze`)
When `server.ts` receives the verification payload, it executes the Gemini verification pipeline:

#### Step 2.1: Base64 & MIME-Type Normalization
The server inspects the incoming Data URLs (`data:image/jpeg;base64,...`, `image/png`, or `image/webp`), extracts the exact MIME type, strips the header prefix, and builds a multimodal `parts` array for the `@google/genai` SDK:
- **Part 1 (`inlineData`):** Raw base64 bytes of the ID Document image + detected MIME type.
- **Part 2 (`inlineData`):** Raw base64 bytes of the Live Selfie image + detected MIME type.
- **Part 3 (`text`):** Forensic prompt containing the applicant's declared profile (`fullName`, `documentNumber`, `dateOfBirth`, `nationality`, `documentType`) and strict instructions for forensic inspection.

#### Step 2.2: Multimodal Forensic Prompting
Gemini is instructed as a **Senior Forensic Identity Document Examiner** to execute four parallel tasks in a single inference pass:
1. **Visual Inspection Zone (VIZ) Extraction:** Read all printed fields on the front of the ID card (Name, ID Number, Date of Birth, Expiry Date, Issuing Country).
2. **Machine Readable Zone (MRZ) Extraction:** Read the 2-line or 3-line ICAO 9303 security band on the ID card and parse the encoded name, ID number, birth date, and check digits.
3. **3-Way Cross-Check & Tamper Detection:** Compare the **Submitted Profile** vs. **Printed ID Text (VIZ)** vs. **MRZ Security Band**. Any discrepancy (such as a birth year mismatch or altered characters) is immediately flagged.
4. **Biometric & Spoof Assessment:** Compare the live selfie against the portrait printed on the ID card and evaluate screen replay, glare, moiré patterns, or font kerning anomalies.

#### Step 2.3: Controlled JSON Generation (`responseSchema`)
To guarantee deterministic integration with the UI modals and Reviewer Console, the request sets `responseMimeType: "application/json"` and enforces a strict `Type.OBJECT` schema:

| JSON Property | Type | Purpose in Application |
| :--- | :--- | :--- |
| `riskLevel` | `LOW` \| `MEDIUM` \| `HIGH` | Drives the badge status (`Approved`, `Needs Review`, `High Risk`) |
| `overallConfidence` | `NUMBER` (0–100) | Displayed in the Verification Scoreboard & AI Audit Modal |
| `faceMatchScore` | `NUMBER` (0–100) | Biometric similarity score between ID portrait and live selfie |
| `livenessScore` | `NUMBER` (0–100) | Confidence that the selfie is a live person and not a screen/photo spoof |
| `documentTamperScore` | `NUMBER` (0–100) | Probability of digital/physical manipulation on the ID card |
| `extractedVisualZone` | `OBJECT` | Printed fields extracted from the front of the ID (`fullName`, `documentNumber`, `dateOfBirth`, `expiryDate`, `issuingCountry`) |
| `extractedMrzZone` | `OBJECT` | Parsed MRZ fields + `rawLines` array + `checksumValid` boolean |
| `consistencyChecks` | `ARRAY<OBJECT>` | List of specific security checks (`checkName`, `passed`, `detail`) |
| `flaggedReasons` | `ARRAY<STRING>` | Bullet points of anomalies found (empty if clean) |
| `summaryReasoning` | `STRING` | Plain-language explanation for the compliance officer |
| `recommendedAction` | `APPROVE` \| `MANUAL_REVIEW` \| `REJECT` | AI recommendation displayed in the Reviewer Console |

#### Step 2.4: Server-Side Normalization & Fail-Safe Fallback
Before returning the response to the frontend, `server.ts` normalizes every nested object and array so missing or partial fields never cause UI rendering errors. If `GEMINI_API_KEY` is not set in the environment, the endpoint gracefully falls back to deterministic forensic profiles so offline demonstrations continue to work seamlessly.

---

### Phase 3: Dynamic Cross-Check & Reviewer Console

Once the backend returns the `GeminiVerificationAnalysis` JSON object, the frontend updates three core views:

1. **AI Verification Result Modal (`GeminiVerificationAuditModal.tsx`):**
   - Dynamically computes whether the 3-way check passed (`allCrossChecksPassed`).
   - Shows the live `extractedVisualZone` and `extractedMrzZone` values extracted by Gemini alongside the confidence score and plain-language summary.
2. **3-Way Information Comparison (`ExtractionCrossCheck.tsx`):**
   - Normalizes and compares **Submitted** vs. **Printed on ID** vs. **ID Security Band (MRZ)** for every key field:
     - Full Name
     - ID Number
     - Date of Birth
     - Expiry Date
     - Country
   - Highlights exact field mismatches in red/amber and lists each item from `consistencyChecks`.
3. **Risk Assessment & Human Decision (`GeminiRiskPanel.tsx` & `ReviewerConsole.tsx`):**
   - Displays Gemini's `summaryReasoning` and `flaggedReasons`.
   - The human reviewer records a decision (**Approve**, **Escalate**, or **Reject**), which is logged to the immutable **Activity Log**.

---

### Phase 4: Cryptographic Credential Issuance & Verification

When an applicant is **Approved**:
1. **Issuance (`POST /api/credentials/issue`):**
   - The server constructs a W3C-style Verifiable Credential payload containing the verified claims (`fullName`, `documentNumber`, `nationality`, `assuranceLevel`).
   - It signs the canonical payload using `crypto.createHmac('sha256', VC_SIGNING_SECRET)` and returns the signed credential and QR payload to the Applicant Wallet.
2. **Cryptographic Verification (`POST /api/credentials/verify`):**
   - Any relying party can verify the credential. The server checks the revocation registry, recomputes the expected `HMAC-SHA256` digest, and performs a constant-time comparison (`crypto.timingSafeEqual`) to detect even a 1-character tampering attempt.

---

## 4. Additional Gemini AI Endpoints in `server.ts`

Beyond the primary `/api/verify/analyze` pipeline, the backend exposes two additional Gemini-powered endpoints:

1. **`POST /api/identity-verify/submit` (Document Authenticity Check):**
   - Uses `gemini-3.8-flash` to inspect uploaded national ID, passport, or driver's license images and return a structured authenticity report (`isAuthentic`, `confidence`, `extractedIdNumber`, `documentTypeDetected`, `reasoning`).
2. **`POST /api/gemini-assistant/chat` (Interactive Forensic Assistant):**
   - Uses `gemini-3.8-flash` with live contextual injection of the currently selected applicant's forensic metrics, allowing compliance officers to ask follow-up questions about specific anomalies.

---

## 5. Production Deployment Checklist

1. **Environment Configuration (`.env`):**
   - `GEMINI_API_KEY`: Your Google AI Studio / Gemini API key (kept strictly server-side).
   - `VC_SIGNING_SECRET`: A 256-bit secret string used for signing Verifiable Credentials.
   - `PORT`: Defaults to `3000`.
2. **Build & Run Commands:**
   - Install dependencies: `npm install`
   - Build frontend bundle: `npm run build`
   - Start production server: `npm start` (`node server.ts` or `tsx server.ts`)
3. **Security Best Practices:**
   - The frontend communicates with `/api/*` using relative paths on the same origin; `GEMINI_API_KEY` is never exposed to the browser bundle.
   - Replace the in-memory revocation `Set` and audit log array with PostgreSQL / Firestore for multi-instance horizontal scaling.

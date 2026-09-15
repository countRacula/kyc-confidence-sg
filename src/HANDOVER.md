# KYC Confidence (SG) — Handover Pack

**Last updated:** 15 September 2026
**Published app:** https://smekycplatform.base44.app
**Platform:** Base44 (backend-as-a-service: auth, database, integrations, hosting)
**Stack:** React 18 + Vite + Tailwind CSS + shadcn/ui, deployed via Base44

---

## 1. Purpose

KYC Confidence (SG) is a web app for Singaporean SMEs to assess **vendor, supplier, and client onboarding risk** using an explainable, in-house scoring engine. Each assessment produces a 0–100 score, a risk band, a component breakdown, key scoring factors, and recommended actions. Organisations can invite team members, manage counterparty records, run assessments, and review historical outcomes.

---

## 2. How to run locally

1. Clone the repository.
2. `npm install`
3. Create `.env.local`:
   ```
   VITE_BASE44_APP_ID=<app_id>
   VITE_BASE44_APP_BASE_URL=https://smekycplatform.base44.app
   ```
4. `npm run dev`
5. Publish changes from the Base44 Builder (Publish button).

There is a **Test database** and a **Production database**. The current mode is Production. To operate on test data, set `data_env="dev"` in database tool calls.

---

## 3. Architecture overview

### Frontend
- **React + Vite** SPA, Tailwind CSS, shadcn/ui components.
- **Routing:** `src/App.jsx` wraps routes in `AuthProvider`, `QueryClientProvider`, `BrowserRouter`, and a `Toaster`. Pages are registered in `src/pages.config.js` and rendered through a `LayoutWrapper` that applies `src/Layout.jsx` (sidebar + mobile bottom nav). The main/landing page is `Landing`.
- **Auth:** handled by the Base44 platform (`AuthProvider` in `src/lib/AuthContext.jsx`, `useAuth` hook in `src/components/auth/useAuth.jsx`). No custom auth backend.
- **Data access:** all entity reads/writes go through the pre-initialised SDK in `src/api/base44Client.js` (`base44.entities.<Name>`).

### Backend
- **Entities** (JSON schemas in `base44/entities/`): `Organisation`, `Counterparty`, `Assessment`, `AuditLog`, `NegativePressCheck`, `Document`, plus the built-in `User`.
- **Backend functions** (Deno, `base44/functions/<name>/entry.ts`):
  - `sendInviteEmail` — sends an invitation email via `base44.integrations.Core.SendEmail`.
- **Integrations used:** `Core.InvokeLLM` (with `add_context_from_internet: true` for sanctions and adverse-media searches), `Core.SendEmail`, `Core.UploadPublicFile`.

---

## 4. Data model

| Entity | Purpose | Key fields |
|---|---|---|
| `Organisation` | Tenant/workspace | `name`, `industry`, `org_size_type` (SME/Enterprise), `settings` (scoring weights) |
| `User` (built-in) | App users | `email`, `full_name`, `role`, plus custom `org_id`, `org_role` (admin/user) |
| `Counterparty` | Vendor/supplier/client record | `org_id`, `name`, `uen`, `entity_type`, `start_date`, ownership & governance fields |
| `Assessment` | A completed assessment | `org_id`, `counterparty_id`, `inputs`, `computed_metrics`, `component_scores`, `total_score`, `risk_band`, `hard_stop_flag`, `reasons`, `recommended_actions` |
| `AuditLog` | Security audit trail | `org_id`, `user_email`, `action`, `entity_type`, `entity_id`, `details`, `timestamp` |
| `NegativePressCheck` | Cached adverse-media search results | `org_id`, `counterparty_id`, `inputs`, `results`, `rollup_summary`, `cached_until` |
| `Document` | Uploaded files (ACRA profile, financials, other) | `org_id`, `counterparty_id`, `assessment_id`, `file_url`, `file_name`, `file_type` |

Built-in attributes on every record: `id`, `created_date`, `updated_date`, `created_by_id`.

---

## 5. Pages

| Page | Route | Purpose |
|---|---|---|
| `Landing` | `/` | Public marketing/landing page |
| `Onboarding` | `/Onboarding` | First-run organisation creation (admin becomes the creator); checks for duplicate orgs |
| `AcceptInvite` | `/AcceptInvite` | Secure invitation acceptance (prevents duplicate org creation) |
| `Dashboard` | `/Dashboard` | Org overview: counterparty counts, assessment activity, risk distribution, recent assessments (clickable to view details) |
| `Records` | `/Records` | Manage vendor/supplier/client records (CRUD, search, filters, document upload) |
| `Assessment` | `/Assessment` | Runs the assessment wizard for a selected counterparty |
| `Archive` | `/Archive` | Searchable catalogue of all past assessments; click any row to view full score sheet, breakdown, factors, and recommended actions |
| `Reports` | `/Reports` | Reporting view |
| `NegativePressCheck` | `/NegativePressCheck` | Standalone adverse-media search |
| `Settings` | `/Settings` | Organisation settings (including scoring weights) |
| `UserManagement` | `/UserManagement` | Admin-only: invite users, assign roles, view pending invites and audit log |
| `FreeAssessment` | `/FreeAssessment` | Free/trial assessment flow |

`src/Layout.jsx` renders the sidebar (desktop) and bottom tab bar (mobile) for `Dashboard`, `Records`, `Reports`, `Settings`. Public pages (`Landing`, `Onboarding`) bypass the layout.

---

## 6. The scoring engine (`src/components/scoring/scoringEngine.jsx`)

A deterministic, explainable engine — no AI in the score itself. Total score is out of 100 across four components:

| Component | Max | What it scores |
|---|---|---|
| **SG Presence** | 30 | Company status, age, address type, SG bank account, SG signatory |
| **Ownership & Control** | 30 | Ownership locale, shareholding complexity, governance changes, UBO clarity |
| **Financial Health** | 40 | Profitability, liquidity, solvency, cash buffer (4 × 10) |
| **Red Flags** | 10 | Sanctions, adverse media, inconsistencies (starts at 10, deducts) |

**Hard stops** (score forced to 0, band `fail`):
- Company is struck off.
- Sanctions/watchlist concern flagged.

**Risk bands:** `green` (≥80), `amber` (≥60), `red` (≥40), `high_risk` (<40), `fail` (hard stop).

**SME vs Enterprise:** SMEs enter financials via ranges (midpoints used); Enterprises enter exact figures. Range logic lives in `src/components/assessment/financialRanges.jsx`.

**Recommended actions** are generated from the component scores and financial metrics (e.g. require upfront deposit, personal guarantee, enhanced due diligence).

The full assessment is run by `runFullAssessment(inputs, counterparty)` and persisted to the `Assessment` entity from `StepResults.jsx`.

---

## 7. Assessment flow

1. `Assessment.jsx` loads the org's counterparties and renders `AssessmentWizard`.
2. Wizard steps: select counterparty → SG presence → ownership → financials → red flags → results.
3. `StepResults` runs `runFullAssessment`, shows the score gauge, breakdown bars, key factors, and recommended actions, and saves to the `Assessment` entity on click.
4. Completed assessments appear on the Dashboard (recent) and in the Archive (full history with detail modal).

---

## 8. Sanctions & adverse-media checks

Both are **AI-mediated web searches** using `InvokeLLM` with `add_context_from_internet: true`. There are no direct sanctions-database or news-API integrations wired up today.

- **Sanctions** (`src/components/sanctions/sanctionsService.jsx`): a single prompt asks the LLM to search UN, OFAC, EU, MAS, UK, INTERPOL lists for the company, UEN, and directors. Returns structured findings, overall assessment, and a recommendation.
- **Adverse media** (`src/components/adverseMedia/adverseMediaService.jsx`): a single prompt asks the LLM to search for negative press (fraud, lawsuits, insolvency, enforcement, etc.). Returns articles with per-article summaries, tags, severity, and an overall signal. The file also contains unused helpers for GDELT and Google News RSS — the live path (`performNegativePressSearch`) only uses the LLM-with-web-search approach.

Results feed the Red Flags component of the score.

---

## 9. Invitation & onboarding flow

1. Admin invites a user from `UserManagement` by email and role.
2. `sendInviteEmail` backend function sends an email with an accept-invite link.
3. Invitee opens `AcceptInvite`, which attaches them to the existing organisation (preventing duplicate org creation).
4. New admins who sign up independently create a new organisation via `Onboarding` (with duplicate-org detection on company name).

All invitation actions are recorded in the `AuditLog` entity.

---

## 10. Key files

| Path | Role |
|---|---|
| `src/App.jsx` | Router, auth/providers, layout wrapping |
| `src/pages.config.js` | Page registry + main page (`Landing`) + layout binding |
| `src/Layout.jsx` | Sidebar + mobile bottom nav + user menu |
| `src/components/auth/useAuth.jsx` | Auth hook (user, org, permissions) |
| `src/components/scoring/scoringEngine.jsx` | Deterministic scoring engine |
| `src/components/assessment/AssessmentWizard.jsx` | Multi-step assessment wizard |
| `src/components/assessment/StepResults.jsx` | Results display + save to `Assessment` |
| `src/components/sanctions/sanctionsService.jsx` | Sanctions check (LLM + web search) |
| `src/components/adverseMedia/adverseMediaService.jsx` | Adverse-media search (LLM + web search) |
| `src/pages/Archive.jsx` | Historical assessments catalogue with detail modal |
| `src/pages/Dashboard.jsx` | Org dashboard with recent assessments |
| `src/pages/UserManagement.jsx` | Admin user management + audit log |
| `base44/functions/sendInviteEmail/entry.ts` | Invitation email backend function |
| `base44/entities/*.jsonc` | Entity schemas |

---

## 11. Known considerations / next steps

- **Sanctions and adverse-media checks are LLM-mediated web searches**, not direct database or RSS feeds. The `adverseMediaService` file contains unused GDELT/Google News RSS helpers that could be wired up for more traceable sources.
- **Archive** currently lists up to 1000 most recent assessments; consider pagination if volumes grow.
- **No payment integration is configured.** Stripe is available in the SG region if monetisation is needed.
- **No app connectors are authorised** (e.g. Google, Slack). These can be added from the Builder.
- Scoring weights are stored per organisation in `Organisation.settings` but the engine currently uses fixed component maxes (30/30/40/10); weight overrides are not yet applied in `runFullAssessment`.
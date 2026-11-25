# PROJECT AUDIT — SHALOM CONNECTHUB INDIA

**Audit Date**: 2026-11-25  
**Audited Workspace**: `e:\MYWORKSPACE` and `e:\MYWORKSPACE\SHALOM CONNECTHUB INDIA`  
**Audit Phase**: Phase 0 (Pre-Development Audit & Preservation)

---

## 1. Current Architecture

### Target Project Folder (`e:\MYWORKSPACE\SHALOM CONNECTHUB INDIA`)
- **Status**: Newly initialized empty project folder (`2026-11-25`).
- **Existing Codebase**: **None**. No `package.json`, `src/`, `supabase/`, `migrations/`, `.env`, or `.git` repository exists inside `SHALOM CONNECTHUB INDIA`.
- **Workspace Context**: `e:\MYWORKSPACE` is a multi-project container holding 15+ independent project folders (`BILLBOOK-SAAS`, `school`, `SHALOM`, `MYDRIVE`, `WHATSAPP-AUTOMATION`, `prayforindia`, `CHURCH-MISSIONS`, `GMS`, `Online_Bible_Study`, `Discipleship`, `ICT_Gorakhpur_WebApp_Files`, `connect_friends`, `familyroot`, `MINDSET`, `Writings`, `newsletter`). There is no root `.git` repository in `e:\MYWORKSPACE`; each project maintains its own directory and git repo where applicable.
- **Critical Disambiguation**: `e:\MYWORKSPACE\SHALOM` (`github.com/johnjoyraj/Shalom.git`) is **Shalom Kerala Stores** (an existing retail POS, e-commerce storefront, and Android APK project), **NOT** `SHALOM CONNECTHUB INDIA`. All sibling folders must remain untouched per workspace preservation rules.

### Host Development Environment Audit
| Tool / Runtime | Status | Observed Version / Location | Readiness Impact |
| :--- | :--- | :--- | :--- |
| **Git** | Installed | `git version 2.56.0.windows.2` | Ready to initialize repo in `SHALOM CONNECTHUB INDIA` |
| **Python** | Installed | `Python 3.14.8` (`py` launcher) | Available for auxiliary scripts if needed |
| **Winget** | Installed | `C:\Users\johnj\AppData\Local\Microsoft\WindowsApps\winget.exe` | Can install Node.js LTS & tools if authorized |
| **Node.js / npm** | **MISSING** | Not found in `PATH` or `Program Files\nodejs` | **Blocker for Phase 1** React/Vite/Tailwind/Vitest/Playwright setup |
| **Supabase CLI** | **MISSING** | Not found via `where.exe supabase` | **Needed for Phase 1** local DB/migrations/Edge Functions (or `npx supabase` once Node.js is installed) |
| **GitHub CLI (`gh`)** | **MISSING** | Not found via `where.exe gh` | Optional (standard `git` remote push works) |

---

## 2. Completed Feature Inventory (Inside `SHALOM CONNECTHUB INDIA`)
- **None** (Greenfield project; only Phase 0 folder creation and audit documentation exist so far).

---

## 3. Incomplete / Unbuilt Feature Inventory
All 10 implementation phases in `MASTER_PROJECT_INSTRUCTIONS.md` are **NOT STARTED**:
- **Phase 1**: Core architecture, Vite+React+TS+Tailwind scaffold, Supabase schema + RLS, unified auth, profiles, organisations, All-India location taxonomy, core admin control centre, public shell routes.
- **Phase 2**: Staff Connect (Module A).
- **Phase 3**: Property Connect (Module B).
- **Phase 4**: School Connect (Module C).
- **Phase 5**: Central Subscription, Service Charge, Commission & Razorpay Payment/Invoice Engine.
- **Phase 6**: Common Enquiry Engine, Automation Queue & WhatsApp/Email/Push Notifications.
- **Phase 7**: Independent AI Service Module (listing assistant, EN/HI/ML translation, matching, moderation, customer assistant, spend caps).
- **Phase 8**: PWA (manifest, service worker, offline fallback, safe cache exclusions, mobile optimisation).
- **Phase 9**: Automated Testing (Vitest + Playwright), security & RLS penetration checks, performance tuning.
- **Phase 10**: Production deployment, monitoring, budget alerts (₹2,500–₹4,000/mo target), and final docs.

---

## 4. Existing Errors & Environmental Issues
- **No source code errors** exist inside `SHALOM CONNECTHUB INDIA` because no source files exist yet.
- **Toolchain Blocker**: `node` and `npm` are not installed/on `PATH` on this Windows host, preventing `npm create vite`, `npm install`, `vitest`, `playwright`, and `npx supabase` execution until Node.js LTS is installed.
- **Sibling Project Lessons (Do NOT Import Blindly)**:
  - `e:\MYWORKSPACE\WHATSAPP-AUTOMATION\whatsapp_cloud_api.py` contains hardcoded fallback IDs/verify tokens (`waba_id`, `app_id`, `verify_token`). In ConnectHub, all credentials/secrets must live exclusively in server-side environment variables / Supabase Edge Function secrets.
  - `e:\MYWORKSPACE\SHALOM\database.rules.json` previously suffered public `.read: true` exposure on operational nodes. ConnectHub must enforce strict PostgreSQL RLS from migration #1.

---

## 5. Database Status
- **Target Project Database**: **Not yet provisioned**. No PostgreSQL instance, Supabase project link, or SQL migration files exist for `SHALOM CONNECTHUB INDIA`.
- **Sibling Databases Observed (Separate Systems — Do NOT Modify or Reuse Directly)**:
  - `SHALOM`, `prayforindia`, `school`, `BILLBOOK-SAAS` use Firebase Realtime Database (`adonaibroadcast-11095.firebaseio.com`) and local SQLite (`school/school_database.db`, `GMS/`, `WHATSAPP-AUTOMATION/customers.db`).
  - Per Master Blueprint Section 3, `SHALOM CONNECTHUB INDIA` **must use PostgreSQL (Supabase) as the single source of truth** and **must not duplicate core business records in Firebase**.

---

## 6. Security Issues & Architectural Guardrails Identified
Because the project is greenfield, current security debt inside `SHALOM CONNECTHUB INDIA` is zero, but the audit identifies critical security requirements to build in from Phase 1:
1. **Strict RLS on all user-accessible tables**: Public listing reads vs private profile, document (`candidate_documents`, `property_documents`), payment (`payments`, `invoices`, `refunds`), and organisation-scoped data isolation.
2. **Server-side secret isolation**: Never expose `SUPABASE_SERVICE_ROLE_KEY`, Razorpay `key_secret` / webhook secret, WhatsApp permanent token, or AI API keys in Vite `VITE_*` client bundles.
3. **Payment integrity**: Verify Razorpay signatures and webhooks server-side in Edge Functions with idempotency keys before activating subscriptions or marking invoices paid.
4. **PWA Cache Safety**: Service worker must explicitly bypass/network-only private routes (`/dashboard/*`, `/admin/*`, `/employer/*`, `/owner/*`, `/school-dashboard/*`), Supabase Auth tokens, signed document URLs, and payment endpoints.
5. **Legal & Claim Boundaries**: Never assert legal title verification from uploaded property documents or guarantee candidate qualifications via AI.

---

## 7. Comparison Against Master Blueprint

| Blueprint Area | Required Scope | Current State in ConnectHub | Gap |
| :--- | :--- | :--- | :--- |
| Frontend (`React+TS+Vite+Tailwind+PWA`) | All public + user + employer + owner + school + admin routes | Not created | 100% to build |
| Backend (`Supabase Auth/Postgres/Storage/RLS/Edge`) | Unified auth, org RBAC, 50+ normalized tables, RLS, Edge Functions | Not provisioned | 100% to build |
| Module A: Staff Connect | Employers, candidates, CVs, jobs, filters, applications, shortlist | Not created | 100% to build |
| Module B: Property Connect | Dynamic forms, rental/sale/land, privacy, owner/agent, visits, docs | Not created | 100% to build |
| Module C: School Connect | Directory, profiles, classes, facilities, admissions, staff vacancies | Not created | 100% to build |
| Future Modules Framework | Config-driven categories/flags in Admin | Not created | 100% to build |
| All-India Location Engine | States/UTs → Districts → Cities → PINs → Localities | Not created | 100% to build |
| Subscription & Razorpay Engine | Dynamic plans, charges, commissions, Razorpay, GST invoices, refunds | Not created | 100% to build |
| Enquiry & Notification Engine | Common enquiries, WhatsApp Cloud API, Email, Push, consent, cron | Not created | 100% to build |
| AI Automation Module | Listing assist, EN/HI/ML translation, matching, moderation, chat | Not created | 100% to build |
| Testing & CI | Vitest + Playwright + RLS tests + GitHub repo | Not created | 100% to build |

---

## 8. Features / Patterns Reusable from Sibling Workspace Projects (Reference Only)
*Note: Reuse only domain logic/patterns by clean re-implementation in TypeScript/PostgreSQL — never link to or alter sibling project files.*
1. **GST Calculation & Invoice Formatting** (`BILLBOOK-SAAS`): Intra-state CGST/SGST vs Inter-state IGST splitting logic and Indian Rupees-in-words formatting can inform Phase 5 GST invoice generation.
2. **Meta WhatsApp Business Cloud API v21.0 Integration Pattern** (`WHATSAPP-AUTOMATION/whatsapp_cloud_api.py`): Graph API v21.0 endpoint structure, Indian phone E.164 sanitization (`91...`), and template/webhook payload handling can inform Phase 6 Supabase Edge Functions (implemented securely in TypeScript/Deno with env secrets).
3. **School Domain Data Model Awareness** (`school` & `GMS`): Board/class/facility structures and school subscription concepts inform Module C (`School Connect`).
4. **Trilingual UI Concept (EN/HI/ML)** (`prayforindia`): Supports English, Hindi, and Malayalam — directly aligned with ConnectHub's Phase 7 translation requirement.

---

## 9. Features Needing Improvement (Before Reuse)
- **Authentication**: Sibling projects (`school`, `SHALOM`) used client-side SHA-256 hashes in Firebase RTDB or custom Python auth. ConnectHub will replace this completely with **Supabase Auth + JWT + PostgreSQL RLS + OTP**.
- **Payments**: Sibling projects (`school`, `BILLBOOK-SAAS`) used static/dynamic UPI deep-links (`joy.john@ybl`) with manual UTR entry. ConnectHub requires **Razorpay server-verified Orders, Checkout, Signatures, Webhooks, Idempotency, and Refunds**.
- **WhatsApp**: Sibling `WHATSAPP-AUTOMATION` uses Selenium + Excel in addition to Cloud API. ConnectHub strictly prohibits browser/Selenium WhatsApp automation and must use **Official WhatsApp Business Platform API only**.

---

## 10. Features That Must Be Developed From Scratch
- Complete React + TypeScript + Vite + Tailwind + PWA application shell and unified design system
- Full Supabase PostgreSQL schema (50+ tables across Core, Staff, Property, Schools, Financial, Automation) with migrations & RLS
- Unified multi-role, multi-organisation RBAC system
- All-India hierarchical location dataset and search engine
- Shared indexed search, pagination, saved searches, and duplicate detection
- Modules A (Staff Connect), B (Property Connect), C (School Connect) + Future-module extensibility framework
- Dynamic Plan / Service Charge / Commission Engine + Razorpay backend verification
- Common Enquiry Engine + Scheduled Automation Worker + Notification Delivery & Consent Logs
- Server-side AI Service Module with EN/HI/ML translation and usage/budget caps
- Super Admin Control Centre with role-separated permissions & immutable audit logs
- Vitest + Playwright automated test suite

---

## 11. Recommended Implementation Sequence
1. **Pre-Phase 1 Environment Setup**: Install Node.js LTS (`winget install OpenJS.NodeJS.LTS`), verify `npm` & `npx supabase`, initialize Git inside `e:\MYWORKSPACE\SHALOM CONNECTHUB INDIA`, and link/provision a Supabase project (or local Supabase stack).
2. **Phase 1**: Core architecture, database migrations (Core + Locations + Auth/Orgs + Admin + Audit), RLS policies, React+TS+Vite+Tailwind app shell, public/auth/user/admin core routes.
3. **Phase 2**: Staff Connect (Module A) + tests.
4. **Phase 3**: Property Connect (Module B) + tests.
5. **Phase 4**: School Connect (Module C) + tests.
6. **Phase 5**: Subscription, Service Charges, Commissions & Razorpay Sandbox Payment/Invoice Engine + tests.
7. **Phase 6**: Common Enquiry Engine, Scheduled Jobs & WhatsApp/Email/Push Notifications + tests.
8. **Phase 7**: AI Automation Module (with usage caps & spend alerts) + tests.
9. **Phase 8**: PWA & Mobile Optimisation (with private-route cache exclusions).
10. **Phase 9**: Full Security, RLS Isolation, Accessibility & Performance Testing.
11. **Phase 10**: Production Deployment, Budget Monitoring & Final Documentation.

# CHANGELOG — SHALOM CONNECTHUB INDIA

## [1.0.1] - 2026-11-25 (UPI QR/Intent `73793254@ybl` & Razorpay Checkout Configuration)
### Added & Verified
- **Database Migration**: Added and executed `supabase/migrations/202611250011_razorpay_upi_config.sql` seeding `platform_settings` (`payment_gateway_config` with `upi_vpa: "73793254@ybl"`, `payee_name: "SHALOM CONNECTHUB INDIA"`) and extending `public.payments` with `payment_method`, `upi_vpa`, `upi_utr_reference`, `upi_verification_status`, and `idx_payments_upi_utr_unique`.
- **UPI QR & Razorpay Checkout Services**: Added `src/services/upiRazorpay.ts` (`qrcode` generator, UPI intent URI builder, Razorpay Checkout SDK loader) and extended `src/types/finance.ts` & `src/services/financeStore.ts` with gateway config management, UPI UTR submission (`PENDING` until verified), and Finance Admin UTR verification.
- **UI & Tests**: Updated `PaymentsAndBillingPage.tsx`, `AdminFinancePage.tsx`, and `src/test/financeAndPayments.test.ts` (46/46 Vitest + 3/3 Playwright E2E passing).

## [1.0.0] - 2026-11-25 (Phase 10 — Production Deployment & Documentation Release)
### Added
- **Documentation & CI**: Added `API_DOCUMENTATION.md`, `DEPLOYMENT_GUIDE.md`, `.github/workflows/ci.yml`, and `START_CONNECTHUB_DEV.bat`.
- **Updated Docs**: Finalized `README.md`, `SECURITY_GUIDE.md`, `TESTING_REPORT.md`, `PROJECT_STATUS.md`, and `CHANGELOG.md` covering all Phases 0–10.

## [0.9.0] - 2026-11-25 (Phase 9 — Security, Performance & Playwright E2E)
### Added & Verified
- **Bundle Performance**: Configured `vite.config.ts` `manualChunks` (`react-vendor`, `supabase-vendor`, `icons-vendor`) eliminating all >500 kB chunk warnings (largest chunk `290.60 kB`).
- **Security & Schema Audit**: Added `src/test/securityAudit.test.ts` verifying RLS coverage across all 9 SQL migrations and zero server secrets in `src/` or `dist/`.
- **Browser E2E & Mobile Tests**: Installed `@playwright/test`, added `playwright.config.ts` and `e2e/marketplace.spec.ts` (3/3 headless Chrome tests passing, including `375x812` zero-overflow verification and RBAC route checks).

## [0.8.0] - 2026-11-25 (Phase 8 — PWA & Mobile Optimisation)
### Added
- **PWA Assets**: Added `public/manifest.webmanifest`, `public/icons/icon-192.svg`, `public/icons/icon-512.svg`, `public/offline.html`, and `public/sw.js` with strict cache exclusions for private dashboards, auth, private documents, and Razorpay endpoints.
- **PWA UX & Performance**: Added `PwaBanner.tsx` (install + SW update prompts), `pwaCacheRules.ts`, `imageCompression.ts`, Service Worker registration in `main.tsx`, and route-level `React.lazy` code-splitting in `App.tsx`.
- **Automated Tests**: Added `src/test/pwaAndPerformance.test.ts` (42/42 total tests passing).

## [0.7.0] - 2026-11-25 (Phase 7 — Independent AI Automation Module)
### Added
- **Database & Edge Gateway**: Added `supabase/migrations/202611250009_phase7_ai_module.sql` (4 RLS-enabled AI governance tables) and `supabase/functions/ai-gateway/index.ts` (server-side Gemini API proxy with `GEMINI_API_KEY` isolation, monthly spend cap, and safety guardrails).
- **AI Services & UI**: Implemented `ai.ts`, `aiService.ts`, `/dashboard/ai` (`AiWorkspacePage`), and `/admin/ai` (`AdminAiControlPage`) supporting listing assistant, EN/HI/ML language detection & translation preserving original text, candidate/property matching, moderation flagging, and customer assistant.
- **Automated Tests**: Added `src/test/aiModule.test.ts` (39/39 total tests passing).

## [0.6.0] - 2026-11-25 (Phase 6 — Enquiries, Messaging & Notification Automation)
### Added
- **Database & Edge Worker**: Added `supabase/migrations/202611250008_phase6_enquiries_and_automation.sql` (8 RLS-enabled tables) and `supabase/functions/automation-worker/index.ts` (Meta Graph API v21.0 Official WhatsApp Cloud API + retry queue).
- **Communication & Automation Services**: Implemented `communication.ts` and `communicationStore.ts` (common enquiry engine, 2-way messaging, consent-checked notification dispatcher, deduplication, rate caps, and unanswered-enquiry reminder sweep).
- **User & Admin UI**: Implemented `/dashboard/enquiries` (`EnquiriesInboxPage`), `/dashboard/messages` (`MessagesPage`), `/admin/enquiries`, and `/admin/notifications` (`AdminNotificationsPage`).
- **Automated Tests**: Added `src/test/communicationAndAutomation.test.ts` (35/35 total tests passing).

## [0.5.0] - 2026-11-25 (Phase 5 — Subscription, GST & Razorpay Engine)
### Added
- **Database & Edge Functions**: Added `supabase/migrations/202611250007_phase5_financial_engine.sql` (11 RLS-enabled financial tables) and 3 Razorpay Edge Functions (`razorpay-create-order`, `razorpay-verify-payment`, `razorpay-webhook`) with HMAC-SHA256 verification and idempotency.
- **GST & Finance Services**: Implemented `gstInvoice.ts` (Intra-state CGST/SGST vs Inter-state IGST + Rupees in Words) and `financeStore.ts` (configurable plans, coupons, pre-checkout consent, expiry reminder sweep, and refunds).
- **Billing & Admin Finance UI**: Implemented `/dashboard/payments` (`PaymentsAndBillingPage`), updated `/pricing` (`PricingPage`), and implemented `/admin/plans`, `/admin/subscriptions`, `/admin/payments`, `/admin/refunds`, `/admin/commissions`, `/admin/reports` (`AdminFinancePage`).
- **Automated Tests**: Added `src/test/financeAndPayments.test.ts` (31/31 total tests passing).

## [0.4.0] - 2026-11-25 (Phase 4 — Module C: School Connect)
### Added
- **Database Migration**: Added `supabase/migrations/202611250006_phase4_school_connect.sql` with 6 RLS-enabled tables (`schools`, `school_classes`, `school_facilities`, `admission_enquiries`, `school_staff_vacancies`, `school_gallery`) enforcing cross-school isolation.
- **Public & School Admin Portals**: Implemented `/schools` (`SchoolsDirectoryPage`), `/schools/:slug` (`SchoolProfilePage` with classes, facilities, gallery, staff vacancies, and admission enquiry submission), and `/school-dashboard/*` (`SchoolDashboardPage` for profile, classes/facilities, admission tracking, teaching/non-teaching vacancies, and plans).
- **Automated Tests**: Added `src/test/schoolConnect.test.ts` (26/26 total tests passing).

## [0.3.0] - 2026-11-25 (Phase 3 — Module B: Property Connect)
### Added
- **Database Migration**: Added `supabase/migrations/202611250005_phase3_property_connect.sql` with 7 RLS-enabled tables (`properties`, `property_details`, `property_pricing`, `property_locations`, `property_features`, `property_documents`, `property_enquiries`) enforcing owner/assigned-agent isolation and non-legal-title document disclaimers.
- **Dynamic Form & Privacy Engine**: Implemented `propertyFormRules.ts` and `propertyStore.ts` with address privacy masking (`PUBLIC`, `CITY_LOCALITY_ONLY`, `ON_APPROVED_VISIT`), expiry handling, and moderation reporting.
- **Public & Owner/Agent Portals**: Implemented `/properties`, `/rentals`, `/property-sales`, `/land-plots` (`PropertiesDirectoryPage`), `/listing/:slug` (`PropertyDetailPage` with Buyer/Tenant/Visit enquiries & Report Property), and `/owner/*` (`OwnerDashboardPage`).
- **Automated Tests**: Added `src/test/propertyConnect.test.ts` (22/22 total tests passing).

## [0.2.0] - 2026-11-25 (Phase 2 — Module A: Staff Connect)
### Added
- **Database Migration**: Added `supabase/migrations/202611250004_phase2_staff_connect.sql` with 9 RLS-enabled tables (`candidate_profiles`, `candidate_educations`, `candidate_experiences`, `candidate_documents`, `job_posts`, `job_requirements`, `job_applications`, `application_events`, `recruitment_enquiries`).
- **Public Directories**: Implemented `/staff` (`StaffHubPage`), `/jobs` (`JobsDirectoryPage` with employment-type, qualification, skills, salary, experience, location, sorting & pagination), and `/candidates` (`CandidatesDirectoryPage` with DPDPA CV privacy).
- **Candidate & Employer Portals**: Implemented `/dashboard/applications` (`CandidateDashboardPage` with education/experience/CV upload & status timeline) and `/employer/*` (`EmployerDashboardPage` for posting/pausing jobs, reviewing applicants, authorized CV verification, shortlisting, recruitment enquiries, and subscription quota preview).
- **Automated Tests**: Added `src/test/staffConnect.test.ts` (17/17 total tests passing).

## [0.1.0] - 2026-11-25 (Phase 1 — Core Foundation)
### Added
- **Project & Toolchain**: Initialized Vite + React 19 + TypeScript + Tailwind CSS + React Router + Vitest in `e:\MYWORKSPACE\SHALOM CONNECTHUB INDIA`.
- **Supabase PostgreSQL Schema & RLS**: Added 3 SQL migrations (`202611250001`–`202611250003`) implementing 18 core/governance tables, strict RLS policies, storage buckets (`public-media`, `private-documents`), All-India 36 States/UTs + major cities/PINs seed, and configurable future-module categories.
- **Unified Auth & Multi-Role System**: Registration with DPDPA consent recording, login, OTP verification, password recovery, profile completion, multi-role & organisation management, and account deletion request.
- **Public & User Routes**: Search-first homepage with All-India State/District/City/PIN search, Pricing page, legal/compliance pages (`/terms`, `/privacy`, `/about`, `/contact`, `/help`), module preview routes, and protected `/dashboard/*`.
- **Admin Control Centre**: Protected `/admin/*` views for users, roles, organisations, listings moderation, categories/future-module toggles, All-India locations management, moderation reports, feature flags, and immutable audit logs.
- **Automated Tests**: Added Vitest suite covering RBAC permissions, All-India location search, auth/consent/admin audit flows, RLS migration coverage, and UI rendering.

## [0.0.1] - 2026-11-25 (Phase 0 — Audit & Preservation)
### Added
- Completed existing workspace audit and initialized `MASTER_PROJECT_INSTRUCTIONS.md`, `PROJECT_AUDIT.md`, `EXISTING_FEATURES.md`, `DATABASE_AUDIT.md`, `DEVELOPMENT_ROADMAP.md`, and `PROJECT_STATUS.md`.

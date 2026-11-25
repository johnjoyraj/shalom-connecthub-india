# DEVELOPMENT ROADMAP — SHALOM CONNECTHUB INDIA

**Execution Rule**: Follow phases sequentially. Complete one phase, run automated tests, and update `PROJECT_STATUS.md` before starting the next phase.

---

## Phase 0 — Existing Project Audit & Preservation *(COMPLETED)*
- Inspect `e:\MYWORKSPACE` and verify greenfield status of `SHALOM CONNECTHUB INDIA`.
- Verify host runtime/CLI availability (`git`, `python`, missing `node`/`npm`/`supabase`).
- Create `MASTER_PROJECT_INSTRUCTIONS.md`, `PROJECT_AUDIT.md`, `EXISTING_FEATURES.md`, `DATABASE_AUDIT.md`, `DEVELOPMENT_ROADMAP.md`, `PROJECT_STATUS.md`.

## Prerequisites Before Phase 1
- Install **Node.js LTS** (and npm) on Windows (`winget install OpenJS.NodeJS.LTS` or installer) so Vite, React, TypeScript, Tailwind, Vitest, Playwright, and `npx supabase` can run.
- Initialize Git repository inside `e:\MYWORKSPACE\SHALOM CONNECTHUB INDIA` with `.gitignore` and initial Phase 0 commit.
- Configure Supabase project credentials (`.env.local` for public anon key + URL; Edge Function secrets for server-only keys).

---

## Phase 1 — Core Architecture, Database, Auth, Profiles & Admin Dashboard
- **Frontend Scaffold**: Vite + React + TypeScript + Tailwind CSS + accessible UI component library + React Router.
- **Public & Core Routes**: `/`, `/login`, `/register`, `/verify-otp`, `/forgot-password`, `/complete-profile`, `/dashboard/*`, `/pricing`, `/about`, `/contact`, `/help`, `/terms`, `/privacy`, `/admin/*`.
- **Database & RLS**: Core tables (`profiles`, `user_roles`, `organisations`, `organisation_members`, `categories`, `locations`, `listings`, `listing_media`, `listing_attributes`, `saved_listings`, `reviews`, `verification_records`, `moderation_reports`, `audit_logs`, `platform_settings`, `feature_flags`, `search_logs`, `consent_records`) + All-India location seed (States/UTs + initial districts/cities/PINs).
- **Admin Control Centre**: Users, organisations, listings moderation, categories (including future-module toggles), locations, settings, feature flags, audit logs, admin role separation.
- **Exit Criteria**: Auth flows, RLS isolation tests, location filtering, and admin RBAC pass automated tests.

## Phase 2 — Module A: Staff Connect
- **Schema & RLS**: `candidate_profiles`, `candidate_educations`, `candidate_experiences`, `candidate_documents`, `job_posts`, `job_requirements`, `job_applications`, `application_events`, private CV Storage bucket.
- **Routes**: `/staff`, `/jobs`, `/candidates`, `/employer/*` (jobs, candidates, applications, shortlist, subscription), `/dashboard/applications`.
- **Features**: Job types (full-time, part-time, temporary, contract), qualification/experience/salary/location filters, CV upload/download security, application tracking & shortlisting.
- **Exit Criteria**: End-to-end job post, CV upload privacy check, application lifecycle, and candidate search tests pass.

## Phase 3 — Module B: Property Connect
- **Schema & RLS**: `properties`, `property_details`, `property_pricing`, `property_locations`, `property_features`, `property_documents`, `property_enquiries`, private property-docs Storage bucket.
- **Routes**: `/properties`, `/rentals`, `/property-sales`, `/land-plots`, `/listing/:slug`, `/owner/*` (properties, enquiries, documents, subscription).
- **Features**: Dynamic listing form adapting to property type & purpose; address privacy controls; owner & authorised agent dashboards; visit requests; listing expiry; reporting; non-legal-title disclaimer.
- **Exit Criteria**: Dynamic form validation, agent permission isolation, property search, and enquiry tests pass.

## Phase 4 — Module C: School Connect
- **Schema & RLS**: `schools`, `school_classes`, `school_facilities`, `admission_enquiries`, `school_staff_vacancies`, `school_gallery`.
- **Routes**: `/schools`, `/schools/:slug`, `/school-dashboard/*` (profile, admissions, vacancies, enquiries).
- **Features**: Configurable institution types (schools, colleges, preschools, tuition centres, coaching); board/affiliation, classes, facilities, admission enquiries, teaching/non-teaching recruitment.
- **Exit Criteria**: Cross-school isolation RLS test, directory search, admission enquiry, and staff vacancy tests pass.

## Phase 5 — Subscription, Service Charge & Razorpay Payment Engine
- **Schema & RLS**: `plans`, `plan_features`, `subscriptions`, `subscription_events`, `payments`, `invoices`, `service_charges`, `commission_rules`, `commission_records`, `refunds`, `promotional_coupons`.
- **Edge Functions**: Create Razorpay order, verify signature, process idempotent webhook, issue GST invoice, handle refunds, enforce plan entitlements.
- **Features**: Configurable pricing tiers, monthly/annual, listing credits, featured ads, consent-gated charge preview, expiry reminders (7d/3d/1d/0d).
- **Exit Criteria**: Razorpay sandbox success/failure/duplicate-webhook/refund & entitlement tests pass.

## Phase 6 — Common Enquiry Engine & Notification Automation
- **Schema & RLS**: `enquiries`, `conversations`, `messages`, `notifications`, `notification_templates`, `notification_logs`, `automation_jobs`, `webhook_events`.
- **Edge Functions / Scheduled Jobs**: Enquiry creation & owner notification, unanswered enquiry reminders, expiry automations, retry & failure logging, Official WhatsApp Business Platform API, Email service, FCM Push (respecting user consent & rate limits).
- **Exit Criteria**: Enquiry state machine, deduplication, consent enforcement, and delivery log tests pass.

## Phase 7 — Independent AI Service Module
- **Server-Side AI Edge Functions**: Listing assistant, language detection & translation (EN/HI/ML preserving original text), candidate matching, property matching, moderation flagging, platform customer assistant.
- **Controls**: Monthly token/API spend caps, per-user rate limits, admin feature toggles, disclaimer enforcement.
- **Exit Criteria**: AI endpoint auth/rate-limit tests, translation storage tests, and cap-enforcement tests pass.

## Phase 8 — PWA & Mobile Optimisation
- Web App Manifest, adaptive icons, service worker with offline fallback, install prompt, update notification.
- Strict cache exclusion for auth, documents, payments, and private dashboards.
- Mobile-first Lighthouse responsiveness & accessibility audit.

## Phase 9 — Security & Performance Testing
- Full Vitest unit/integration suite + Playwright E2E suite covering all 22 checklist items in Master Blueprint Section 22.
- RLS cross-tenant penetration tests, image compression & pagination benchmarks, budget projection check (₹2,500–₹4,000/month).

## Phase 10 — Production Deployment & Documentation
- Complete `README.md`, `DATABASE_SCHEMA.md`, `API_DOCUMENTATION.md`, `DEPLOYMENT_GUIDE.md`, `SECURITY_GUIDE.md`, `TESTING_REPORT.md`, `CHANGELOG.md`.
- Production environment checklist, domain/SSL, backup policy, and monitoring alerts.

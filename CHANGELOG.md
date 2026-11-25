# CHANGELOG — SHALOM CONNECTHUB INDIA

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

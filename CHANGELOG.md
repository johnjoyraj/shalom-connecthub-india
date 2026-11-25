# CHANGELOG — SHALOM CONNECTHUB INDIA

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

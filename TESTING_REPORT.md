# TESTING REPORT — SHALOM CONNECTHUB INDIA

**Report Date**: 2026-11-25  
**Phase Tested**: Phase 7 — Independent AI Automation Module (plus Phases 1–6 Regression)

---

## 1. Checks & Automated Suites Executed

| Check / Suite | Command | Result | Scope & Observations |
| :--- | :--- | :---: | :--- |
| TypeScript Check | `npm.cmd run typecheck` | **PASS** | Zero TypeScript errors across `src/` |
| Production Build | `npm.cmd run build` | **PASS** | `tsc -b && vite build` succeeded in 11.11s (`dist/` generated) |
| Unit & Integration Tests | `npm.cmd test` (`vitest run`) | **PASS (39/39)** | 10 test files passed in 16.35s |

---

## 2. Test File Breakdown (39 Tests Passed)
1. `src/test/permissions.test.ts` **(3/3 passed)**:
   - Separation of self-assignable roles vs admin roles.
   - Scoped admin permission isolation (`admin_moderation`, `admin_finance`, `admin_system`, `super_admin`).
   - Primary dashboard route resolution.
2. `src/test/locationsAndSearch.test.ts` **(4/4 passed)**:
   - Verified all 28 States + 8 Union Territories (36 `STATE` records) in `INDIA_LOCATIONS_SEED`.
   - Verified Indian 6-digit PIN code validation (`isValidIndianPincode`).
   - Verified location search & breadcrumb formatting (`formatLocationBreadcrumb`).
   - Verified State hierarchy + PIN filtering and exclusion of unapproved (`PENDING_REVIEW`) listings from public search.
3. `src/test/authAndAdminFlows.test.ts` **(4/4 passed)**:
   - Registration enforces DPDPA Terms & Privacy consent and strips privileged `super_admin`/`admin_finance` roles.
   - Non-admin users are rejected from admin operations; suspended accounts are blocked from login.
   - Admin category toggles and listing approvals record immutable audit logs.
   - SQL migration audit confirms all 18 Phase 1 tables in `202611250001_phase1_core_schema.sql` have `ENABLE ROW LEVEL SECURITY` in `202611250002_phase1_rls_policies.sql`.
4. `src/test/appUi.test.tsx` **(2/2 passed)**:
   - `HomePage` renders All-India search form and approved listings.
   - `PricingPage` renders configurable tiers (`₹199`, `₹499`, `₹1,999`).
5. `src/test/staffConnect.test.ts` **(4/4 passed)**:
   - Job search filters by employment type, qualification, skills, salary, and India location.
   - Employer role guard blocks unauthorized job posting; candidate CV upload + application + duplicate-application blocking work end-to-end.
   - Private CV isolation prevents unrelated employers from accessing candidate CV documents while authorizing the hiring employer.
   - Recruitment enquiries & employer replies work end-to-end, and all 9 Phase 2 tables enforce `ENABLE ROW LEVEL SECURITY`.
6. `src/test/propertyConnect.test.ts` **(5/5 passed)**:
   - Dynamic form rules adapt bedrooms, PG fields, area units, and rent/sale/lease pricing by property type & purpose.
   - Address privacy masks full street addresses for public viewers while revealing them to authorised owners/agents.
   - Owner & assigned authorised-agent isolation blocks unassigned agents from viewing documents or altering properties, and enforces the non-legal-title disclaimer.
   - Visit requests, owner confirmation replies, and moderation reporting work end-to-end, and all 7 Phase 3 tables enforce `ENABLE ROW LEVEL SECURITY`.
7. `src/test/schoolConnect.test.ts` **(4/4 passed)**:
   - Searches schools, preschools, and coaching institutes by institution type, board, classes, facilities, and Indian location.
   - Enforces strict cross-school isolation: School Admin 1 is blocked from accessing or modifying School 2's admission enquiries or facilities.
   - Supports admission enquiry workflow, teaching/non-teaching vacancies, and profile loading.
   - Verifies all 6 Phase 4 SQL tables enforce `ENABLE ROW LEVEL SECURITY`.
8. `src/test/financeAndPayments.test.ts` **(5/5 passed)**:
   - Computes Indian Intra-State CGST/SGST vs Inter-State IGST and Rupees in Words.
   - Enforces pre-checkout consent, rejects invalid Razorpay HMAC-SHA256 signatures, activates subscriptions and issues GST invoices on valid signatures.
   - Handles failed payments and deduplicates duplicate Razorpay webhooks safely without creating duplicate subscriptions or invoices.
   - Runs expiry reminders (`7D`..`0D`), reverts expired entitlements back to Free (`1` listing), and processes refunds via Finance Admin authorization.
   - Verifies all 11 Phase 5 SQL tables enforce `ENABLE ROW LEVEL SECURITY`.
9. `src/test/communicationAndAutomation.test.ts` **(4/4 passed)**:
   - Validates listing availability on enquiry submission, isolates conversation participants, and transitions enquiry status on owner reply.
   - Enforces user notification consent (`SKIPPED_NO_CONSENT`), notification deduplication, and daily channel rate caps (`SKIPPED_RATE_LIMIT`).
   - Runs unanswered enquiry reminder sweep and retries failing automation jobs up to 3 attempts with failure logging.
   - Verifies all 8 Phase 6 SQL tables enforce `ENABLE ROW LEVEL SECURITY`.
10. `src/test/aiModule.test.ts` **(4/4 passed)**:
    - Detects English, Hindi, and Malayalam and preserves `original_text` separately from `en`/`hi`/`ml` translations.
    - Generates listing drafts, candidate/property matches with explicit non-guarantee/non-title disclaimers, and high-severity fraud moderation flags.
    - Enforces admin master/feature toggles (`BLOCKED_DISABLED`) and monthly INR budget caps (`BLOCKED_CAP`).
    - Verifies all 4 Phase 7 SQL tables enforce `ENABLE ROW LEVEL SECURITY`.

---

## 3. Live Cloud Verification Pending
- Live execution of `202611250001`–`202611250003` against Supabase project `fkjiafpcbgqtnkdonrtb` and live browser E2E against `VITE_SUPABASE_ANON_KEY` remain pending until the anon key is placed in `.env.local` and migrations are pushed.

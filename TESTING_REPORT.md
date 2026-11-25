# TESTING REPORT — SHALOM CONNECTHUB INDIA

**Report Date**: 2026-11-25  
**Phase Tested**: Phase 2 — Module A: Staff Connect (plus Phase 1 Core Regression)

---

## 1. Checks & Automated Suites Executed

| Check / Suite | Command | Result | Scope & Observations |
| :--- | :--- | :---: | :--- |
| TypeScript Check | `npm.cmd run typecheck` | **PASS** | Zero TypeScript errors across `src/` |
| Production Build | `npm.cmd run build` | **PASS** | `tsc -b && vite build` succeeded in 8.86s (`dist/` generated) |
| Unit & Integration Tests | `npm.cmd test` (`vitest run`) | **PASS (17/17)** | 5 test files passed in 8.95s |

---

## 2. Test File Breakdown (17 Tests Passed)
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

---

## 3. Live Cloud Verification Pending
- Live execution of `202611250001`–`202611250003` against Supabase project `fkjiafpcbgqtnkdonrtb` and live browser E2E against `VITE_SUPABASE_ANON_KEY` remain pending until the anon key is placed in `.env.local` and migrations are pushed.

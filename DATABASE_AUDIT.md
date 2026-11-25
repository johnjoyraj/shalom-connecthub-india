# DATABASE AUDIT — SHALOM CONNECTHUB INDIA

**Audit Date**: 2026-11-25  
**Primary Database Engine (Target)**: PostgreSQL (via Supabase)  
**Single Source of Truth Policy**: Core business records live exclusively in PostgreSQL. Firebase will NOT be used for core business data.

---

## 1. Current Database Status
- **Existing Tables / Migrations in `SHALOM CONNECTHUB INDIA`**: **0** (greenfield project; `supabase/migrations/` does not exist yet).
- **Existing Seed Data**: None.
- **Database Hosting / CLI Status**: Supabase CLI is not currently installed on this Windows workstation (Node.js/npm also absent). Supabase project credentials (`.env` / project ref) have not yet been configured.

---

## 2. Target Normalized Schema Blueprint (To Be Created Incrementally by Phase)

All tables will use `UUID` primary keys (`gen_random_uuid()`), explicit foreign keys, `created_at` / `updated_at` `timestamptz` columns, B-tree/GIN indexes, and strict Row Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).

### Phase 1 — Core, Auth, Organisations, Locations & Admin Governance
- **CORE**:
  - `profiles` (linked 1:1 to `auth.users`, KYC/verification status, account status, consent summary)
  - `user_roles` (multi-role support: customer, employer, candidate, property_owner, property_agent, school_admin, service_provider, org_member, admin_moderation, admin_finance, super_admin)
  - `organisations` (companies, agencies, schools, service businesses; approval & verification state)
  - `organisation_members` (user ↔ org membership, scoped org permissions)
  - `categories` (hierarchical, module-tagged, admin enable/disable/reorder — enables future modules)
  - `locations` (India → States/UTs → Districts → Cities/Towns → PIN codes → Localities, optional lat/lng)
  - `listings` (unified marketplace listing base record: owner, org, category, location, status, expiry, featured flag)
  - `listing_media` (Supabase Storage paths, ordering, alt text)
  - `listing_attributes` (extensible JSONB/key-value attributes for future modules without schema rebuilds)
  - `saved_listings`
  - `reviews`
  - `verification_records` (audit trail of admin/system verifications; never implies legal title guarantee)
- **ADMIN / GOVERNANCE**:
  - `moderation_reports`
  - `audit_logs` (append-only log of all admin & critical mutations)
  - `platform_settings`
  - `feature_flags`
  - `search_logs`
  - `consent_records` (DPDPA consent tracking: terms, privacy, WhatsApp, email, push, cookies)

### Phase 2 — Module A: Staff Connect
- `candidate_profiles`
- `candidate_educations`
- `candidate_experiences`
- `candidate_documents` (private Supabase Storage bucket; strict owner + applied-employer RLS)
- `job_posts` (linked to `listings`)
- `job_requirements`
- `job_applications`
- `application_events` (status history & shortlisting trail)

### Phase 3 — Module B: Property Connect
- `properties` (linked to `listings`)
- `property_details` (category, purpose, bedrooms, bathrooms, area, measurement unit)
- `property_pricing` (price, rent, deposit, negotiable, maintenance)
- `property_locations` (full address with privacy display flags)
- `property_features` (amenities)
- `property_documents` (private bucket; strict owner/authorised-agent/admin RLS; disclaimer enforced)
- `property_enquiries` (buyer, tenant, and visit requests)

### Phase 4 — Module C: School Connect
- `schools` (linked to `listings` & `organisations`; schools, colleges, preschools, tuition, coaching)
- `school_classes`
- `school_facilities`
- `admission_enquiries`
- `school_staff_vacancies` (teaching & non-teaching)
- `school_gallery`

### Phase 5 — Financial, Subscriptions, Charges & Commissions
- `plans` (admin-configurable; seeded with FREE ₹0, STARTER ₹199, PROFESSIONAL ₹499, BUSINESS ₹999, PREMIUM ₹1,999)
- `plan_features`
- `subscriptions`
- `subscription_events`
- `payments` (Razorpay order_id, payment_id, signature_verified, idempotency_key, status)
- `invoices` (GST-ready sequential numbering, CGST/SGST/IGST breakdown)
- `service_charges`
- `commission_rules`
- `commission_records`
- `refunds`
- `promotional_coupons`

### Phase 6 — Enquiries, Conversations & Notification Automation
- `enquiries` (common enquiry engine across modules with `NEW..CLOSED` lifecycle)
- `conversations`
- `messages`
- `notifications`
- `notification_templates`
- `notification_logs` (delivery status, provider response, cost/quota tracking)
- `automation_jobs` (scheduled queue, retry count, error logs, deduplication key)
- `webhook_events` (Razorpay, WhatsApp Cloud API idempotent webhook inbox)

---

## 3. Mandatory Row Level Security (RLS) Policy Matrix
1. **Public Read**: Only `APPROVED` & non-expired `listings`, public `categories`, `locations`, `schools`, and active `plans`.
2. **Private Profile & Documents**: `profiles`, `candidate_documents`, `property_documents`, `consent_records` accessible only to owner (and authorised employer for a submitted job application CV) + authorised admin.
3. **Organisations & Agents**: `organisation_members` restricts access strictly to that organisation's resources; property agents see only explicitly assigned properties; school admins see only their own school.
4. **Financial Isolation**: `payments`, `invoices`, `subscriptions`, `refunds` readable by owning user/org and `admin_finance` / `super_admin`; writable **only** via verified backend/Edge Functions (`service_role`).
5. **Audit Logs**: Append-only via backend triggers/Edge Functions; readable only by authorised administrators; never deletable by regular users.

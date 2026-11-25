# DATABASE SCHEMA — SHALOM CONNECTHUB INDIA

**Primary Engine**: PostgreSQL 15+ (Supabase project `fkjiafpcbgqtnkdonrtb`)  
**Migrations Applied in Source**:
- `supabase/migrations/202611250001_phase1_core_schema.sql`
- `supabase/migrations/202611250002_phase1_rls_policies.sql`
- `supabase/migrations/202611250003_phase1_india_seed.sql`

---

## Phase 1 Core Tables (18 Normalized Tables, All RLS-Enabled)

| Group | Table | Purpose |
| :--- | :--- | :--- |
| **Auth & Users** | `profiles` | 1:1 with `auth.users`, language (`en`/`hi`/`ml`), verification & suspension/deletion status |
| **Auth & Users** | `user_roles` | Multi-role unified access (`customer`, `employer`, `candidate`, `property_owner`, `property_agent`, `school_admin`, `service_provider`, `org_member`, `admin_*`, `super_admin`) |
| **Organisations** | `organisations` | Companies, agencies, schools, institutions, service businesses |
| **Organisations** | `organisation_members` | User-organisation membership with `OWNER`/`ADMIN`/`MANAGER`/`STAFF`/`AGENT` scoped permissions |
| **All-India Locations** | `locations` | Hierarchical India taxonomy (`COUNTRY` → `STATE` → `DISTRICT` → `CITY` → `PINCODE` → `LOCALITY`) with trigram & PIN indexes |
| **Marketplace Core** | `categories` | Initial (`staff`, `property`, `school`) + admin-toggleable future modules (`home_services`, `business_directory`, etc.) |
| **Marketplace Core** | `listings` | Unified listing base record with status workflow, expiry, featured flag, and moderation notes |
| **Marketplace Core** | `listing_media` | Public/approved media metadata |
| **Marketplace Core** | `listing_attributes` | Extensible attributes for category-specific metadata |
| **Engagement** | `saved_listings` | User bookmarked listings |
| **Engagement** | `reviews` | Published/moderated user reviews (1–5 rating) |
| **Trust & Governance** | `verification_records` | Submission review tracking with mandatory non-legal-title disclaimer |
| **Trust & Governance** | `moderation_reports` | User/abuse/fraud reporting queue |
| **Trust & Governance** | `audit_logs` | Immutable append-only administrative & critical action history |
| **Configuration** | `platform_settings` | Public & internal platform settings (brand, pricing defaults, grievance officer, infra budget target) |
| **Configuration** | `feature_flags` | Admin-toggled module & AI/notification gates |
| **Telemetry & DPDPA** | `search_logs` | Search analytics |
| **Telemetry & DPDPA** | `consent_records` | Timestamped user consent records (`TERMS`, `PRIVACY`, `COOKIES`, `WHATSAPP`, `EMAIL`, `PUSH`, `MARKETING`) |

---

## Phase 2 — Module A: Staff Connect Tables (`202611250004_phase2_staff_connect.sql`, 9 RLS-Enabled Tables)

| Table | Purpose |
| :--- | :--- |
| `candidate_profiles` | Candidate headline, qualification, experience, skills (`GIN`), expected salary, searchability, CV visibility |
| `candidate_educations` | Candidate degrees, boards/universities, years, grades |
| `candidate_experiences` | Work history records (`FULL_TIME`, `PART_TIME`, `TEMPORARY`, `CONTRACT`) |
| `candidate_documents` | Private CV & certificate metadata (strict owner + applied-employer + admin RLS) |
| `job_posts` | Job vacancies linked 1:1 to `listings` (`OPEN`, `PAUSED`, `CLOSED`, salary, work mode, experience) |
| `job_requirements` | Structured skills/qualification/language requirements |
| `job_applications` | Candidate job applications with unique `(job_post_id, applicant_user_id)` constraint |
| `application_events` | Status change audit timeline (`APPLIED` → `SHORTLISTED` → `HIRED` / `WITHDRAWN`) |
| `recruitment_enquiries` | Direct candidate-employer recruitment enquiries and replies |

---

## Phase 3 — Module B: Property Connect Tables (`202611250005_phase3_property_connect.sql`, 7 RLS-Enabled Tables)

| Table | Purpose |
| :--- | :--- |
| `properties` | Property base linked to `listings` (`RENTAL_HOUSE`, `APARTMENT_FLAT`, `INDEPENDENT_HOUSE`, `COMMERCIAL_SHOP`, `OFFICE_SPACE`, `HOSTEL_PG`, `RESIDENTIAL_PLOT`, `AGRICULTURAL_LAND`), purpose, agent assignment, expiry |
| `property_details` | Area + measurement unit, bedrooms/bathrooms, furnishing, PG sharing/meals/gender fields |
| `property_pricing` | Sale price, monthly rent, security deposit, maintenance, lease duration, negotiable flag |
| `property_locations` | State/District/City/PIN/Locality + `full_address` with privacy level (`PUBLIC`, `CITY_LOCALITY_ONLY`, `ON_APPROVED_VISIT`) |
| `property_features` | Property amenities |
| `property_documents` | Private supporting documents with mandatory non-legal-title verification disclaimer (owner + assigned agent + admin only) |
| `property_enquiries` | Buyer, tenant, and visit requests (`NEW` → `VISIT_CONFIRMED` → `COMPLETED` / `CLOSED`) |

---

## Phase 4 — Module C: School Connect Tables (`202611250006_phase4_school_connect.sql`, 6 RLS-Enabled Tables)

| Table | Purpose |
| :--- | :--- |
| `schools` | Schools, colleges, preschools, tuition centres & coaching institutes; board/affiliation, admissions status, plan code |
| `school_classes` | Classes/programs offered, stream/level, age/eligibility, annual fee estimate, seat capacity |
| `school_facilities` | Campus facilities (labs, transport, library, safety, etc.) |
| `admission_enquiries` | Parent/student admission enquiries with strict cross-school RLS isolation |
| `school_staff_vacancies` | Teaching & non-teaching staff recruitment openings |
| `school_gallery` | Campus photos and captions |

---

## Phase 5 — Financial, Subscriptions & Razorpay Tables (`202611250007_phase5_financial_engine.sql`, 11 RLS-Enabled Tables)

| Table | Purpose |
| :--- | :--- |
| `plans` | Admin-configurable plans (`FREE`, `STARTER`, `PROFESSIONAL`, `BUSINESS`, `PREMIUM`) with monthly/annual INR prices & limits |
| `plan_features` | Included feature items per plan |
| `subscriptions` | User/org subscriptions (`PENDING_PAYMENT`, `ACTIVE`, `EXPIRED`, `CANCELLED`) & reminder stages (`7D`, `3D`, `1D`, `0D`) |
| `subscription_events` | Audit trail of activations, renewals, reminders, and expirations |
| `promotional_coupons` | Configurable percentage/fixed discount coupons |
| `payments` | Razorpay order/payment IDs, signature verification flag, idempotency keys, amounts (no card data stored) |
| `invoices` | Sequential Indian GST tax invoices (`INTRA_STATE` CGST+SGST vs `INTER_STATE` IGST + Rupees in Words) |
| `refunds` | User refund requests & Finance Admin processing ledger |
| `service_charges` | Configurable per-listing/per-lead/fixed service charges |
| `commission_rules` | Consent- and contract-gated placement/facilitation commission rules |
| `commission_records` | Recorded facilitation/placement commissions with explicit `contract_accepted` gate |

---

## Phase 6 — Enquiries, Messaging & Automation Tables (`202611250008_phase6_enquiries_and_automation.sql`, 8 RLS-Enabled Tables)

| Table | Purpose |
| :--- | :--- |
| `enquiries` | Common enquiry engine across modules (`NEW` → `VIEWED` → `CONTACTED` → `ACCEPTED`/`REJECTED`/`COMPLETED`/`CANCELLED`/`CLOSED`) + feedback |
| `conversations` | 2-party conversation threads linked to enquiries |
| `messages` | Conversation messages restricted strictly to thread participants |
| `notifications` | User notifications with `dedup_key` uniqueness |
| `notification_templates` | Configurable Email, Official WhatsApp Cloud, Push & In-App templates |
| `notification_logs` | Delivery audit log (`SENT`, `FAILED`, `SKIPPED_NO_CONSENT`, `SKIPPED_RATE_LIMIT`) & INR cost estimates |
| `automation_jobs` | Scheduled job queue with retry attempts, backoff & failure error logging |
| `webhook_events` | Idempotent inbound webhook log (`RAZORPAY`, `WHATSAPP`, `EMAIL`) |

---

## Phase 7 — Independent AI Automation Tables (`202611250009_phase7_ai_module.sql`, 4 RLS-Enabled Tables)

| Table | Purpose |
| :--- | :--- |
| `ai_settings` | Admin-configurable AI master switch, monthly INR budget cap, per-user daily limits, feature toggles |
| `ai_translations` | Preserves `original_language` and `original_text` separately from `en`/`hi`/`ml` translations |
| `ai_usage_logs` | Token & INR spend telemetry (`SUCCESS`, `BLOCKED_CAP`, `BLOCKED_DISABLED`, `ERROR`) |
| `ai_moderation_flags` | AI-flagged duplicate, fraud, or incomplete listings requiring human moderator review |

---

## Razorpay & Direct UPI Gateway Config (`202611250011_razorpay_upi_config.sql`)

- Upserts `platform_settings` key `payment_gateway_config` (`is_public = true`) with configurable `upi_vpa` (`"7379325499@ybl"`), `payee_name` (`"SHALOM CONNECTHUB INDIA"`), `razorpay_enabled: true`, `upi_qr_enabled: true`, and `mode: "SANDBOX"`.
- Alters `public.payments` with `payment_method` (`RAZORPAY_CHECKOUT` / `UPI_INTENT_QR`), `upi_vpa`, `upi_utr_reference`, `upi_verification_status` (`NONE`, `PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`), and unique partial index `idx_payments_upi_utr_unique` on non-null `upi_utr_reference` to prevent UTR replay.

---

## Live Production Finance & Notification RLS Policies (`202611250012_live_finance_rls_and_rpcs.sql`)

- Grants `admin_finance` management on `platform_settings` (`key = 'payment_gateway_config'`).
- Adds trigger `trg_payments_protect_user_fields` (`enforce_payment_user_update_guard()`) preventing non-admin clients from altering payment amounts, order IDs, signature flags, or self-marking `SUCCEEDED`/`VERIFIED`.
- Adds RLS policies for authenticated `CREATED` payment insertion, `PENDING_VERIFICATION` UTR submission, `admin_finance` `payments`/`invoices`/`subscription_events` management, and counterparty-scoped `notifications` inserts.

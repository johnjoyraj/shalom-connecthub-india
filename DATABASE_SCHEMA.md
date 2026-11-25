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

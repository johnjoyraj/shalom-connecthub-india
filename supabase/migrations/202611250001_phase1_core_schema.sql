-- ============================================================================
-- SHALOM CONNECTHUB INDIA — Phase 1: Core Schema, Auth, Locations & Governance
-- Target: PostgreSQL 15+ (Supabase)
-- Single Source of Truth: All core business & governance records live here.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ----------------------------------------------------------------------------
-- 1. Timestamp trigger helper
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. Profiles (1:1 with auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  avatar_url text,
  preferred_language text NOT NULL DEFAULT 'en'
    CHECK (preferred_language IN ('en', 'hi', 'ml')),
  primary_location_id uuid,
  account_status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'PENDING_DELETION', 'DELETED')),
  profile_verified boolean NOT NULL DEFAULT false,
  suspension_reason text,
  deletion_requested_at timestamptz,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (lower(email));
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles (phone);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles (account_status);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. User Roles (Multi-role unified account system)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (
    role IN (
      'customer',
      'employer',
      'candidate',
      'property_owner',
      'property_agent',
      'school_admin',
      'service_provider',
      'org_member',
      'admin_moderation',
      'admin_finance',
      'admin_system',
      'super_admin'
    )
  ),
  is_active boolean NOT NULL DEFAULT true,
  granted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles (role) WHERE is_active = true;

-- ----------------------------------------------------------------------------
-- 4. Locations (All-India Hierarchy: Country -> State/UT -> District -> City -> PIN -> Locality)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code char(2) NOT NULL DEFAULT 'IN',
  level text NOT NULL CHECK (
    level IN ('COUNTRY', 'STATE', 'DISTRICT', 'CITY', 'PINCODE', 'LOCALITY')
  ),
  parent_id uuid REFERENCES public.locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  code text,
  state_code text,
  pincode text CHECK (pincode IS NULL OR pincode ~ '^[1-9][0-9]{5}$'),
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_locations_parent ON public.locations (parent_id);
CREATE INDEX IF NOT EXISTS idx_locations_level ON public.locations (level) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_locations_state_code ON public.locations (state_code);
CREATE INDEX IF NOT EXISTS idx_locations_pincode ON public.locations (pincode) WHERE pincode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_locations_name_trgm ON public.locations USING gin (name gin_trgm_ops);

CREATE TRIGGER trg_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles
  ADD CONSTRAINT fk_profiles_primary_location
  FOREIGN KEY (primary_location_id) REFERENCES public.locations(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 5. Organisations & Memberships
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  org_type text NOT NULL CHECK (
    org_type IN ('COMPANY', 'AGENCY', 'SCHOOL', 'INSTITUTION', 'SERVICE_BUSINESS', 'OTHER')
  ),
  registration_number text,
  gstin text,
  email text,
  phone text,
  website text,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  address_line text,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED')),
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_organisations_owner ON public.organisations (owner_id);
CREATE INDEX IF NOT EXISTS idx_organisations_status ON public.organisations (status);
CREATE INDEX IF NOT EXISTS idx_organisations_type ON public.organisations (org_type);

CREATE TRIGGER trg_organisations_updated_at
  BEFORE UPDATE ON public.organisations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.organisation_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_role text NOT NULL DEFAULT 'STAFF'
    CHECK (member_role IN ('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'AGENT')),
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED')),
  invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (organisation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organisation_members (user_id) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organisation_members (organisation_id) WHERE status = 'ACTIVE';

CREATE TRIGGER trg_org_members_updated_at
  BEFORE UPDATE ON public.organisation_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. Categories (Initial + Future Configurable Modules)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  module_key text NOT NULL CHECK (
    module_key IN (
      'staff',
      'property',
      'school',
      'home_services',
      'business_directory',
      'vehicle_services',
      'transport',
      'construction',
      'event_management',
      'agriculture',
      'professional_services',
      'equipment_rentals',
      'local_services'
    )
  ),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  sort_order integer NOT NULL DEFAULT 100,
  is_enabled boolean NOT NULL DEFAULT true,
  is_future_module boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_categories_module ON public.categories (module_key, sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_enabled ON public.categories (is_enabled);

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 7. Unified Listings, Media & Extensible Attributes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organisation_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL,
  module_key text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  summary text,
  description text,
  status text NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'EXPIRED')),
  is_featured boolean NOT NULL DEFAULT false,
  featured_until timestamptz,
  expires_at timestamptz,
  contact_visibility text NOT NULL DEFAULT 'PLATFORM_ONLY'
    CHECK (contact_visibility IN ('PUBLIC', 'PLATFORM_ONLY', 'ON_REQUEST')),
  moderation_notes text,
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_listings_status_module ON public.listings (status, module_key);
CREATE INDEX IF NOT EXISTS idx_listings_location ON public.listings (location_id) WHERE status = 'APPROVED';
CREATE INDEX IF NOT EXISTS idx_listings_owner ON public.listings (owner_id);
CREATE INDEX IF NOT EXISTS idx_listings_org ON public.listings (organisation_id) WHERE organisation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_featured ON public.listings (is_featured, created_at DESC) WHERE status = 'APPROVED';
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm ON public.listings USING gin (title gin_trgm_ops);

CREATE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.listing_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  media_type text NOT NULL DEFAULT 'IMAGE' CHECK (media_type IN ('IMAGE', 'VIDEO', 'BROCHURE')),
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_listing_media_listing ON public.listing_media (listing_id, sort_order);

CREATE TABLE IF NOT EXISTS public.listing_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  attr_key text NOT NULL,
  attr_value text NOT NULL,
  attr_type text NOT NULL DEFAULT 'TEXT' CHECK (attr_type IN ('TEXT', 'NUMBER', 'BOOLEAN', 'JSON')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (listing_id, attr_key)
);

CREATE INDEX IF NOT EXISTS idx_listing_attrs_key_val ON public.listing_attributes (attr_key, attr_value);

-- ----------------------------------------------------------------------------
-- 8. Saved Listings, Reviews & Verifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_listings_user ON public.saved_listings (user_id);

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  comment text,
  status text NOT NULL DEFAULT 'PUBLISHED'
    CHECK (status IN ('PUBLISHED', 'HIDDEN', 'FLAGGED')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (listing_id, author_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_listing ON public.reviews (listing_id) WHERE status = 'PUBLISHED';

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.verification_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('USER', 'ORGANISATION', 'LISTING')),
  target_id uuid NOT NULL,
  submitted_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  verification_type text NOT NULL,
  document_storage_path text,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED')),
  reviewer_notes text,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  legal_disclaimer_note text NOT NULL DEFAULT 'Document review confirms submission metadata only and does not constitute legal title or statutory certification.',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_verification_target ON public.verification_records (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_verification_status ON public.verification_records (status);

CREATE TRIGGER trg_verification_records_updated_at
  BEFORE UPDATE ON public.verification_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 9. Governance: Moderation Reports, Immutable Audit Logs, Settings, Flags, Search & Consents
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.moderation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('LISTING', 'USER', 'ORGANISATION', 'REVIEW', 'MESSAGE')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED')),
  resolution_notes text,
  resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_moderation_reports_status ON public.moderation_reports (status, created_at DESC);

CREATE TRIGGER trg_moderation_reports_updated_at
  BEFORE UPDATE ON public.moderation_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  before_state jsonb,
  after_state jsonb,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs (actor_id);

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  category text NOT NULL DEFAULT 'GENERAL',
  description text,
  is_public boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER trg_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.feature_flags (
  flag_key text PRIMARY KEY,
  label text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER trg_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  query text,
  module_key text,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_search_logs_created ON public.search_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS public.consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_type text NOT NULL CHECK (
    consent_type IN ('TERMS', 'PRIVACY', 'COOKIES', 'WHATSAPP', 'EMAIL', 'PUSH', 'MARKETING')
  ),
  granted boolean NOT NULL,
  policy_version text NOT NULL DEFAULT '2026-11-25',
  source text NOT NULL DEFAULT 'WEB',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_consent_records_user ON public.consent_records (user_id, consent_type, created_at DESC);

-- ----------------------------------------------------------------------------
-- 10. Automatic Profile Provisioning on Auth Signup
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text;
  v_phone text;
BEGIN
  v_full_name := COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''), split_part(COALESCE(NEW.email, 'User'), '@', 1));
  v_phone := NULLIF(trim(COALESCE(NEW.phone, NEW.raw_user_meta_data ->> 'phone', '')), '');

  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (NEW.id, v_full_name, NEW.email, v_phone)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone);

  INSERT INTO public.user_roles (user_id, role, is_active)
  VALUES (NEW.id, 'customer', true)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 11. Append-Only Audit Log Helper Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_audit_log(
  p_action text,
  p_entity_type text,
  p_entity_id text DEFAULT NULL,
  p_before_state jsonb DEFAULT NULL,
  p_after_state jsonb DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_actor_role text;
  v_log_id uuid;
BEGIN
  SELECT role INTO v_actor_role
  FROM public.user_roles
  WHERE user_id = v_actor_id AND is_active = true
  ORDER BY CASE role
    WHEN 'super_admin' THEN 1
    WHEN 'admin_system' THEN 2
    WHEN 'admin_finance' THEN 3
    WHEN 'admin_moderation' THEN 4
    ELSE 5
  END
  LIMIT 1;

  INSERT INTO public.audit_logs (
    actor_id, actor_role, action, entity_type, entity_id,
    before_state, after_state, reason, metadata
  )
  VALUES (
    v_actor_id, v_actor_role, p_action, p_entity_type, p_entity_id,
    p_before_state, p_after_state, p_reason, COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

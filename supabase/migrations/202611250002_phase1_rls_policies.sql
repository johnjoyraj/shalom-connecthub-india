-- ============================================================================
-- SHALOM CONNECTHUB INDIA — Phase 1: Strict Row Level Security (RLS) & Storage
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Security Helper Functions (SECURITY DEFINER, safe search_path)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(p_user_id uuid, p_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = p_user_id
      AND ur.role = p_role
      AND ur.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.has_any_admin_role(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = p_user_id
      AND ur.role IN ('super_admin', 'admin_moderation', 'admin_finance', 'admin_system')
      AND ur.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(p_user_id uuid, p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organisation_members om
    WHERE om.user_id = p_user_id
      AND om.organisation_id = p_org_id
      AND om.status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(p_user_id uuid, p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organisation_members om
    WHERE om.user_id = p_user_id
      AND om.organisation_id = p_org_id
      AND om.member_role IN ('OWNER', 'ADMIN')
      AND om.status = 'ACTIVE'
  )
  OR EXISTS (
    SELECT 1
    FROM public.organisations o
    WHERE o.id = p_org_id
      AND o.owner_id = p_user_id
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. Enable RLS on ALL 18 Phase 1 Tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. PROFILES Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own non-privileged profile fields; admins can update status/verified
CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_moderation'))
  WITH CHECK (
    auth.uid() = id
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin_moderation')
  );

-- ----------------------------------------------------------------------------
-- 4. USER_ROLES Policies (Prevents self-escalation to admin roles)
-- ----------------------------------------------------------------------------
CREATE POLICY "user_roles_select_own_or_admin"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "user_roles_insert_self_non_admin_or_super_admin"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    (
      auth.uid() = user_id
      AND role IN ('customer', 'employer', 'candidate', 'property_owner', 'property_agent', 'school_admin', 'service_provider', 'org_member')
    )
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "user_roles_update_self_non_admin_or_super_admin"
  ON public.user_roles FOR UPDATE
  USING (
    (auth.uid() = user_id AND role NOT IN ('super_admin', 'admin_moderation', 'admin_finance', 'admin_system'))
    OR public.has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    (auth.uid() = user_id AND role NOT IN ('super_admin', 'admin_moderation', 'admin_finance', 'admin_system'))
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "user_roles_delete_super_admin"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'super_admin'));

-- ----------------------------------------------------------------------------
-- 5. LOCATIONS Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "locations_public_read_active"
  ON public.locations FOR SELECT
  USING (is_active = true OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "locations_admin_manage"
  ON public.locations FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_system'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_system'));

-- ----------------------------------------------------------------------------
-- 6. ORGANISATIONS & ORGANISATION_MEMBERS Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "organisations_select_approved_member_or_admin"
  ON public.organisations FOR SELECT
  USING (
    status = 'APPROVED'
    OR owner_id = auth.uid()
    OR public.is_org_member(auth.uid(), id)
    OR public.has_any_admin_role(auth.uid())
  );

CREATE POLICY "organisations_insert_authenticated"
  ON public.organisations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "organisations_update_owner_org_admin_or_platform_admin"
  ON public.organisations FOR UPDATE
  USING (
    public.is_org_admin(auth.uid(), id)
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin_moderation')
  )
  WITH CHECK (
    public.is_org_admin(auth.uid(), id)
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin_moderation')
  );

CREATE POLICY "org_members_select_member_or_admin"
  ON public.organisation_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_org_member(auth.uid(), organisation_id)
    OR public.has_any_admin_role(auth.uid())
  );

CREATE POLICY "org_members_manage_org_admin_or_platform_admin"
  ON public.organisation_members FOR ALL
  USING (
    public.is_org_admin(auth.uid(), organisation_id)
    OR public.has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    public.is_org_admin(auth.uid(), organisation_id)
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- ----------------------------------------------------------------------------
-- 7. CATEGORIES Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "categories_public_read_enabled"
  ON public.categories FOR SELECT
  USING (is_enabled = true OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "categories_admin_manage"
  ON public.categories FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_system'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_system'));

-- ----------------------------------------------------------------------------
-- 8. LISTINGS, LISTING_MEDIA, LISTING_ATTRIBUTES Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "listings_select_public_or_owner_org_admin"
  ON public.listings FOR SELECT
  USING (
    (status = 'APPROVED' AND (expires_at IS NULL OR expires_at > timezone('utc', now())))
    OR owner_id = auth.uid()
    OR (organisation_id IS NOT NULL AND public.is_org_member(auth.uid(), organisation_id))
    OR public.has_any_admin_role(auth.uid())
  );

CREATE POLICY "listings_insert_owner_or_org_member"
  ON public.listings FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND (organisation_id IS NULL OR public.is_org_member(auth.uid(), organisation_id))
  );

CREATE POLICY "listings_update_owner_org_or_moderator"
  ON public.listings FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR (organisation_id IS NOT NULL AND public.is_org_admin(auth.uid(), organisation_id))
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin_moderation')
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR (organisation_id IS NOT NULL AND public.is_org_admin(auth.uid(), organisation_id))
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin_moderation')
  );

CREATE POLICY "listings_delete_owner_or_admin"
  ON public.listings FOR DELETE
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "listing_media_select_via_listing"
  ON public.listing_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND (
          l.status = 'APPROVED'
          OR l.owner_id = auth.uid()
          OR (l.organisation_id IS NOT NULL AND public.is_org_member(auth.uid(), l.organisation_id))
          OR public.has_any_admin_role(auth.uid())
        )
    )
  );

CREATE POLICY "listing_media_write_owner_or_admin"
  ON public.listing_media FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND (l.owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_moderation'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND (l.owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_moderation'))
    )
  );

CREATE POLICY "listing_attributes_select_via_listing"
  ON public.listing_attributes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND (
          l.status = 'APPROVED'
          OR l.owner_id = auth.uid()
          OR (l.organisation_id IS NOT NULL AND public.is_org_member(auth.uid(), l.organisation_id))
          OR public.has_any_admin_role(auth.uid())
        )
    )
  );

CREATE POLICY "listing_attributes_write_owner_or_admin"
  ON public.listing_attributes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND (l.owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_moderation'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND (l.owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_moderation'))
    )
  );

-- ----------------------------------------------------------------------------
-- 9. SAVED_LISTINGS, REVIEWS, VERIFICATION_RECORDS Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "saved_listings_own_only"
  ON public.saved_listings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_public_read_published"
  ON public.reviews FOR SELECT
  USING (status = 'PUBLISHED' OR author_id = auth.uid() OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "reviews_insert_own"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "reviews_update_own_or_moderator"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_moderation'));

CREATE POLICY "verification_records_own_or_admin"
  ON public.verification_records FOR SELECT
  USING (
    submitted_by = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin_moderation')
  );

CREATE POLICY "verification_records_insert_own"
  ON public.verification_records FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "verification_records_admin_review"
  ON public.verification_records FOR UPDATE
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_moderation'));

-- ----------------------------------------------------------------------------
-- 10. MODERATION_REPORTS, AUDIT_LOGS, SETTINGS, FLAGS, SEARCH_LOGS, CONSENTS
-- ----------------------------------------------------------------------------
CREATE POLICY "moderation_reports_select_reporter_or_moderator"
  ON public.moderation_reports FOR SELECT
  USING (
    reporter_id = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin_moderation')
  );

CREATE POLICY "moderation_reports_insert_authenticated"
  ON public.moderation_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "moderation_reports_update_moderator"
  ON public.moderation_reports FOR UPDATE
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_moderation'));

-- Audit logs: read-only for admins, insert via SECURITY DEFINER RPC only, no UPDATE/DELETE
CREATE POLICY "audit_logs_admin_read_only"
  ON public.audit_logs FOR SELECT
  USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "platform_settings_read_public_or_admin"
  ON public.platform_settings FOR SELECT
  USING (is_public = true OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "platform_settings_admin_system_manage"
  ON public.platform_settings FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_system'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_system'));

CREATE POLICY "feature_flags_public_read"
  ON public.feature_flags FOR SELECT
  USING (true);

CREATE POLICY "feature_flags_admin_system_manage"
  ON public.feature_flags FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_system'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_system'));

CREATE POLICY "search_logs_insert_any_auth_read_admin"
  ON public.search_logs FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "search_logs_select_own_or_admin"
  ON public.search_logs FOR SELECT
  USING (user_id = auth.uid() OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "consent_records_own_or_admin"
  ON public.consent_records FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "consent_records_insert_own"
  ON public.consent_records FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 11. Storage Buckets (Public Listing Media vs Private Verification Documents)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('public-media', 'public-media', true),
  ('private-documents', 'private-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public_media_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'public-media');

CREATE POLICY "public_media_auth_upload_own_folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'public-media'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "private_documents_owner_or_admin_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'private-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'super_admin')
      OR public.has_role(auth.uid(), 'admin_moderation')
    )
  );

CREATE POLICY "private_documents_owner_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'private-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

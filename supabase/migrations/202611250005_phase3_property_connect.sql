-- ============================================================================
-- SHALOM CONNECTHUB INDIA — Phase 3: Module B (Property Connect) Schema & RLS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Properties Base, Details, Pricing, Locations, Features, Docs, Enquiries
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL UNIQUE REFERENCES public.listings(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organisation_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL,
  authorised_agent_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  property_type text NOT NULL CHECK (
    property_type IN (
      'RENTAL_HOUSE',
      'APARTMENT_FLAT',
      'INDEPENDENT_HOUSE',
      'COMMERCIAL_SHOP',
      'OFFICE_SPACE',
      'HOSTEL_PG',
      'RESIDENTIAL_PLOT',
      'AGRICULTURAL_LAND'
    )
  ),
  purpose text NOT NULL CHECK (purpose IN ('RENT', 'SALE', 'LEASE')),
  is_resale boolean NOT NULL DEFAULT false,
  lister_role text NOT NULL DEFAULT 'OWNER' CHECK (lister_role IN ('OWNER', 'AUTHORISED_AGENT')),
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'PAUSED', 'EXPIRED', 'SOLD_OR_RENTED', 'SUSPENDED')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_properties_owner ON public.properties (owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_agent ON public.properties (authorised_agent_id) WHERE authorised_agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_type_purpose ON public.properties (property_type, purpose, status);
CREATE INDEX IF NOT EXISTS idx_properties_expires ON public.properties (expires_at) WHERE status = 'ACTIVE';

CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.property_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL UNIQUE REFERENCES public.properties(id) ON DELETE CASCADE,
  area_value numeric(12, 2) NOT NULL CHECK (area_value > 0),
  area_unit text NOT NULL DEFAULT 'SQ_FT'
    CHECK (area_unit IN ('SQ_FT', 'SQ_YD', 'SQ_M', 'ACRE', 'HECTARE', 'CENT', 'GUNTHA')),
  bedrooms smallint CHECK (bedrooms IS NULL OR bedrooms >= 0),
  bathrooms smallint CHECK (bathrooms IS NULL OR bathrooms >= 0),
  furnishing text CHECK (furnishing IS NULL OR furnishing IN ('UNFURNISHED', 'SEMI_FURNISHED', 'FURNISHED')),
  pg_sharing_type text,
  meals_included boolean,
  gender_preference text CHECK (gender_preference IS NULL OR gender_preference IN ('ANY', 'MALE', 'FEMALE')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER trg_property_details_updated_at
  BEFORE UPDATE ON public.property_details
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.property_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL UNIQUE REFERENCES public.properties(id) ON DELETE CASCADE,
  sale_price bigint CHECK (sale_price IS NULL OR sale_price >= 0),
  monthly_rent integer CHECK (monthly_rent IS NULL OR monthly_rent >= 0),
  security_deposit integer CHECK (security_deposit IS NULL OR security_deposit >= 0),
  maintenance_monthly integer CHECK (maintenance_monthly IS NULL OR maintenance_monthly >= 0),
  lease_duration_months integer CHECK (lease_duration_months IS NULL OR lease_duration_months > 0),
  is_negotiable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_property_pricing_sale ON public.property_pricing (sale_price) WHERE sale_price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_property_pricing_rent ON public.property_pricing (monthly_rent) WHERE monthly_rent IS NOT NULL;

CREATE TRIGGER trg_property_pricing_updated_at
  BEFORE UPDATE ON public.property_pricing
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.property_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL UNIQUE REFERENCES public.properties(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  state_name text NOT NULL,
  district_name text NOT NULL,
  city_name text NOT NULL,
  pincode text NOT NULL CHECK (pincode ~ '^[1-9][0-9]{5}$'),
  locality text NOT NULL DEFAULT '',
  full_address text NOT NULL,
  address_privacy text NOT NULL DEFAULT 'CITY_LOCALITY_ONLY'
    CHECK (address_privacy IN ('PUBLIC', 'CITY_LOCALITY_ONLY', 'ON_APPROVED_VISIT')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_property_locations_pincode ON public.property_locations (pincode);
CREATE INDEX IF NOT EXISTS idx_property_locations_city ON public.property_locations (lower(city_name));
CREATE INDEX IF NOT EXISTS idx_property_locations_loc_id ON public.property_locations (location_id);

CREATE TRIGGER trg_property_locations_updated_at
  BEFORE UPDATE ON public.property_locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.property_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  amenity_key text NOT NULL,
  amenity_label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (property_id, amenity_key)
);

CREATE INDEX IF NOT EXISTS idx_property_features_prop ON public.property_features (property_id);

CREATE TABLE IF NOT EXISTS public.property_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL DEFAULT 'OTHER'
    CHECK (document_type IN ('TAX_RECEIPT', 'UTILITY_BILL', 'AUTHORISATION_LETTER', 'FLOOR_PLAN', 'OTHER')),
  file_name text NOT NULL,
  storage_path text NOT NULL,
  review_status text NOT NULL DEFAULT 'PENDING'
    CHECK (review_status IN ('PENDING', 'UNDER_REVIEW', 'REVIEWED', 'REJECTED')),
  reviewer_notes text,
  disclaimer_text text NOT NULL DEFAULT 'Document review verifies file submission only and does NOT constitute legal property title verification.',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_property_documents_prop ON public.property_documents (property_id);

CREATE TRIGGER trg_property_documents_updated_at
  BEFORE UPDATE ON public.property_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.property_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  authorised_agent_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  enquiry_type text NOT NULL CHECK (enquiry_type IN ('BUYER', 'TENANT', 'VISIT_REQUEST')),
  preferred_visit_date date,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'NEW'
    CHECK (status IN ('NEW', 'VIEWED', 'CONTACTED', 'VISIT_CONFIRMED', 'COMPLETED', 'REJECTED', 'CLOSED')),
  owner_reply text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_property_enquiries_prop ON public.property_enquiries (property_id, status);
CREATE INDEX IF NOT EXISTS idx_property_enquiries_owner ON public.property_enquiries (owner_id, status);
CREATE INDEX IF NOT EXISTS idx_property_enquiries_sender ON public.property_enquiries (sender_id);

CREATE TRIGGER trg_property_enquiries_updated_at
  BEFORE UPDATE ON public.property_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. Enable RLS on ALL Phase 3 Tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_enquiries ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. RLS Policies (Strict Owner & Authorised Agent Isolation)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_manage_property(p_user_id uuid, p_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = p_property_id
      AND (
        p.owner_id = p_user_id
        OR p.authorised_agent_id = p_user_id
        OR (p.organisation_id IS NOT NULL AND public.is_org_admin(p_user_id, p.organisation_id))
      )
  );
$$;

CREATE POLICY "properties_select_public_or_authorized"
  ON public.properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND (
          (l.status = 'APPROVED' AND properties.status = 'ACTIVE' AND (properties.expires_at IS NULL OR properties.expires_at > timezone('utc', now())))
          OR properties.owner_id = auth.uid()
          OR properties.authorised_agent_id = auth.uid()
          OR public.has_any_admin_role(auth.uid())
        )
    )
  );

CREATE POLICY "properties_insert_owner_or_agent"
  ON public.properties FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    OR authorised_agent_id = auth.uid()
  );

CREATE POLICY "properties_update_authorized_or_admin"
  ON public.properties FOR UPDATE
  USING (
    public.can_manage_property(auth.uid(), id)
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin_moderation')
  );

CREATE POLICY "property_details_select_via_property"
  ON public.property_details FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id));

CREATE POLICY "property_details_write_authorized"
  ON public.property_details FOR ALL
  USING (public.can_manage_property(auth.uid(), property_id) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.can_manage_property(auth.uid(), property_id) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "property_pricing_select_via_property"
  ON public.property_pricing FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id));

CREATE POLICY "property_pricing_write_authorized"
  ON public.property_pricing FOR ALL
  USING (public.can_manage_property(auth.uid(), property_id) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.can_manage_property(auth.uid(), property_id) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "property_locations_select_via_property"
  ON public.property_locations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id));

CREATE POLICY "property_locations_write_authorized"
  ON public.property_locations FOR ALL
  USING (public.can_manage_property(auth.uid(), property_id) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.can_manage_property(auth.uid(), property_id) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "property_features_select_via_property"
  ON public.property_features FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id));

CREATE POLICY "property_features_write_authorized"
  ON public.property_features FOR ALL
  USING (public.can_manage_property(auth.uid(), property_id) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.can_manage_property(auth.uid(), property_id) OR public.has_role(auth.uid(), 'super_admin'));

-- Property Documents: STRICT PRIVATE (never public; only owner, authorised agent of THAT property, or admin)
CREATE POLICY "property_documents_select_private"
  ON public.property_documents FOR SELECT
  USING (
    uploaded_by = auth.uid()
    OR public.can_manage_property(auth.uid(), property_id)
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin_moderation')
  );

CREATE POLICY "property_documents_write_authorized"
  ON public.property_documents FOR ALL
  USING (public.can_manage_property(auth.uid(), property_id) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (uploaded_by = auth.uid() AND (public.can_manage_property(auth.uid(), property_id) OR public.has_role(auth.uid(), 'super_admin')));

-- Property Enquiries: strictly sender, owner, authorised agent of that property, or admin
CREATE POLICY "property_enquiries_select_parties"
  ON public.property_enquiries FOR SELECT
  USING (
    sender_id = auth.uid()
    OR owner_id = auth.uid()
    OR authorised_agent_id = auth.uid()
    OR public.has_any_admin_role(auth.uid())
  );

CREATE POLICY "property_enquiries_insert_sender"
  ON public.property_enquiries FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "property_enquiries_update_parties"
  ON public.property_enquiries FOR UPDATE
  USING (
    sender_id = auth.uid()
    OR owner_id = auth.uid()
    OR authorised_agent_id = auth.uid()
    OR public.has_any_admin_role(auth.uid())
  );

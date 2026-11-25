-- ============================================================================
-- SHALOM CONNECTHUB INDIA — Phase 4: Module C (School Connect) Schema & RLS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Schools, Classes, Facilities, Admission Enquiries, Staff Vacancies, Gallery
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL UNIQUE REFERENCES public.listings(id) ON DELETE CASCADE,
  organisation_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL,
  admin_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution_type text NOT NULL DEFAULT 'SCHOOL' CHECK (
    institution_type IN (
      'SCHOOL',
      'COLLEGE',
      'PRESCHOOL',
      'TUITION_CENTRE',
      'COACHING_INSTITUTE'
    )
  ),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  board_affiliation text NOT NULL DEFAULT 'CBSE' CHECK (
    board_affiliation IN (
      'CBSE',
      'ICSE',
      'STATE_BOARD',
      'IB',
      'CAMBRIDGE',
      'NIOS',
      'UNIVERSITY',
      'AUTONOMOUS',
      'OTHER'
    )
  ),
  affiliation_number text,
  medium_of_instruction text[] NOT NULL DEFAULT '{English}'::text[],
  established_year integer,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  state_name text NOT NULL DEFAULT '',
  city_name text NOT NULL DEFAULT '',
  pincode text CHECK (pincode IS NULL OR pincode ~ '^[1-9][0-9]{5}$'),
  contact_email text,
  contact_phone text,
  website text,
  description text NOT NULL DEFAULT '',
  admissions_open boolean NOT NULL DEFAULT true,
  subscription_plan_code text NOT NULL DEFAULT 'FREE',
  status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'PENDING_REVIEW', 'PAUSED', 'SUSPENDED')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_schools_admin ON public.schools (admin_user_id);
CREATE INDEX IF NOT EXISTS idx_schools_type_board ON public.schools (institution_type, board_affiliation, status);
CREATE INDEX IF NOT EXISTS idx_schools_location ON public.schools (location_id);
CREATE INDEX IF NOT EXISTS idx_schools_pincode ON public.schools (pincode) WHERE pincode IS NOT NULL;

CREATE TRIGGER trg_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.school_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_name text NOT NULL,
  stream_or_level text,
  age_or_eligibility text,
  annual_fee_approx integer CHECK (annual_fee_approx IS NULL OR annual_fee_approx >= 0),
  seats_available integer CHECK (seats_available IS NULL OR seats_available >= 0),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_school_classes_school ON public.school_classes (school_id);

CREATE TABLE IF NOT EXISTS public.school_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  facility_key text NOT NULL,
  facility_label text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (school_id, facility_key)
);

CREATE INDEX IF NOT EXISTS idx_school_facilities_school ON public.school_facilities (school_id);

CREATE TABLE IF NOT EXISTS public.admission_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  parent_or_student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  applying_for_class text NOT NULL,
  academic_year text NOT NULL DEFAULT '2027-28',
  contact_phone text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'NEW' CHECK (
    status IN ('NEW', 'VIEWED', 'CONTACTED', 'INTERVIEW_SCHEDULED', 'ADMITTED', 'REJECTED', 'CLOSED')
  ),
  school_reply text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_admission_enquiries_school ON public.admission_enquiries (school_id, status);
CREATE INDEX IF NOT EXISTS idx_admission_enquiries_sender ON public.admission_enquiries (parent_or_student_id);

CREATE TRIGGER trg_admission_enquiries_updated_at
  BEFORE UPDATE ON public.admission_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.school_staff_vacancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  job_post_id uuid REFERENCES public.job_posts(id) ON DELETE SET NULL,
  staff_category text NOT NULL CHECK (staff_category IN ('TEACHING', 'NON_TEACHING')),
  title text NOT NULL,
  subject_or_department text NOT NULL,
  qualification_required text NOT NULL DEFAULT 'Graduate',
  employment_type text NOT NULL DEFAULT 'FULL_TIME'
    CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'TEMPORARY', 'CONTRACT')),
  salary_range_label text,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PAUSED', 'CLOSED')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_school_vacancies_school ON public.school_staff_vacancies (school_id, staff_category, status);

CREATE TRIGGER trg_school_staff_vacancies_updated_at
  BEFORE UPDATE ON public.school_staff_vacancies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.school_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_school_gallery_school ON public.school_gallery (school_id, sort_order);

-- ----------------------------------------------------------------------------
-- 2. Enable RLS on ALL Phase 4 Tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_staff_vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_gallery ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. RLS Policies (Strict Cross-School Isolation)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_school_admin_for(p_user_id uuid, p_school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.schools s
    WHERE s.id = p_school_id
      AND (
        s.admin_user_id = p_user_id
        OR (s.organisation_id IS NOT NULL AND public.is_org_admin(p_user_id, s.organisation_id))
      )
  );
$$;

CREATE POLICY "schools_select_public_or_admin"
  ON public.schools FOR SELECT
  USING (
    status = 'ACTIVE'
    OR admin_user_id = auth.uid()
    OR (organisation_id IS NOT NULL AND public.is_org_member(auth.uid(), organisation_id))
    OR public.has_any_admin_role(auth.uid())
  );

CREATE POLICY "schools_insert_authenticated"
  ON public.schools FOR INSERT
  WITH CHECK (admin_user_id = auth.uid());

CREATE POLICY "schools_update_own_school_or_platform_admin"
  ON public.schools FOR UPDATE
  USING (
    public.is_school_admin_for(auth.uid(), id)
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin_moderation')
  );

CREATE POLICY "school_classes_select_via_school"
  ON public.school_classes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.schools s WHERE s.id = school_id));

CREATE POLICY "school_classes_write_own_school"
  ON public.school_classes FOR ALL
  USING (public.is_school_admin_for(auth.uid(), school_id) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.is_school_admin_for(auth.uid(), school_id) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "school_facilities_select_via_school"
  ON public.school_facilities FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.schools s WHERE s.id = school_id));

CREATE POLICY "school_facilities_write_own_school"
  ON public.school_facilities FOR ALL
  USING (public.is_school_admin_for(auth.uid(), school_id) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.is_school_admin_for(auth.uid(), school_id) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "school_gallery_select_via_school"
  ON public.school_gallery FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.schools s WHERE s.id = school_id));

CREATE POLICY "school_gallery_write_own_school"
  ON public.school_gallery FOR ALL
  USING (public.is_school_admin_for(auth.uid(), school_id) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.is_school_admin_for(auth.uid(), school_id) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "school_staff_vacancies_select"
  ON public.school_staff_vacancies FOR SELECT
  USING (
    status = 'OPEN'
    OR public.is_school_admin_for(auth.uid(), school_id)
    OR public.has_any_admin_role(auth.uid())
  );

CREATE POLICY "school_staff_vacancies_write_own_school"
  ON public.school_staff_vacancies FOR ALL
  USING (public.is_school_admin_for(auth.uid(), school_id) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.is_school_admin_for(auth.uid(), school_id) OR public.has_role(auth.uid(), 'super_admin'));

-- Admission Enquiries: STRICT CROSS-SCHOOL ISOLATION
-- School A admin cannot access School B's admission enquiries!
CREATE POLICY "admission_enquiries_select_strict"
  ON public.admission_enquiries FOR SELECT
  USING (
    parent_or_student_id = auth.uid()
    OR public.is_school_admin_for(auth.uid(), school_id)
    OR public.has_any_admin_role(auth.uid())
  );

CREATE POLICY "admission_enquiries_insert_sender"
  ON public.admission_enquiries FOR INSERT
  WITH CHECK (parent_or_student_id = auth.uid());

CREATE POLICY "admission_enquiries_update_school_or_admin"
  ON public.admission_enquiries FOR UPDATE
  USING (
    public.is_school_admin_for(auth.uid(), school_id)
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin_moderation')
  );

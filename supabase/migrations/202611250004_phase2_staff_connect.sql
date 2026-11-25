-- ============================================================================
-- SHALOM CONNECTHUB INDIA — Phase 2: Module A (Staff Connect) Schema & RLS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Candidate Profiles, Educations, Experiences & Private Documents
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.candidate_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  headline text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  highest_qualification text NOT NULL DEFAULT 'Graduate',
  total_experience_years numeric(4, 1) NOT NULL DEFAULT 0 CHECK (total_experience_years >= 0),
  skills text[] NOT NULL DEFAULT '{}'::text[],
  preferred_employment_types text[] NOT NULL DEFAULT '{FULL_TIME}'::text[],
  expected_salary_min integer CHECK (expected_salary_min IS NULL OR expected_salary_min >= 0),
  expected_salary_max integer CHECK (expected_salary_max IS NULL OR expected_salary_max >= 0),
  current_location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  willing_to_relocate boolean NOT NULL DEFAULT false,
  is_public_searchable boolean NOT NULL DEFAULT true,
  cv_visibility text NOT NULL DEFAULT 'APPLIED_ONLY'
    CHECK (cv_visibility IN ('APPLIED_ONLY', 'EMPLOYERS', 'PRIVATE')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user ON public.candidate_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_qual ON public.candidate_profiles (highest_qualification);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_exp ON public.candidate_profiles (total_experience_years);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_skills ON public.candidate_profiles USING gin (skills);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_location ON public.candidate_profiles (current_location_id);

CREATE TRIGGER trg_candidate_profiles_updated_at
  BEFORE UPDATE ON public.candidate_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.candidate_educations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  degree text NOT NULL,
  institution text NOT NULL,
  field_of_study text,
  start_year integer,
  end_year integer,
  grade text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_candidate_educations_cand ON public.candidate_educations (candidate_id);

CREATE TABLE IF NOT EXISTS public.candidate_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  job_title text NOT NULL,
  company_name text NOT NULL,
  employment_type text NOT NULL DEFAULT 'FULL_TIME'
    CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'TEMPORARY', 'CONTRACT')),
  start_date date,
  end_date date,
  is_current boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_candidate_experiences_cand ON public.candidate_experiences (candidate_id);

CREATE TABLE IF NOT EXISTS public.candidate_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL DEFAULT 'CV'
    CHECK (document_type IN ('CV', 'CERTIFICATE', 'PORTFOLIO', 'OTHER')),
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  file_size_bytes bigint CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  is_primary_cv boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_candidate_documents_cand ON public.candidate_documents (candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_documents_user ON public.candidate_documents (user_id);

-- ----------------------------------------------------------------------------
-- 2. Job Posts, Requirements, Applications, Events & Recruitment Enquiries
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL UNIQUE REFERENCES public.listings(id) ON DELETE CASCADE,
  employer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organisation_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL,
  employment_type text NOT NULL DEFAULT 'FULL_TIME'
    CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'TEMPORARY', 'CONTRACT')),
  work_mode text NOT NULL DEFAULT 'ONSITE'
    CHECK (work_mode IN ('ONSITE', 'HYBRID', 'REMOTE')),
  min_experience_years numeric(4, 1) NOT NULL DEFAULT 0 CHECK (min_experience_years >= 0),
  max_experience_years numeric(4, 1),
  qualification_required text NOT NULL DEFAULT 'Graduate',
  skills_required text[] NOT NULL DEFAULT '{}'::text[],
  salary_min integer CHECK (salary_min IS NULL OR salary_min >= 0),
  salary_max integer CHECK (salary_max IS NULL OR salary_max >= 0),
  salary_period text NOT NULL DEFAULT 'MONTHLY'
    CHECK (salary_period IN ('MONTHLY', 'ANNUAL', 'HOURLY')),
  salary_disclosed boolean NOT NULL DEFAULT true,
  openings_count integer NOT NULL DEFAULT 1 CHECK (openings_count >= 1),
  application_deadline date,
  status text NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'PAUSED', 'CLOSED')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_job_posts_employer ON public.job_posts (employer_id);
CREATE INDEX IF NOT EXISTS idx_job_posts_emp_type ON public.job_posts (employment_type, status);
CREATE INDEX IF NOT EXISTS idx_job_posts_qual ON public.job_posts (qualification_required);
CREATE INDEX IF NOT EXISTS idx_job_posts_salary ON public.job_posts (salary_min, salary_max);
CREATE INDEX IF NOT EXISTS idx_job_posts_skills ON public.job_posts USING gin (skills_required);

CREATE TRIGGER trg_job_posts_updated_at
  BEFORE UPDATE ON public.job_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.job_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_post_id uuid NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  requirement_type text NOT NULL DEFAULT 'SKILL'
    CHECK (requirement_type IN ('SKILL', 'QUALIFICATION', 'LANGUAGE', 'CERTIFICATION')),
  label text NOT NULL,
  is_mandatory boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_job_requirements_post ON public.job_requirements (job_post_id);

CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_post_id uuid NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  applicant_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cv_document_id uuid REFERENCES public.candidate_documents(id) ON DELETE SET NULL,
  cover_note text,
  status text NOT NULL DEFAULT 'APPLIED'
    CHECK (
      status IN (
        'APPLIED',
        'VIEWED',
        'SHORTLISTED',
        'INTERVIEW_SCHEDULED',
        'OFFERED',
        'HIRED',
        'REJECTED',
        'WITHDRAWN'
      )
    ),
  employer_notes text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (job_post_id, applicant_user_id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_post ON public.job_applications (job_post_id, status);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant ON public.job_applications (applicant_user_id, created_at DESC);

CREATE TRIGGER trg_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  from_status text,
  to_status text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_application_events_app ON public.application_events (application_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.recruitment_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_post_id uuid REFERENCES public.job_posts(id) ON DELETE SET NULL,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'NEW'
    CHECK (status IN ('NEW', 'VIEWED', 'CONTACTED', 'RESOLVED', 'CLOSED')),
  employer_reply text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_recruitment_enquiries_employer ON public.recruitment_enquiries (employer_id, status);
CREATE INDEX IF NOT EXISTS idx_recruitment_enquiries_sender ON public.recruitment_enquiries (sender_id);

CREATE TRIGGER trg_recruitment_enquiries_updated_at
  BEFORE UPDATE ON public.recruitment_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. Enable RLS on ALL Phase 2 Tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_enquiries ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 4. RLS Policies for Staff Connect
-- ----------------------------------------------------------------------------

-- Helper: did candidate apply to a job owned by p_employer_id?
CREATE OR REPLACE FUNCTION public.employer_can_view_candidate(p_employer_id uuid, p_candidate_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.job_applications ja
    JOIN public.job_posts jp ON jp.id = ja.job_post_id
    WHERE ja.candidate_id = p_candidate_id
      AND (
        jp.employer_id = p_employer_id
        OR (jp.organisation_id IS NOT NULL AND public.is_org_member(p_employer_id, jp.organisation_id))
      )
  );
$$;

-- Candidate Profiles
CREATE POLICY "candidate_profiles_select"
  ON public.candidate_profiles FOR SELECT
  USING (
    user_id = auth.uid()
    OR (is_public_searchable = true AND public.has_role(auth.uid(), 'employer'))
    OR public.employer_can_view_candidate(auth.uid(), id)
    OR public.has_any_admin_role(auth.uid())
  );

CREATE POLICY "candidate_profiles_insert_own"
  ON public.candidate_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "candidate_profiles_update_own_or_admin"
  ON public.candidate_profiles FOR UPDATE
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_moderation'));

-- Candidate Educations & Experiences
CREATE POLICY "candidate_educations_select"
  ON public.candidate_educations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      WHERE cp.id = candidate_id
        AND (
          cp.user_id = auth.uid()
          OR (cp.is_public_searchable = true AND public.has_role(auth.uid(), 'employer'))
          OR public.employer_can_view_candidate(auth.uid(), cp.id)
          OR public.has_any_admin_role(auth.uid())
        )
    )
  );

CREATE POLICY "candidate_educations_write_own"
  ON public.candidate_educations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.candidate_profiles cp WHERE cp.id = candidate_id AND cp.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.candidate_profiles cp WHERE cp.id = candidate_id AND cp.user_id = auth.uid())
  );

CREATE POLICY "candidate_experiences_select"
  ON public.candidate_experiences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      WHERE cp.id = candidate_id
        AND (
          cp.user_id = auth.uid()
          OR (cp.is_public_searchable = true AND public.has_role(auth.uid(), 'employer'))
          OR public.employer_can_view_candidate(auth.uid(), cp.id)
          OR public.has_any_admin_role(auth.uid())
        )
    )
  );

CREATE POLICY "candidate_experiences_write_own"
  ON public.candidate_experiences FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.candidate_profiles cp WHERE cp.id = candidate_id AND cp.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.candidate_profiles cp WHERE cp.id = candidate_id AND cp.user_id = auth.uid())
  );

-- Candidate Documents (STRICT PRIVATE: only owner, applied employer, or moderation/super admin)
CREATE POLICY "candidate_documents_select_private"
  ON public.candidate_documents FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.job_applications ja
      JOIN public.job_posts jp ON jp.id = ja.job_post_id
      WHERE ja.candidate_id = candidate_documents.candidate_id
        AND (ja.cv_document_id = candidate_documents.id OR ja.cv_document_id IS NULL)
        AND (
          jp.employer_id = auth.uid()
          OR (jp.organisation_id IS NOT NULL AND public.is_org_member(auth.uid(), jp.organisation_id))
        )
    )
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin_moderation')
  );

CREATE POLICY "candidate_documents_write_own"
  ON public.candidate_documents FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Job Posts & Requirements
CREATE POLICY "job_posts_select_public_or_owner"
  ON public.job_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND (
          (l.status = 'APPROVED' AND job_posts.status = 'OPEN')
          OR l.owner_id = auth.uid()
          OR (l.organisation_id IS NOT NULL AND public.is_org_member(auth.uid(), l.organisation_id))
          OR public.has_any_admin_role(auth.uid())
        )
    )
  );

CREATE POLICY "job_posts_write_employer_or_admin"
  ON public.job_posts FOR ALL
  USING (
    employer_id = auth.uid()
    OR (organisation_id IS NOT NULL AND public.is_org_admin(auth.uid(), organisation_id))
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin_moderation')
  )
  WITH CHECK (
    employer_id = auth.uid()
    OR (organisation_id IS NOT NULL AND public.is_org_admin(auth.uid(), organisation_id))
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin_moderation')
  );

CREATE POLICY "job_requirements_select_via_post"
  ON public.job_requirements FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.job_posts jp WHERE jp.id = job_post_id)
  );

CREATE POLICY "job_requirements_write_employer"
  ON public.job_requirements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.job_posts jp
      WHERE jp.id = job_post_id
        AND (jp.employer_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_posts jp
      WHERE jp.id = job_post_id
        AND (jp.employer_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))
    )
  );

-- Job Applications & Events (STRICT ISOLATION: applicant + target employer/org + admin)
CREATE POLICY "job_applications_select_parties"
  ON public.job_applications FOR SELECT
  USING (
    applicant_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.job_posts jp
      WHERE jp.id = job_post_id
        AND (
          jp.employer_id = auth.uid()
          OR (jp.organisation_id IS NOT NULL AND public.is_org_member(auth.uid(), jp.organisation_id))
        )
    )
    OR public.has_any_admin_role(auth.uid())
  );

CREATE POLICY "job_applications_insert_candidate"
  ON public.job_applications FOR INSERT
  WITH CHECK (applicant_user_id = auth.uid());

CREATE POLICY "job_applications_update_parties"
  ON public.job_applications FOR UPDATE
  USING (
    applicant_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.job_posts jp
      WHERE jp.id = job_post_id
        AND (
          jp.employer_id = auth.uid()
          OR (jp.organisation_id IS NOT NULL AND public.is_org_member(auth.uid(), jp.organisation_id))
        )
    )
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin_moderation')
  );

CREATE POLICY "application_events_select_parties"
  ON public.application_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.job_posts jp ON jp.id = ja.job_post_id
      WHERE ja.id = application_id
        AND (
          ja.applicant_user_id = auth.uid()
          OR jp.employer_id = auth.uid()
          OR (jp.organisation_id IS NOT NULL AND public.is_org_member(auth.uid(), jp.organisation_id))
          OR public.has_any_admin_role(auth.uid())
        )
    )
  );

CREATE POLICY "application_events_insert_parties"
  ON public.application_events FOR INSERT
  WITH CHECK (actor_id = auth.uid());

-- Recruitment Enquiries
CREATE POLICY "recruitment_enquiries_select_parties"
  ON public.recruitment_enquiries FOR SELECT
  USING (
    sender_id = auth.uid()
    OR employer_id = auth.uid()
    OR public.has_any_admin_role(auth.uid())
  );

CREATE POLICY "recruitment_enquiries_insert_sender"
  ON public.recruitment_enquiries FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "recruitment_enquiries_update_parties"
  ON public.recruitment_enquiries FOR UPDATE
  USING (
    sender_id = auth.uid()
    OR employer_id = auth.uid()
    OR public.has_any_admin_role(auth.uid())
  );

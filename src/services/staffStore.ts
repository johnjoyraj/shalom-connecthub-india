import { INDIA_LOCATIONS_SEED } from '../data/indiaLocationsSeed';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import type { UserWithRoles } from '../types/domain';
import type {
  ApplicationEvent,
  ApplicationStatus,
  CandidateDocument,
  CandidateEducation,
  CandidateExperience,
  CandidateProfile,
  EmploymentType,
  JobApplication,
  JobPost,
  JobPostStatus,
  JobSearchFilters,
  RecruitmentEnquiry,
  SalaryPeriod,
  WorkMode,
} from '../types/staff';
import { getDescendantLocationIds } from './locationSearch';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveDbLocationId(
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
  locationId: string | null | undefined
): Promise<string | null> {
  if (!locationId) return null;
  if (UUID_RE.test(locationId)) return locationId;
  const seedNode = INDIA_LOCATIONS_SEED.find((l) => l.id === locationId);
  if (!seedNode) return null;
  const { data } = await supabase
    .from('locations')
    .select('id')
    .eq('name', seedNode.name)
    .eq('level', seedNode.level)
    .maybeSingle();
  return data?.id ? String(data.id) : null;
}
import { hasAnyAdminRole } from './permissions';

const STAFF_SANDBOX_KEY = 'shalom_connecthub_staff_v1';

interface StaffSandboxState {
  candidateProfiles: CandidateProfile[];
  educations: CandidateEducation[];
  experiences: CandidateExperience[];
  documents: CandidateDocument[];
  jobPosts: JobPost[];
  applications: JobApplication[];
  applicationEvents: ApplicationEvent[];
  enquiries: RecruitmentEnquiry[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return `${prefix}-${rand}`;
}

function buildInitialStaffSandbox(): StaffSandboxState {
  const candidateProfiles: CandidateProfile[] = [
    {
      id: 'cand-demo-1',
      user_id: 'usr-candidate-demo',
      full_name: 'Rohan Kulkarni',
      headline: 'Full-Stack React & PostgreSQL Developer (3.5 yrs)',
      bio: 'Built SaaS dashboards, REST APIs, and mobile-first web apps in Bengaluru and Pune.',
      highest_qualification: 'B.Tech',
      total_experience_years: 3.5,
      skills: ['React', 'TypeScript', 'PostgreSQL', 'Tailwind CSS', 'Node.js'],
      preferred_employment_types: ['FULL_TIME', 'CONTRACT'],
      expected_salary_min: 55000,
      expected_salary_max: 85000,
      current_location_id: 'loc-city-in-ka-bengaluru',
      willing_to_relocate: true,
      is_public_searchable: true,
      cv_visibility: 'APPLIED_ONLY',
      updated_at: '2026-11-23T09:00:00Z',
    },
    {
      id: 'cand-demo-2',
      user_id: 'usr-candidate-demo-2',
      full_name: 'Meera Krishnan',
      headline: 'Senior TGT Mathematics & CBSE Academic Coordinator',
      bio: '6 years teaching Grades 8–12 Mathematics with strong digital classroom experience.',
      highest_qualification: 'Postgraduate',
      total_experience_years: 6,
      skills: ['Mathematics', 'CBSE Curriculum', 'Student Mentoring', 'Hindi', 'English'],
      preferred_employment_types: ['FULL_TIME', 'PART_TIME'],
      expected_salary_min: 32000,
      expected_salary_max: 48000,
      current_location_id: 'loc-city-in-kl-kochi',
      willing_to_relocate: false,
      is_public_searchable: true,
      cv_visibility: 'APPLIED_ONLY',
      updated_at: '2026-11-24T11:00:00Z',
    },
  ];

  const educations: CandidateEducation[] = [
    {
      id: 'edu-1',
      candidate_id: 'cand-demo-1',
      degree: 'B.Tech Computer Science',
      institution: 'VTU Bengaluru',
      field_of_study: 'Computer Science',
      start_year: 2018,
      end_year: 2022,
      grade: '8.4 CGPA',
    },
    {
      id: 'edu-2',
      candidate_id: 'cand-demo-2',
      degree: 'M.Sc Mathematics + B.Ed',
      institution: 'Mahatma Gandhi University, Kerala',
      field_of_study: 'Mathematics',
      start_year: 2016,
      end_year: 2020,
      grade: 'First Class',
    },
  ];

  const experiences: CandidateExperience[] = [
    {
      id: 'exp-1',
      candidate_id: 'cand-demo-1',
      job_title: 'Software Engineer',
      company_name: 'Deccan Cloud Systems',
      employment_type: 'FULL_TIME',
      start_date: '2022-07-01',
      end_date: null,
      is_current: true,
      description: 'React, TypeScript, and PostgreSQL application engineering.',
    },
  ];

  const documents: CandidateDocument[] = [
    {
      id: 'doc-cv-1',
      candidate_id: 'cand-demo-1',
      user_id: 'usr-candidate-demo',
      document_type: 'CV',
      file_name: 'Rohan_Kulkarni_CV_2026.pdf',
      storage_path: 'usr-candidate-demo/Rohan_Kulkarni_CV_2026.pdf',
      mime_type: 'application/pdf',
      file_size_bytes: 245120,
      is_primary_cv: true,
      created_at: '2026-11-23T09:05:00Z',
    },
  ];

  const jobPosts: JobPost[] = [
    {
      id: 'job-1',
      listing_id: 'lst-staff-preview-1',
      employer_id: 'usr-employer-demo',
      employer_name: 'Ananya Verma (Employer)',
      organisation_id: null,
      title: 'Senior Full-Stack Engineer (React & PostgreSQL)',
      slug: 'senior-full-stack-engineer-bengaluru',
      summary: 'Build scalable SaaS modules with React, TypeScript, and PostgreSQL in Bengaluru.',
      description:
        'Looking for an engineer comfortable with React, TypeScript, Supabase/PostgreSQL RLS, and automated testing.',
      location_id: 'loc-city-in-ka-bengaluru',
      listing_status: 'APPROVED',
      employment_type: 'FULL_TIME',
      work_mode: 'HYBRID',
      min_experience_years: 2,
      max_experience_years: 6,
      qualification_required: 'B.Tech',
      skills_required: ['React', 'TypeScript', 'PostgreSQL'],
      salary_min: 60000,
      salary_max: 110000,
      salary_period: 'MONTHLY',
      salary_disclosed: true,
      openings_count: 2,
      application_deadline: '2027-01-31',
      status: 'OPEN',
      created_at: '2026-11-23T10:00:00Z',
    },
    {
      id: 'job-2',
      listing_id: 'lst-staff-job-2',
      employer_id: 'usr-school-admin',
      employer_name: 'Grace Model Educational Trust',
      organisation_id: 'org-demo-school',
      title: 'Part-Time Computer Science & Coding Instructor',
      slug: 'part-time-cs-instructor-gorakhpur',
      summary: 'Morning batch coding & computer literacy instructor for Classes 8–12 in Gorakhpur.',
      description: 'Part-time teaching role with flexible morning schedule and CBSE lab guidance.',
      location_id: 'loc-city-in-up-gorakhpur',
      listing_status: 'APPROVED',
      employment_type: 'PART_TIME',
      work_mode: 'ONSITE',
      min_experience_years: 1,
      max_experience_years: 5,
      qualification_required: 'Graduate',
      skills_required: ['Teaching', 'Python', 'MS Office'],
      salary_min: 18000,
      salary_max: 26000,
      salary_period: 'MONTHLY',
      salary_disclosed: true,
      openings_count: 1,
      application_deadline: '2027-01-15',
      status: 'OPEN',
      created_at: '2026-11-24T08:00:00Z',
    },
    {
      id: 'job-3',
      listing_id: 'lst-staff-job-3',
      employer_id: 'usr-employer-demo',
      employer_name: 'Ananya Verma (Employer)',
      organisation_id: null,
      title: 'Field Sales & Merchant Onboarding Coordinator (Contract)',
      slug: 'field-sales-coordinator-kochi',
      summary: '6-month contract onboarding local businesses across Ernakulam & Kochi.',
      description: 'Malayalam & English fluency required. Weekly travel allowance included.',
      location_id: 'loc-city-in-kl-kochi',
      listing_status: 'APPROVED',
      employment_type: 'CONTRACT',
      work_mode: 'ONSITE',
      min_experience_years: 0,
      max_experience_years: 4,
      qualification_required: '12th',
      skills_required: ['Sales', 'Malayalam', 'Customer Onboarding'],
      salary_min: 22000,
      salary_max: 35000,
      salary_period: 'MONTHLY',
      salary_disclosed: true,
      openings_count: 3,
      application_deadline: '2027-02-15',
      status: 'OPEN',
      created_at: '2026-11-24T12:30:00Z',
    },
  ];

  const applications: JobApplication[] = [
    {
      id: 'app-1',
      job_post_id: 'job-1',
      candidate_id: 'cand-demo-1',
      applicant_user_id: 'usr-candidate-demo',
      applicant_name: 'Rohan Kulkarni',
      cv_document_id: 'doc-cv-1',
      cover_note: '3.5 years building React + PostgreSQL SaaS platforms.',
      status: 'SHORTLISTED',
      employer_notes: 'Strong TypeScript and RLS portfolio.',
      created_at: '2026-11-24T10:00:00Z',
      updated_at: '2026-11-24T15:00:00Z',
    },
  ];

  const applicationEvents: ApplicationEvent[] = [
    {
      id: 'ev-1',
      application_id: 'app-1',
      actor_id: 'usr-candidate-demo',
      from_status: null,
      to_status: 'APPLIED',
      note: 'Application submitted with CV.',
      created_at: '2026-11-24T10:00:00Z',
    },
    {
      id: 'ev-2',
      application_id: 'app-1',
      actor_id: 'usr-employer-demo',
      from_status: 'APPLIED',
      to_status: 'SHORTLISTED',
      note: 'Shortlisted for technical interview.',
      created_at: '2026-11-24T15:00:00Z',
    },
  ];

  const enquiries: RecruitmentEnquiry[] = [
    {
      id: 'req-1',
      job_post_id: 'job-1',
      sender_id: 'usr-candidate-demo',
      sender_name: 'Rohan Kulkarni',
      employer_id: 'usr-employer-demo',
      subject: 'Hybrid work days in Bengaluru',
      message: 'Could you share how many days per week are onsite in Bengaluru?',
      status: 'NEW',
      employer_reply: null,
      created_at: '2026-11-24T16:00:00Z',
    },
  ];

  return {
    candidateProfiles,
    educations,
    experiences,
    documents,
    jobPosts,
    applications,
    applicationEvents,
    enquiries,
  };
}

let staffMemoryFallback: StaffSandboxState | null = null;

function readStaffSandbox(): StaffSandboxState {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STAFF_SANDBOX_KEY);
      if (raw) return JSON.parse(raw) as StaffSandboxState;
    } catch {
      // Fallback to in-memory
    }
  }
  if (!staffMemoryFallback) {
    staffMemoryFallback = buildInitialStaffSandbox();
  }
  return staffMemoryFallback;
}

function writeStaffSandbox(state: StaffSandboxState): void {
  staffMemoryFallback = state;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STAFF_SANDBOX_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage limits
    }
  }
}

export function resetStaffSandboxForTests(): void {
  writeStaffSandbox(buildInitialStaffSandbox());
}

function assertEmployerAccess(user: UserWithRoles): void {
  if (
    !user.roles.includes('employer') &&
    !user.roles.includes('school_admin') &&
    !hasAnyAdminRole(user.roles)
  ) {
    throw new Error('Unauthorized: Employer or School Admin role is required for this action.');
  }
}

export const staffStore = {
  async searchJobs(filters: JobSearchFilters = {}): Promise<{ items: JobPost[]; total: number }> {
    const supabase = getSupabaseClient();
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.max(1, Math.min(50, filters.pageSize ?? 12));

    if (supabase) {
      let query = supabase
        .from('job_posts')
        .select(
          `*, listings!inner(title, slug, summary, description, location_id, status)`,
          { count: 'exact' }
        );
      if (!filters.includeUnapproved) {
        query = query.eq('status', 'OPEN').eq('listings.status', 'APPROVED');
      }
      if (filters.employmentType && filters.employmentType !== 'ALL') {
        query = query.eq('employment_type', filters.employmentType);
      }
      if (filters.qualification && filters.qualification !== 'ALL') {
        query = query.eq('qualification_required', filters.qualification);
      }
      if (filters.maxExperience !== undefined) {
        query = query.lte('min_experience_years', filters.maxExperience);
      }
      if (filters.minSalary !== undefined) {
        query = query.gte('salary_max', filters.minSalary);
      }
      if (filters.skill?.trim()) {
        query = query.contains('skills_required', [filters.skill.trim()]);
      }
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count, error } = await query.range(from, to);
      if (error) throw new Error(error.message);
      const mapped = (data ?? []).map((row: Record<string, unknown>) => {
        const l = row.listings as Record<string, unknown>;
        return {
          ...(row as unknown as JobPost),
          title: String(l?.title ?? ''),
          slug: String(l?.slug ?? ''),
          summary: String(l?.summary ?? ''),
          description: String(l?.description ?? ''),
          location_id: (l?.location_id as string | null) ?? null,
          listing_status: (l?.status as JobPost['listing_status']) ?? 'APPROVED',
          employer_name: 'Verified Employer',
        };
      });
      return { items: mapped, total: count ?? mapped.length };
    }

    const state = readStaffSandbox();
    const q = filters.query?.trim().toLowerCase() ?? '';
    const skillQ = filters.skill?.trim().toLowerCase() ?? '';
    const allowedLocIds = filters.locationId
      ? getDescendantLocationIds(filters.locationId, INDIA_LOCATIONS_SEED)
      : null;
    const pinLocIds = filters.pincode?.trim()
      ? new Set(INDIA_LOCATIONS_SEED.filter((l) => l.pincode === filters.pincode?.trim()).map((l) => l.id))
      : null;

    let filtered = state.jobPosts.filter((job) => {
      if (!filters.includeUnapproved && (job.listing_status !== 'APPROVED' || job.status !== 'OPEN')) {
        return false;
      }
      if (filters.employmentType && filters.employmentType !== 'ALL' && job.employment_type !== filters.employmentType) {
        return false;
      }
      if (
        filters.qualification &&
        filters.qualification !== 'ALL' &&
        job.qualification_required.toLowerCase() !== filters.qualification.toLowerCase()
      ) {
        return false;
      }
      if (filters.maxExperience !== undefined && job.min_experience_years > filters.maxExperience) {
        return false;
      }
      if (filters.minSalary !== undefined && (job.salary_max ?? job.salary_min ?? 0) < filters.minSalary) {
        return false;
      }
      if (skillQ && !job.skills_required.some((s) => s.toLowerCase().includes(skillQ))) {
        return false;
      }
      if (allowedLocIds && (!job.location_id || !allowedLocIds.has(job.location_id))) {
        return false;
      }
      if (pinLocIds && (!job.location_id || !pinLocIds.has(job.location_id))) {
        return false;
      }
      if (q) {
        const hay = `${job.title} ${job.summary} ${job.employer_name} ${job.skills_required.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (filters.sort === 'salary_desc') {
      filtered = [...filtered].sort((a, b) => (b.salary_max ?? 0) - (a.salary_max ?? 0));
    } else if (filters.sort === 'exp_asc') {
      filtered = [...filtered].sort((a, b) => a.min_experience_years - b.min_experience_years);
    } else {
      filtered = [...filtered].sort((a, b) => b.created_at.localeCompare(a.created_at));
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    return { items: filtered.slice(start, start + pageSize), total };
  },

  async searchCandidates(filters: {
    query?: string;
    qualification?: string;
    skill?: string;
    maxExperience?: number;
    locationId?: string;
  } = {}): Promise<CandidateProfile[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let q = supabase.from('candidate_profiles').select('*').eq('is_public_searchable', true);
      if (filters.qualification && filters.qualification !== 'ALL') {
        q = q.eq('highest_qualification', filters.qualification);
      }
      if (filters.maxExperience !== undefined) {
        q = q.lte('total_experience_years', filters.maxExperience);
      }
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []) as CandidateProfile[];
    }

    const state = readStaffSandbox();
    const text = filters.query?.trim().toLowerCase() ?? '';
    const skillQ = filters.skill?.trim().toLowerCase() ?? '';
    const allowedLocs = filters.locationId
      ? getDescendantLocationIds(filters.locationId, INDIA_LOCATIONS_SEED)
      : null;

    return state.candidateProfiles.filter((cand) => {
      if (!cand.is_public_searchable) return false;
      if (
        filters.qualification &&
        filters.qualification !== 'ALL' &&
        cand.highest_qualification.toLowerCase() !== filters.qualification.toLowerCase()
      ) {
        return false;
      }
      if (filters.maxExperience !== undefined && cand.total_experience_years > filters.maxExperience) {
        return false;
      }
      if (skillQ && !cand.skills.some((s) => s.toLowerCase().includes(skillQ))) {
        return false;
      }
      if (allowedLocs && (!cand.current_location_id || !allowedLocs.has(cand.current_location_id))) {
        return false;
      }
      if (text) {
        const hay = `${cand.full_name} ${cand.headline} ${cand.skills.join(' ')}`.toLowerCase();
        if (!hay.includes(text)) return false;
      }
      return true;
    });
  },

  async getOrCreateMyCandidateProfile(user: UserWithRoles): Promise<{
    profile: CandidateProfile;
    educations: CandidateEducation[];
    experiences: CandidateExperience[];
    documents: CandidateDocument[];
  }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let { data: cp } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', user.profile.id)
        .maybeSingle();

      if (!cp) {
        const { data: inserted, error } = await supabase
          .from('candidate_profiles')
          .insert({ user_id: user.profile.id, headline: `${user.profile.full_name} — Candidate` })
          .select('*')
          .single();
        if (error) throw new Error(error.message);
        cp = inserted;
      }

      const [{ data: edus }, { data: exps }, { data: docs }] = await Promise.all([
        supabase.from('candidate_educations').select('*').eq('candidate_id', cp.id),
        supabase.from('candidate_experiences').select('*').eq('candidate_id', cp.id),
        supabase.from('candidate_documents').select('*').eq('candidate_id', cp.id),
      ]);

      return {
        profile: { ...(cp as CandidateProfile), full_name: user.profile.full_name },
        educations: (edus ?? []) as CandidateEducation[],
        experiences: (exps ?? []) as CandidateExperience[],
        documents: (docs ?? []) as CandidateDocument[],
      };
    }

    const state = readStaffSandbox();
    let cp = state.candidateProfiles.find((c) => c.user_id === user.profile.id);
    if (!cp) {
      cp = {
        id: makeId('cand'),
        user_id: user.profile.id,
        full_name: user.profile.full_name,
        headline: `${user.profile.full_name} — Candidate`,
        bio: '',
        highest_qualification: 'Graduate',
        total_experience_years: 0,
        skills: [],
        preferred_employment_types: ['FULL_TIME'],
        expected_salary_min: null,
        expected_salary_max: null,
        current_location_id: user.profile.primary_location_id,
        willing_to_relocate: false,
        is_public_searchable: true,
        cv_visibility: 'APPLIED_ONLY',
        updated_at: nowIso(),
      };
      state.candidateProfiles.push(cp);
      writeStaffSandbox(state);
    }

    return {
      profile: cp,
      educations: state.educations.filter((e) => e.candidate_id === cp.id),
      experiences: state.experiences.filter((e) => e.candidate_id === cp.id),
      documents: state.documents.filter((d) => d.candidate_id === cp.id),
    };
  },

  async saveCandidateProfile(
    user: UserWithRoles,
    updates: Partial<Omit<CandidateProfile, 'id' | 'user_id' | 'updated_at'>>
  ): Promise<CandidateProfile> {
    const current = await this.getOrCreateMyCandidateProfile(user);
    const supabase = getSupabaseClient();
    if (supabase) {
      const dbLocId = await resolveDbLocationId(
        supabase,
        updates.current_location_id ?? current.profile.current_location_id
      );
      const { data, error } = await supabase
        .from('candidate_profiles')
        .update({
          headline: updates.headline ?? current.profile.headline,
          bio: updates.bio ?? current.profile.bio,
          highest_qualification: updates.highest_qualification ?? current.profile.highest_qualification,
          total_experience_years: updates.total_experience_years ?? current.profile.total_experience_years,
          skills: updates.skills ?? current.profile.skills,
          preferred_employment_types: updates.preferred_employment_types ?? current.profile.preferred_employment_types,
          expected_salary_min: updates.expected_salary_min ?? current.profile.expected_salary_min,
          expected_salary_max: updates.expected_salary_max ?? current.profile.expected_salary_max,
          current_location_id: dbLocId,
          willing_to_relocate: updates.willing_to_relocate ?? current.profile.willing_to_relocate,
          is_public_searchable: updates.is_public_searchable ?? current.profile.is_public_searchable,
          cv_visibility: updates.cv_visibility ?? current.profile.cv_visibility,
        })
        .eq('id', current.profile.id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return { ...(data as CandidateProfile), full_name: user.profile.full_name };
    }

    const state = readStaffSandbox();
    const target = state.candidateProfiles.find((c) => c.id === current.profile.id)!;
    Object.assign(target, updates, { updated_at: nowIso() });
    writeStaffSandbox(state);
    return target;
  },

  async addCandidateEducation(
    user: UserWithRoles,
    payload: Omit<CandidateEducation, 'id' | 'candidate_id'>
  ): Promise<CandidateEducation> {
    const { profile } = await this.getOrCreateMyCandidateProfile(user);
    if (!payload.degree.trim() || !payload.institution.trim()) {
      throw new Error('Degree and institution are required.');
    }
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('candidate_educations')
        .insert({ ...payload, candidate_id: profile.id })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as CandidateEducation;
    }
    const state = readStaffSandbox();
    const row: CandidateEducation = { id: makeId('edu'), candidate_id: profile.id, ...payload };
    state.educations.push(row);
    writeStaffSandbox(state);
    return row;
  },

  async addCandidateExperience(
    user: UserWithRoles,
    payload: Omit<CandidateExperience, 'id' | 'candidate_id'>
  ): Promise<CandidateExperience> {
    const { profile } = await this.getOrCreateMyCandidateProfile(user);
    if (!payload.job_title.trim() || !payload.company_name.trim()) {
      throw new Error('Job title and company name are required.');
    }
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('candidate_experiences')
        .insert({ ...payload, candidate_id: profile.id })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as CandidateExperience;
    }
    const state = readStaffSandbox();
    const row: CandidateExperience = { id: makeId('exp'), candidate_id: profile.id, ...payload };
    state.experiences.push(row);
    writeStaffSandbox(state);
    return row;
  },

  async uploadCandidateCv(
    user: UserWithRoles,
    file: { name: string; size: number; type: string; fileObj?: File }
  ): Promise<CandidateDocument> {
    if (!file.name.trim()) throw new Error('CV file name is required.');
    if (file.size > 5 * 1024 * 1024) throw new Error('CV file size must be 5 MB or less.');

    const { profile } = await this.getOrCreateMyCandidateProfile(user);
    const storagePath = `${user.profile.id}/cv-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    const supabase = getSupabaseClient();
    if (supabase) {
      if (file.fileObj) {
        const { error: uploadErr } = await supabase.storage
          .from('private-documents')
          .upload(storagePath, file.fileObj, { upsert: false });
        if (uploadErr) throw new Error(uploadErr.message);
      }
      const { data, error } = await supabase
        .from('candidate_documents')
        .insert({
          candidate_id: profile.id,
          user_id: user.profile.id,
          document_type: 'CV',
          file_name: file.name,
          storage_path: storagePath,
          mime_type: file.type || 'application/pdf',
          file_size_bytes: file.size,
          is_primary_cv: true,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as CandidateDocument;
    }

    const state = readStaffSandbox();
    for (const d of state.documents) {
      if (d.candidate_id === profile.id && d.document_type === 'CV') {
        d.is_primary_cv = false;
      }
    }
    const doc: CandidateDocument = {
      id: makeId('doc'),
      candidate_id: profile.id,
      user_id: user.profile.id,
      document_type: 'CV',
      file_name: file.name,
      storage_path: storagePath,
      mime_type: file.type || 'application/pdf',
      file_size_bytes: file.size,
      is_primary_cv: true,
      created_at: nowIso(),
    };
    state.documents.unshift(doc);
    writeStaffSandbox(state);
    return doc;
  },

  async getAuthorizedCvDocument(requester: UserWithRoles, documentId: string): Promise<CandidateDocument> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('candidate_documents')
        .select('*')
        .eq('id', documentId)
        .single();
      if (error || !data) throw new Error('Unauthorized or document not found.');
      return data as CandidateDocument;
    }

    const state = readStaffSandbox();
    const doc = state.documents.find((d) => d.id === documentId);
    if (!doc) throw new Error('Document not found.');

    const isOwner = doc.user_id === requester.profile.id;
    const isAdmin = hasAnyAdminRole(requester.roles);
    const hasAppliedToRequesterJob = state.applications.some((app) => {
      if (app.candidate_id !== doc.candidate_id) return false;
      const job = state.jobPosts.find((j) => j.id === app.job_post_id);
      return job?.employer_id === requester.profile.id;
    });

    if (!isOwner && !isAdmin && !hasAppliedToRequesterJob) {
      throw new Error('Unauthorized: CV access is restricted to the candidate or employers they applied to.');
    }
    return doc;
  },

  async applyToJob(
    user: UserWithRoles,
    jobPostId: string,
    payload: { coverNote?: string; cvDocumentId?: string | null }
  ): Promise<JobApplication> {
    const { profile, documents } = await this.getOrCreateMyCandidateProfile(user);
    const primaryCv = payload.cvDocumentId ?? documents.find((d) => d.is_primary_cv)?.id ?? null;

    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('job_applications')
        .insert({
          job_post_id: jobPostId,
          candidate_id: profile.id,
          applicant_user_id: user.profile.id,
          cv_document_id: primaryCv,
          cover_note: payload.coverNote?.trim() || null,
          status: 'APPLIED',
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await supabase.from('application_events').insert({
        application_id: (data as JobApplication).id,
        actor_id: user.profile.id,
        from_status: null,
        to_status: 'APPLIED',
        note: 'Application submitted.',
      });
      return { ...(data as JobApplication), applicant_name: user.profile.full_name };
    }

    const state = readStaffSandbox();
    const job = state.jobPosts.find((j) => j.id === jobPostId);
    if (!job || job.status !== 'OPEN' || job.listing_status !== 'APPROVED') {
      throw new Error('This job vacancy is no longer accepting applications.');
    }
    if (state.applications.some((a) => a.job_post_id === jobPostId && a.applicant_user_id === user.profile.id)) {
      throw new Error('You have already applied to this job vacancy.');
    }

    const ts = nowIso();
    const app: JobApplication = {
      id: makeId('app'),
      job_post_id: jobPostId,
      candidate_id: profile.id,
      applicant_user_id: user.profile.id,
      applicant_name: user.profile.full_name,
      cv_document_id: primaryCv,
      cover_note: payload.coverNote?.trim() || null,
      status: 'APPLIED',
      employer_notes: null,
      created_at: ts,
      updated_at: ts,
    };
    state.applications.unshift(app);
    state.applicationEvents.unshift({
      id: makeId('ev'),
      application_id: app.id,
      actor_id: user.profile.id,
      from_status: null,
      to_status: 'APPLIED',
      note: 'Application submitted.',
      created_at: ts,
    });
    writeStaffSandbox(state);
    return app;
  },

  async getMyApplications(userId: string): Promise<{ applications: JobApplication[]; events: ApplicationEvent[]; jobs: JobPost[] }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data: apps, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('applicant_user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      const appList = (apps ?? []) as JobApplication[];
      const appIds = appList.map((a) => a.id);
      const jobIds = appList.map((a) => a.job_post_id);
      const [{ data: evs }, { data: jobs }] = await Promise.all([
        appIds.length ? supabase.from('application_events').select('*').in('application_id', appIds) : Promise.resolve({ data: [] }),
        jobIds.length ? supabase.from('job_posts').select('*').in('id', jobIds) : Promise.resolve({ data: [] }),
      ]);
      return {
        applications: appList,
        events: (evs ?? []) as ApplicationEvent[],
        jobs: (jobs ?? []) as JobPost[],
      };
    }

    const state = readStaffSandbox();
    const applications = state.applications.filter((a) => a.applicant_user_id === userId);
    const appIds = new Set(applications.map((a) => a.id));
    return {
      applications,
      events: state.applicationEvents.filter((e) => appIds.has(e.application_id)),
      jobs: state.jobPosts,
    };
  },

  async withdrawApplication(user: UserWithRoles, applicationId: string): Promise<JobApplication> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('job_applications')
        .update({ status: 'WITHDRAWN' })
        .eq('id', applicationId)
        .eq('applicant_user_id', user.profile.id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as JobApplication;
    }

    const state = readStaffSandbox();
    const app = state.applications.find((a) => a.id === applicationId);
    if (!app || app.applicant_user_id !== user.profile.id) {
      throw new Error('Unauthorized: cannot withdraw this application.');
    }
    const prev = app.status;
    app.status = 'WITHDRAWN';
    app.updated_at = nowIso();
    state.applicationEvents.unshift({
      id: makeId('ev'),
      application_id: app.id,
      actor_id: user.profile.id,
      from_status: prev,
      to_status: 'WITHDRAWN',
      note: 'Withdrawn by candidate.',
      created_at: nowIso(),
    });
    writeStaffSandbox(state);
    return app;
  },

  // --------------------------------------------------------------------------
  // Employer Operations
  // --------------------------------------------------------------------------
  async getEmployerJobs(employerId: string): Promise<JobPost[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('job_posts')
        .select('*, listings!inner(title, slug, summary, description, location_id, status)')
        .eq('employer_id', employerId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as JobPost[];
    }
    return readStaffSandbox().jobPosts.filter((j) => j.employer_id === employerId);
  },

  async createJobPost(
    user: UserWithRoles,
    payload: {
      title: string;
      summary: string;
      description: string;
      location_id: string | null;
      organisation_id?: string | null;
      employment_type: EmploymentType;
      work_mode: WorkMode;
      min_experience_years: number;
      max_experience_years: number | null;
      qualification_required: string;
      skills_required: string[];
      salary_min: number | null;
      salary_max: number | null;
      salary_period: SalaryPeriod;
      openings_count: number;
    }
  ): Promise<JobPost> {
    assertEmployerAccess(user);
    const title = payload.title.trim();
    if (!title || !payload.summary.trim()) {
      throw new Error('Job title and summary are required.');
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`;
    const supabase = getSupabaseClient();
    if (supabase) {
      const dbLocId = await resolveDbLocationId(supabase, payload.location_id);
      const { data: listing, error: lErr } = await supabase
        .from('listings')
        .insert({
          owner_id: user.profile.id,
          organisation_id: payload.organisation_id ?? null,
          module_key: 'staff',
          location_id: dbLocId,
          title,
          slug,
          summary: payload.summary.trim(),
          description: payload.description.trim(),
          status: 'PENDING_REVIEW',
        })
        .select('*')
        .single();
      if (lErr) throw new Error(lErr.message);

      const { data: job, error: jErr } = await supabase
        .from('job_posts')
        .insert({
          listing_id: (listing as { id: string }).id,
          employer_id: user.profile.id,
          organisation_id: payload.organisation_id ?? null,
          employment_type: payload.employment_type,
          work_mode: payload.work_mode,
          min_experience_years: payload.min_experience_years,
          max_experience_years: payload.max_experience_years,
          qualification_required: payload.qualification_required,
          skills_required: payload.skills_required,
          salary_min: payload.salary_min,
          salary_max: payload.salary_max,
          salary_period: payload.salary_period,
          openings_count: payload.openings_count,
          status: 'OPEN',
        })
        .select('*')
        .single();
      if (jErr) throw new Error(jErr.message);
      return {
        ...(job as JobPost),
        title,
        slug,
        summary: payload.summary,
        description: payload.description,
        location_id: payload.location_id,
        listing_status: 'PENDING_REVIEW',
        employer_name: user.profile.full_name,
      };
    }

    const state = readStaffSandbox();
    const ts = nowIso();
    const job: JobPost = {
      id: makeId('job'),
      listing_id: makeId('lst'),
      employer_id: user.profile.id,
      employer_name: user.profile.full_name,
      organisation_id: payload.organisation_id ?? null,
      title,
      slug,
      summary: payload.summary.trim(),
      description: payload.description.trim(),
      location_id: payload.location_id,
      listing_status: isSupabaseConfigured() ? 'PENDING_REVIEW' : 'APPROVED',
      employment_type: payload.employment_type,
      work_mode: payload.work_mode,
      min_experience_years: payload.min_experience_years,
      max_experience_years: payload.max_experience_years,
      qualification_required: payload.qualification_required,
      skills_required: payload.skills_required,
      salary_min: payload.salary_min,
      salary_max: payload.salary_max,
      salary_period: payload.salary_period,
      salary_disclosed: Boolean(payload.salary_min || payload.salary_max),
      openings_count: payload.openings_count,
      application_deadline: null,
      status: 'OPEN',
      created_at: ts,
    };
    state.jobPosts.unshift(job);
    writeStaffSandbox(state);
    return job;
  },

  async updateJobPostStatus(user: UserWithRoles, jobPostId: string, status: JobPostStatus): Promise<JobPost> {
    assertEmployerAccess(user);
    const state = readStaffSandbox();
    const job = state.jobPosts.find((j) => j.id === jobPostId);
    if (!job || (job.employer_id !== user.profile.id && !hasAnyAdminRole(user.roles))) {
      throw new Error('Unauthorized: cannot modify another employer’s job vacancy.');
    }
    job.status = status;
    writeStaffSandbox(state);
    return job;
  },

  async getEmployerApplications(user: UserWithRoles): Promise<JobApplication[]> {
    assertEmployerAccess(user);
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data: myJobs } = await supabase.from('job_posts').select('id').eq('employer_id', user.profile.id);
      const ids = (myJobs ?? []).map((j: { id: string }) => j.id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase.from('job_applications').select('*').in('job_post_id', ids);
      if (error) throw new Error(error.message);
      return (data ?? []) as JobApplication[];
    }

    const state = readStaffSandbox();
    const myJobIds = new Set(
      state.jobPosts
        .filter((j) => j.employer_id === user.profile.id || hasAnyAdminRole(user.roles))
        .map((j) => j.id)
    );
    return state.applications.filter((a) => myJobIds.has(a.job_post_id));
  },

  async updateApplicationStatus(
    user: UserWithRoles,
    applicationId: string,
    nextStatus: ApplicationStatus,
    note?: string
  ): Promise<JobApplication> {
    assertEmployerAccess(user);
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('job_applications')
        .update({ status: nextStatus, employer_notes: note ?? null })
        .eq('id', applicationId)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await supabase.from('application_events').insert({
        application_id: applicationId,
        actor_id: user.profile.id,
        from_status: null,
        to_status: nextStatus,
        note: note ?? null,
      });
      return data as JobApplication;
    }

    const state = readStaffSandbox();
    const app = state.applications.find((a) => a.id === applicationId);
    if (!app) throw new Error('Application not found.');
    const job = state.jobPosts.find((j) => j.id === app.job_post_id);
    if (!job || (job.employer_id !== user.profile.id && !hasAnyAdminRole(user.roles))) {
      throw new Error('Unauthorized: only the hiring employer may update this application.');
    }

    const prevStatus = app.status;
    app.status = nextStatus;
    if (note !== undefined) app.employer_notes = note;
    app.updated_at = nowIso();
    state.applicationEvents.unshift({
      id: makeId('ev'),
      application_id: app.id,
      actor_id: user.profile.id,
      from_status: prevStatus,
      to_status: nextStatus,
      note: note ?? null,
      created_at: nowIso(),
    });
    writeStaffSandbox(state);
    return app;
  },

  async sendRecruitmentEnquiry(
    user: UserWithRoles,
    payload: { jobPostId: string | null; employerId: string; subject: string; message: string }
  ): Promise<RecruitmentEnquiry> {
    if (!payload.subject.trim() || !payload.message.trim()) {
      throw new Error('Subject and message are required.');
    }
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('recruitment_enquiries')
        .insert({
          job_post_id: payload.jobPostId,
          sender_id: user.profile.id,
          employer_id: payload.employerId,
          subject: payload.subject.trim(),
          message: payload.message.trim(),
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return { ...(data as RecruitmentEnquiry), sender_name: user.profile.full_name };
    }

    const state = readStaffSandbox();
    const row: RecruitmentEnquiry = {
      id: makeId('req'),
      job_post_id: payload.jobPostId,
      sender_id: user.profile.id,
      sender_name: user.profile.full_name,
      employer_id: payload.employerId,
      subject: payload.subject.trim(),
      message: payload.message.trim(),
      status: 'NEW',
      employer_reply: null,
      created_at: nowIso(),
    };
    state.enquiries.unshift(row);
    writeStaffSandbox(state);
    return row;
  },

  async getRecruitmentEnquiries(user: UserWithRoles): Promise<RecruitmentEnquiry[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('recruitment_enquiries')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as RecruitmentEnquiry[];
    }
    const state = readStaffSandbox();
    return state.enquiries.filter(
      (e) =>
        e.employer_id === user.profile.id ||
        e.sender_id === user.profile.id ||
        hasAnyAdminRole(user.roles)
    );
  },

  async replyToRecruitmentEnquiry(
    user: UserWithRoles,
    enquiryId: string,
    reply: string
  ): Promise<RecruitmentEnquiry> {
    assertEmployerAccess(user);
    const state = readStaffSandbox();
    const item = state.enquiries.find((e) => e.id === enquiryId);
    if (!item || (item.employer_id !== user.profile.id && !hasAnyAdminRole(user.roles))) {
      throw new Error('Unauthorized: cannot reply to this enquiry.');
    }
    item.employer_reply = reply.trim();
    item.status = 'CONTACTED';
    writeStaffSandbox(state);
    return item;
  },
};

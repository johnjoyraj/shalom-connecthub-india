import { INDIA_LOCATIONS_SEED } from '../data/indiaLocationsSeed';
import { getSupabaseClient } from '../lib/supabase';
import type { UserWithRoles } from '../types/domain';
import type {
  AdmissionEnquiry,
  AdmissionEnquiryStatus,
  BoardAffiliation,
  InstitutionType,
  SchoolClass,
  SchoolFacility,
  SchoolGalleryItem,
  SchoolProfile,
  SchoolSearchFilters,
  SchoolStaffVacancy,
} from '../types/school';
import type { EmploymentType } from '../types/staff';
import { getDescendantLocationIds } from './locationSearch';
import { hasAnyAdminRole } from './permissions';

export const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  SCHOOL: 'School (K-12)',
  COLLEGE: 'College / University',
  PRESCHOOL: 'Preschool / Montessori',
  TUITION_CENTRE: 'Tuition Centre',
  COACHING_INSTITUTE: 'Coaching Institute',
};

const SCHOOL_SANDBOX_KEY = 'shalom_connecthub_school_v1';

interface SchoolSandboxState {
  schools: SchoolProfile[];
  classes: SchoolClass[];
  facilities: SchoolFacility[];
  enquiries: AdmissionEnquiry[];
  vacancies: SchoolStaffVacancy[];
  gallery: SchoolGalleryItem[];
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

function buildInitialSchoolSandbox(): SchoolSandboxState {
  const schools: SchoolProfile[] = [
    {
      id: 'sch-1',
      listing_id: 'lst-school-preview-1',
      organisation_id: 'org-demo-school',
      admin_user_id: 'usr-school-admin',
      institution_type: 'SCHOOL',
      name: 'Grace Model Public School',
      slug: 'grace-model-public-school-gorakhpur',
      board_affiliation: 'CBSE',
      affiliation_number: '2133045',
      medium_of_instruction: ['English', 'Hindi'],
      established_year: 2012,
      location_id: 'loc-city-in-up-gorakhpur',
      state_name: 'Uttar Pradesh',
      city_name: 'Gorakhpur',
      pincode: '273001',
      contact_email: 'admissions@gracemodel.example.in',
      contact_phone: '+91 98000 00102',
      website: 'https://gracemodel.example.in',
      description:
        'Value-based CBSE school from Nursery to Class XII featuring digital smart classrooms, science labs, library, and safe bus transport.',
      admissions_open: true,
      subscription_plan_code: 'PROFESSIONAL',
      status: 'ACTIVE',
      created_at: '2026-11-23T08:00:00Z',
    },
    {
      id: 'sch-2',
      listing_id: 'lst-school-2',
      organisation_id: null,
      admin_user_id: 'usr-school-admin-2',
      institution_type: 'PRESCHOOL',
      name: 'Little Sprouts Montessori & Preschool',
      slug: 'little-sprouts-montessori-kochi',
      board_affiliation: 'OTHER',
      affiliation_number: null,
      medium_of_instruction: ['English', 'Malayalam'],
      established_year: 2019,
      location_id: 'loc-city-in-kl-kochi',
      state_name: 'Kerala',
      city_name: 'Kochi',
      pincode: '682001',
      contact_email: 'hello@littlesprouts.example.in',
      contact_phone: '+91 98000 00205',
      website: null,
      description:
        'Child-safe Montessori playgroup, nursery, LKG, and UKG campus with CCTV monitoring and indoor play studio.',
      admissions_open: true,
      subscription_plan_code: 'STARTER',
      status: 'ACTIVE',
      created_at: '2026-11-24T09:00:00Z',
    },
    {
      id: 'sch-3',
      listing_id: 'lst-school-3',
      organisation_id: null,
      admin_user_id: 'usr-employer-demo',
      institution_type: 'COACHING_INSTITUTE',
      name: 'Deccan Scholars JEE / NEET & Foundation Academy',
      slug: 'deccan-scholars-academy-bengaluru',
      board_affiliation: 'AUTONOMOUS',
      affiliation_number: null,
      medium_of_instruction: ['English'],
      established_year: 2021,
      location_id: 'loc-city-in-ka-bengaluru',
      state_name: 'Karnataka',
      city_name: 'Bengaluru',
      pincode: '560001',
      contact_email: 'desk@deccanscholars.example.in',
      contact_phone: '+91 98000 00310',
      website: null,
      description:
        'Focused small-batch mentoring for Classes 9–12, JEE, NEET, and Olympiad preparation.',
      admissions_open: true,
      subscription_plan_code: 'FREE',
      status: 'ACTIVE',
      created_at: '2026-11-24T10:30:00Z',
    },
  ];

  const classes: SchoolClass[] = [
    { id: 'cls-1', school_id: 'sch-1', class_name: 'Nursery – UKG', stream_or_level: 'Pre-Primary', age_or_eligibility: '3–5 years', annual_fee_approx: 24000, seats_available: 40 },
    { id: 'cls-2', school_id: 'sch-1', class_name: 'Classes I – X', stream_or_level: 'Primary & Secondary', age_or_eligibility: 'CBSE Curriculum', annual_fee_approx: 36000, seats_available: 65 },
    { id: 'cls-3', school_id: 'sch-1', class_name: 'Class XI – XII (Science & Commerce)', stream_or_level: 'Senior Secondary', age_or_eligibility: 'Class X Board Pass', annual_fee_approx: 48000, seats_available: 30 },
    { id: 'cls-4', school_id: 'sch-2', class_name: 'Playgroup & Nursery', stream_or_level: 'Early Childhood', age_or_eligibility: '2–4 years', annual_fee_approx: 32000, seats_available: 25 },
    { id: 'cls-5', school_id: 'sch-3', class_name: 'JEE / NEET Integrated Batch', stream_or_level: 'Competitive Coaching', age_or_eligibility: 'Class XI–XII', annual_fee_approx: 65000, seats_available: 50 },
  ];

  const facilities: SchoolFacility[] = [
    { id: 'fac-1', school_id: 'sch-1', facility_key: 'science_labs', facility_label: 'Physics, Chemistry & Computer Labs', description: 'Modern CBSE practical laboratories' },
    { id: 'fac-2', school_id: 'sch-1', facility_key: 'transport', facility_label: 'GPS School Bus Transport', description: 'Gorakhpur city & rural routes' },
    { id: 'fac-3', school_id: 'sch-1', facility_key: 'library', facility_label: 'Library & Reading Hall', description: '6,500+ books & digital journals' },
    { id: 'fac-4', school_id: 'sch-2', facility_key: 'cctv', facility_label: 'CCTV & Child Safety Campus', description: 'Verified child-safe indoor/outdoor zones' },
    { id: 'fac-5', school_id: 'sch-3', facility_key: 'test_series', facility_label: 'Weekly CBT Mock Test Lab', description: 'National-level analytics' },
  ];

  const enquiries: AdmissionEnquiry[] = [
    {
      id: 'admenq-1',
      school_id: 'sch-1',
      school_name: 'Grace Model Public School',
      parent_or_student_id: 'usr-property-owner',
      student_name: 'Aarav Mathew',
      applying_for_class: 'Class VI',
      academic_year: '2027-28',
      contact_phone: '+91 98000 00103',
      message: 'Seeking transfer admission details and bus route availability for Class VI.',
      status: 'NEW',
      school_reply: null,
      created_at: '2026-11-24T13:00:00Z',
    },
    {
      id: 'admenq-2',
      school_id: 'sch-2',
      school_name: 'Little Sprouts Montessori & Preschool',
      parent_or_student_id: 'usr-employer-demo',
      student_name: 'Diya Verma',
      applying_for_class: 'Nursery',
      academic_year: '2027-28',
      contact_phone: '+91 98000 00101',
      message: 'Enquiring about morning daycare + Montessori timings.',
      status: 'NEW',
      school_reply: null,
      created_at: '2026-11-24T15:00:00Z',
    },
  ];

  const vacancies: SchoolStaffVacancy[] = [
    {
      id: 'svac-1',
      school_id: 'sch-1',
      staff_category: 'TEACHING',
      title: 'PGT Physics & Mathematics Teacher',
      subject_or_department: 'Senior Secondary Science',
      qualification_required: 'M.Sc + B.Ed',
      employment_type: 'FULL_TIME',
      salary_range_label: '₹28,000 – ₹42,000 / month',
      status: 'OPEN',
      created_at: '2026-11-23T10:00:00Z',
    },
    {
      id: 'svac-2',
      school_id: 'sch-1',
      staff_category: 'NON_TEACHING',
      title: 'School Accounts & Admissions Front Desk Executive',
      subject_or_department: 'Administration',
      qualification_required: 'B.Com / Tally Prime',
      employment_type: 'FULL_TIME',
      salary_range_label: '₹18,000 – ₹24,000 / month',
      status: 'OPEN',
      created_at: '2026-11-24T09:30:00Z',
    },
  ];

  const gallery: SchoolGalleryItem[] = [
    { id: 'sgal-1', school_id: 'sch-1', storage_path: 'sch-1/campus-main.jpg', caption: 'Main Academic Block & Assembly Ground', sort_order: 1 },
    { id: 'sgal-2', school_id: 'sch-1', storage_path: 'sch-1/computer-lab.jpg', caption: 'CBSE Smart Computer Lab', sort_order: 2 },
  ];

  return { schools, classes, facilities, enquiries, vacancies, gallery };
}

let schoolMemoryFallback: SchoolSandboxState | null = null;

function readSchoolSandbox(): SchoolSandboxState {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(SCHOOL_SANDBOX_KEY);
      if (raw) return JSON.parse(raw) as SchoolSandboxState;
    } catch {
      // Fallback
    }
  }
  if (!schoolMemoryFallback) {
    schoolMemoryFallback = buildInitialSchoolSandbox();
  }
  return schoolMemoryFallback;
}

function writeSchoolSandbox(state: SchoolSandboxState): void {
  schoolMemoryFallback = state;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(SCHOOL_SANDBOX_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }
}

export function resetSchoolSandboxForTests(): void {
  writeSchoolSandbox(buildInitialSchoolSandbox());
}

function assertSchoolAdminOwnership(user: UserWithRoles, school: SchoolProfile): void {
  const allowed =
    school.admin_user_id === user.profile.id || hasAnyAdminRole(user.roles);
  if (!allowed) {
    throw new Error('Unauthorized: a school administrator may not access or modify another school’s private records.');
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toDbUuid(val: string | null | undefined): string | null {
  return val && UUID_RE.test(val) ? val : null;
}

export const schoolStore = {
  async searchSchools(filters: SchoolSearchFilters = {}): Promise<SchoolProfile[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let q = supabase.from('schools').select('*').eq('status', 'ACTIVE');
      if (filters.institutionType && filters.institutionType !== 'ALL') {
        q = q.eq('institution_type', filters.institutionType);
      }
      if (filters.board && filters.board !== 'ALL') {
        q = q.eq('board_affiliation', filters.board);
      }
      if (filters.admissionsOpenOnly) {
        q = q.eq('admissions_open', true);
      }
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []) as SchoolProfile[];
    }

    const state = readSchoolSandbox();
    const q = filters.query?.trim().toLowerCase() ?? '';
    const classQ = filters.className?.trim().toLowerCase() ?? '';
    const facQ = filters.facility?.trim().toLowerCase() ?? '';
    const allowedLocs = filters.locationId
      ? getDescendantLocationIds(filters.locationId, INDIA_LOCATIONS_SEED)
      : null;

    return state.schools.filter((sch) => {
      if (sch.status !== 'ACTIVE') return false;
      if (filters.institutionType && filters.institutionType !== 'ALL' && sch.institution_type !== filters.institutionType) {
        return false;
      }
      if (filters.board && filters.board !== 'ALL' && sch.board_affiliation !== filters.board) {
        return false;
      }
      if (filters.admissionsOpenOnly && !sch.admissions_open) {
        return false;
      }
      if (filters.pincode?.trim() && sch.pincode !== filters.pincode.trim()) {
        return false;
      }
      if (allowedLocs && (!sch.location_id || !allowedLocs.has(sch.location_id))) {
        return false;
      }
      if (classQ) {
        const schClasses = state.classes.filter((c) => c.school_id === sch.id);
        if (!schClasses.some((c) => `${c.class_name} ${c.stream_or_level ?? ''}`.toLowerCase().includes(classQ))) {
          return false;
        }
      }
      if (facQ) {
        const schFacs = state.facilities.filter((f) => f.school_id === sch.id);
        if (!schFacs.some((f) => `${f.facility_label} ${f.description ?? ''}`.toLowerCase().includes(facQ))) {
          return false;
        }
      }
      if (q) {
        const hay = `${sch.name} ${sch.description} ${sch.city_name} ${sch.state_name} ${sch.board_affiliation}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  },

  async getSchoolDetailsBySlug(slug: string): Promise<{
    school: SchoolProfile;
    classes: SchoolClass[];
    facilities: SchoolFacility[];
    vacancies: SchoolStaffVacancy[];
    gallery: SchoolGalleryItem[];
  } | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data: school } = await supabase.from('schools').select('*').eq('slug', slug).maybeSingle();
      if (!school) return null;
      const [clsRes, facRes, vacRes, galRes] = await Promise.all([
        supabase.from('school_classes').select('*').eq('school_id', school.id),
        supabase.from('school_facilities').select('*').eq('school_id', school.id),
        supabase.from('school_staff_vacancies').select('*').eq('school_id', school.id).eq('status', 'OPEN'),
        supabase.from('school_gallery').select('*').eq('school_id', school.id).order('sort_order', { ascending: true }),
      ]);
      return {
        school: school as SchoolProfile,
        classes: (clsRes.data ?? []) as SchoolClass[],
        facilities: (facRes.data ?? []) as SchoolFacility[],
        vacancies: (vacRes.data ?? []) as SchoolStaffVacancy[],
        gallery: (galRes.data ?? []) as SchoolGalleryItem[],
      };
    }

    const state = readSchoolSandbox();
    const school = state.schools.find((s) => s.slug === slug);
    if (!school) return null;
    return {
      school,
      classes: state.classes.filter((c) => c.school_id === school.id),
      facilities: state.facilities.filter((f) => f.school_id === school.id),
      vacancies: state.vacancies.filter((v) => v.school_id === school.id && v.status === 'OPEN'),
      gallery: state.gallery.filter((g) => g.school_id === school.id),
    };
  },

  async getMySchoolWorkspace(user: UserWithRoles): Promise<{
    school: SchoolProfile | null;
    classes: SchoolClass[];
    facilities: SchoolFacility[];
    enquiries: AdmissionEnquiry[];
    vacancies: SchoolStaffVacancy[];
    gallery: SchoolGalleryItem[];
  }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data: school } = await supabase
        .from('schools')
        .select('*')
        .eq('admin_user_id', user.profile.id)
        .maybeSingle();
      if (!school) {
        return { school: null, classes: [], facilities: [], enquiries: [], vacancies: [], gallery: [] };
      }
      const [clsRes, facRes, enqRes, vacRes, galRes] = await Promise.all([
        supabase.from('school_classes').select('*').eq('school_id', school.id),
        supabase.from('school_facilities').select('*').eq('school_id', school.id),
        supabase.from('admission_enquiries').select('*').eq('school_id', school.id).order('created_at', { ascending: false }),
        supabase.from('school_staff_vacancies').select('*').eq('school_id', school.id).order('created_at', { ascending: false }),
        supabase.from('school_gallery').select('*').eq('school_id', school.id).order('sort_order', { ascending: true }),
      ]);
      return {
        school: school as SchoolProfile,
        classes: (clsRes.data ?? []) as SchoolClass[],
        facilities: (facRes.data ?? []) as SchoolFacility[],
        enquiries: (enqRes.data ?? []).map((e: Record<string, unknown>) => ({
          ...(e as unknown as AdmissionEnquiry),
          school_name: (school as SchoolProfile).name,
        })),
        vacancies: (vacRes.data ?? []) as SchoolStaffVacancy[],
        gallery: (galRes.data ?? []) as SchoolGalleryItem[],
      };
    }

    const state = readSchoolSandbox();
    const school = state.schools.find((s) => s.admin_user_id === user.profile.id) ?? null;
    if (!school) {
      return { school: null, classes: [], facilities: [], enquiries: [], vacancies: [], gallery: [] };
    }
    return {
      school,
      classes: state.classes.filter((c) => c.school_id === school.id),
      facilities: state.facilities.filter((f) => f.school_id === school.id),
      enquiries: state.enquiries.filter((e) => e.school_id === school.id),
      vacancies: state.vacancies.filter((v) => v.school_id === school.id),
      gallery: state.gallery.filter((g) => g.school_id === school.id),
    };
  },

  async upsertMySchool(
    user: UserWithRoles,
    payload: {
      institution_type: InstitutionType;
      name: string;
      board_affiliation: BoardAffiliation;
      affiliation_number?: string;
      medium_of_instruction: string[];
      established_year?: number | null;
      location_id: string | null;
      state_name: string;
      city_name: string;
      pincode: string | null;
      contact_email: string;
      contact_phone: string;
      website?: string;
      description: string;
      admissions_open: boolean;
    }
  ): Promise<SchoolProfile> {
    if (!user.roles.includes('school_admin') && !hasAnyAdminRole(user.roles)) {
      throw new Error('Unauthorized: School Administrator role is required.');
    }
    if (!payload.name.trim()) throw new Error('Institution name is required.');

    const supabase = getSupabaseClient();
    if (supabase) {
      const dbLocId = toDbUuid(payload.location_id);
      const { data: existing } = await supabase
        .from('schools')
        .select('*')
        .eq('admin_user_id', user.profile.id)
        .maybeSingle();
      if (existing) {
        const { data: updated, error } = await supabase
          .from('schools')
          .update({
            institution_type: payload.institution_type,
            name: payload.name.trim(),
            board_affiliation: payload.board_affiliation,
            affiliation_number: payload.affiliation_number || null,
            medium_of_instruction: payload.medium_of_instruction,
            established_year: payload.established_year ?? null,
            location_id: dbLocId,
            state_name: payload.state_name,
            city_name: payload.city_name,
            pincode: payload.pincode || null,
            contact_email: payload.contact_email,
            contact_phone: payload.contact_phone,
            website: payload.website || null,
            description: payload.description,
            admissions_open: payload.admissions_open,
          })
          .eq('id', existing.id)
          .select('*')
          .single();
        if (error) throw new Error(error.message);
        return updated as SchoolProfile;
      }

      const slug = `${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`;
      const { data: listing, error: lErr } = await supabase
        .from('listings')
        .insert({
          owner_id: user.profile.id,
          module_key: 'school',
          location_id: dbLocId,
          title: payload.name.trim(),
          slug,
          summary: `${payload.institution_type} (${payload.board_affiliation}) — ${payload.city_name}`,
          description: payload.description,
          status: 'PENDING_REVIEW',
        })
        .select('*')
        .single();
      if (lErr) throw new Error(lErr.message);

      const { data: created, error: sErr } = await supabase
        .from('schools')
        .insert({
          listing_id: (listing as { id: string }).id,
          admin_user_id: user.profile.id,
          institution_type: payload.institution_type,
          name: payload.name.trim(),
          slug,
          board_affiliation: payload.board_affiliation,
          affiliation_number: payload.affiliation_number || null,
          medium_of_instruction: payload.medium_of_instruction,
          established_year: payload.established_year ?? null,
          location_id: dbLocId,
          state_name: payload.state_name,
          city_name: payload.city_name,
          pincode: payload.pincode || null,
          contact_email: payload.contact_email,
          contact_phone: payload.contact_phone,
          website: payload.website || null,
          description: payload.description,
          admissions_open: payload.admissions_open,
          subscription_plan_code: 'FREE',
          status: 'ACTIVE',
        })
        .select('*')
        .single();
      if (sErr) throw new Error(sErr.message);
      return created as SchoolProfile;
    }

    const state = readSchoolSandbox();
    const existing = state.schools.find((s) => s.admin_user_id === user.profile.id);
    if (existing) {
      Object.assign(existing, payload);
      writeSchoolSandbox(state);
      return existing;
    }

    const slug = `${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`;
    const created: SchoolProfile = {
      id: makeId('sch'),
      listing_id: makeId('lst'),
      organisation_id: null,
      admin_user_id: user.profile.id,
      institution_type: payload.institution_type,
      name: payload.name.trim(),
      slug,
      board_affiliation: payload.board_affiliation,
      affiliation_number: payload.affiliation_number || null,
      medium_of_instruction: payload.medium_of_instruction,
      established_year: payload.established_year ?? null,
      location_id: payload.location_id,
      state_name: payload.state_name,
      city_name: payload.city_name,
      pincode: payload.pincode || null,
      contact_email: payload.contact_email,
      contact_phone: payload.contact_phone,
      website: payload.website || null,
      description: payload.description,
      admissions_open: payload.admissions_open,
      subscription_plan_code: 'FREE',
      status: 'ACTIVE',
      created_at: nowIso(),
    };
    state.schools.unshift(created);
    writeSchoolSandbox(state);
    return created;
  },

  async addSchoolClass(
    user: UserWithRoles,
    schoolId: string,
    payload: Omit<SchoolClass, 'id' | 'school_id'>
  ): Promise<SchoolClass> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('school_classes')
        .insert({ school_id: schoolId, ...payload })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as SchoolClass;
    }

    const state = readSchoolSandbox();
    const school = state.schools.find((s) => s.id === schoolId);
    if (!school) throw new Error('School not found.');
    assertSchoolAdminOwnership(user, school);
    const row: SchoolClass = { id: makeId('cls'), school_id: schoolId, ...payload };
    state.classes.push(row);
    writeSchoolSandbox(state);
    return row;
  },

  async addSchoolFacility(
    user: UserWithRoles,
    schoolId: string,
    facilityLabel: string,
    description?: string
  ): Promise<SchoolFacility> {
    const key = facilityLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('school_facilities')
        .insert({
          school_id: schoolId,
          facility_key: key,
          facility_label: facilityLabel.trim(),
          description: description?.trim() || null,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as SchoolFacility;
    }

    const state = readSchoolSandbox();
    const school = state.schools.find((s) => s.id === schoolId);
    if (!school) throw new Error('School not found.');
    assertSchoolAdminOwnership(user, school);
    const row: SchoolFacility = {
      id: makeId('fac'),
      school_id: schoolId,
      facility_key: key,
      facility_label: facilityLabel.trim(),
      description: description?.trim() || null,
    };
    state.facilities.push(row);
    writeSchoolSandbox(state);
    return row;
  },

  async addSchoolVacancy(
    user: UserWithRoles,
    schoolId: string,
    payload: {
      staff_category: 'TEACHING' | 'NON_TEACHING';
      title: string;
      subject_or_department: string;
      qualification_required: string;
      employment_type: EmploymentType;
      salary_range_label: string;
    }
  ): Promise<SchoolStaffVacancy> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('school_staff_vacancies')
        .insert({
          school_id: schoolId,
          staff_category: payload.staff_category,
          title: payload.title.trim(),
          subject_or_department: payload.subject_or_department.trim(),
          qualification_required: payload.qualification_required.trim(),
          employment_type: payload.employment_type,
          salary_range_label: payload.salary_range_label.trim() || null,
          status: 'OPEN',
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as SchoolStaffVacancy;
    }

    const state = readSchoolSandbox();
    const school = state.schools.find((s) => s.id === schoolId);
    if (!school) throw new Error('School not found.');
    assertSchoolAdminOwnership(user, school);
    const vac: SchoolStaffVacancy = {
      id: makeId('svac'),
      school_id: schoolId,
      staff_category: payload.staff_category,
      title: payload.title.trim(),
      subject_or_department: payload.subject_or_department.trim(),
      qualification_required: payload.qualification_required.trim(),
      employment_type: payload.employment_type,
      salary_range_label: payload.salary_range_label.trim() || null,
      status: 'OPEN',
      created_at: nowIso(),
    };
    state.vacancies.unshift(vac);
    writeSchoolSandbox(state);
    return vac;
  },

  async submitAdmissionEnquiry(
    user: UserWithRoles,
    payload: {
      schoolId: string;
      studentName: string;
      applyingForClass: string;
      academicYear: string;
      contactPhone: string;
      message: string;
    }
  ): Promise<AdmissionEnquiry> {
    if (!payload.studentName.trim() || !payload.applyingForClass.trim() || !payload.contactPhone.trim()) {
      throw new Error('Student name, class, and contact phone are required.');
    }
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data: sch } = await supabase
        .from('schools')
        .select('id, name, status')
        .eq('id', payload.schoolId)
        .single();
      if (!sch || sch.status !== 'ACTIVE') {
        throw new Error('Selected institution is not accepting enquiries.');
      }
      const { data: enq, error } = await supabase
        .from('admission_enquiries')
        .insert({
          school_id: sch.id,
          parent_or_student_id: user.profile.id,
          student_name: payload.studentName.trim(),
          applying_for_class: payload.applyingForClass.trim(),
          academic_year: payload.academicYear || '2027-28',
          contact_phone: payload.contactPhone.trim(),
          message: payload.message.trim(),
          status: 'NEW',
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return { ...(enq as AdmissionEnquiry), school_name: sch.name };
    }

    const state = readSchoolSandbox();
    const school = state.schools.find((s) => s.id === payload.schoolId);
    if (!school || school.status !== 'ACTIVE') {
      throw new Error('Selected institution is not accepting enquiries.');
    }

    const row: AdmissionEnquiry = {
      id: makeId('admenq'),
      school_id: school.id,
      school_name: school.name,
      parent_or_student_id: user.profile.id,
      student_name: payload.studentName.trim(),
      applying_for_class: payload.applyingForClass.trim(),
      academic_year: payload.academicYear || '2027-28',
      contact_phone: payload.contactPhone.trim(),
      message: payload.message.trim(),
      status: 'NEW',
      school_reply: null,
      created_at: nowIso(),
    };
    state.enquiries.unshift(row);
    writeSchoolSandbox(state);
    return row;
  },

  async getSchoolAdmissionEnquiries(user: UserWithRoles, schoolId: string): Promise<AdmissionEnquiry[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('admission_enquiries')
        .select('*, schools(name)')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((e: Record<string, unknown>) => ({
        ...(e as unknown as AdmissionEnquiry),
        school_name: ((e.schools as { name?: string } | null)?.name) ?? 'School',
      }));
    }

    const state = readSchoolSandbox();
    const school = state.schools.find((s) => s.id === schoolId);
    if (!school) throw new Error('School not found.');
    assertSchoolAdminOwnership(user, school);
    return state.enquiries.filter((e) => e.school_id === schoolId);
  },

  async updateAdmissionEnquiry(
    user: UserWithRoles,
    enquiryId: string,
    status: AdmissionEnquiryStatus,
    reply?: string
  ): Promise<AdmissionEnquiry> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const patch: Record<string, unknown> = { status };
      if (reply !== undefined) patch.school_reply = reply.trim();
      const { data, error } = await supabase
        .from('admission_enquiries')
        .update(patch)
        .eq('id', enquiryId)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return { ...(data as AdmissionEnquiry), school_name: 'School' };
    }

    const state = readSchoolSandbox();
    const enq = state.enquiries.find((e) => e.id === enquiryId);
    if (!enq) throw new Error('Admission enquiry not found.');
    const school = state.schools.find((s) => s.id === enq.school_id);
    if (!school) throw new Error('School not found.');
    assertSchoolAdminOwnership(user, school);
    enq.status = status;
    if (reply !== undefined) enq.school_reply = reply.trim();
    writeSchoolSandbox(state);
    return enq;
  },
};

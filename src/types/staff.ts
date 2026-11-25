export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'TEMPORARY' | 'CONTRACT';
export type WorkMode = 'ONSITE' | 'HYBRID' | 'REMOTE';
export type SalaryPeriod = 'MONTHLY' | 'ANNUAL' | 'HOURLY';
export type JobPostStatus = 'OPEN' | 'PAUSED' | 'CLOSED';

export type ApplicationStatus =
  | 'APPLIED'
  | 'VIEWED'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'OFFERED'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface CandidateProfile {
  id: string;
  user_id: string;
  full_name: string;
  headline: string;
  bio: string;
  highest_qualification: string;
  total_experience_years: number;
  skills: string[];
  preferred_employment_types: EmploymentType[];
  expected_salary_min: number | null;
  expected_salary_max: number | null;
  current_location_id: string | null;
  willing_to_relocate: boolean;
  is_public_searchable: boolean;
  cv_visibility: 'APPLIED_ONLY' | 'EMPLOYERS' | 'PRIVATE';
  updated_at: string;
}

export interface CandidateEducation {
  id: string;
  candidate_id: string;
  degree: string;
  institution: string;
  field_of_study: string | null;
  start_year: number | null;
  end_year: number | null;
  grade: string | null;
}

export interface CandidateExperience {
  id: string;
  candidate_id: string;
  job_title: string;
  company_name: string;
  employment_type: EmploymentType;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
}

export interface CandidateDocument {
  id: string;
  candidate_id: string;
  user_id: string;
  document_type: 'CV' | 'CERTIFICATE' | 'PORTFOLIO' | 'OTHER';
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size_bytes: number;
  is_primary_cv: boolean;
  created_at: string;
}

export interface JobPost {
  id: string;
  listing_id: string;
  employer_id: string;
  employer_name: string;
  organisation_id: string | null;
  title: string;
  slug: string;
  summary: string;
  description: string;
  location_id: string | null;
  listing_status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'EXPIRED';
  employment_type: EmploymentType;
  work_mode: WorkMode;
  min_experience_years: number;
  max_experience_years: number | null;
  qualification_required: string;
  skills_required: string[];
  salary_min: number | null;
  salary_max: number | null;
  salary_period: SalaryPeriod;
  salary_disclosed: boolean;
  openings_count: number;
  application_deadline: string | null;
  status: JobPostStatus;
  created_at: string;
}

export interface JobApplication {
  id: string;
  job_post_id: string;
  candidate_id: string;
  applicant_user_id: string;
  applicant_name: string;
  cv_document_id: string | null;
  cover_note: string | null;
  status: ApplicationStatus;
  employer_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationEvent {
  id: string;
  application_id: string;
  actor_id: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  note: string | null;
  created_at: string;
}

export interface RecruitmentEnquiry {
  id: string;
  job_post_id: string | null;
  sender_id: string;
  sender_name: string;
  employer_id: string;
  subject: string;
  message: string;
  status: 'NEW' | 'VIEWED' | 'CONTACTED' | 'RESOLVED' | 'CLOSED';
  employer_reply: string | null;
  created_at: string;
}

export interface JobSearchFilters {
  query?: string;
  employmentType?: EmploymentType | 'ALL';
  qualification?: string;
  skill?: string;
  maxExperience?: number;
  minSalary?: number;
  locationId?: string;
  pincode?: string;
  sort?: 'newest' | 'salary_desc' | 'exp_asc';
  page?: number;
  pageSize?: number;
  includeUnapproved?: boolean;
}

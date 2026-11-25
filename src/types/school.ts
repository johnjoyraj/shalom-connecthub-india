import type { EmploymentType } from './staff';

export type InstitutionType =
  | 'SCHOOL'
  | 'COLLEGE'
  | 'PRESCHOOL'
  | 'TUITION_CENTRE'
  | 'COACHING_INSTITUTE';

export type BoardAffiliation =
  | 'CBSE'
  | 'ICSE'
  | 'STATE_BOARD'
  | 'IB'
  | 'CAMBRIDGE'
  | 'NIOS'
  | 'UNIVERSITY'
  | 'AUTONOMOUS'
  | 'OTHER';

export type SchoolStatus = 'ACTIVE' | 'PENDING_REVIEW' | 'PAUSED' | 'SUSPENDED';

export type AdmissionEnquiryStatus =
  | 'NEW'
  | 'VIEWED'
  | 'CONTACTED'
  | 'INTERVIEW_SCHEDULED'
  | 'ADMITTED'
  | 'REJECTED'
  | 'CLOSED';

export interface SchoolProfile {
  id: string;
  listing_id: string;
  organisation_id: string | null;
  admin_user_id: string;
  institution_type: InstitutionType;
  name: string;
  slug: string;
  board_affiliation: BoardAffiliation;
  affiliation_number: string | null;
  medium_of_instruction: string[];
  established_year: number | null;
  location_id: string | null;
  state_name: string;
  city_name: string;
  pincode: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  description: string;
  admissions_open: boolean;
  subscription_plan_code: string;
  status: SchoolStatus;
  created_at: string;
}

export interface SchoolClass {
  id: string;
  school_id: string;
  class_name: string;
  stream_or_level: string | null;
  age_or_eligibility: string | null;
  annual_fee_approx: number | null;
  seats_available: number | null;
}

export interface SchoolFacility {
  id: string;
  school_id: string;
  facility_key: string;
  facility_label: string;
  description: string | null;
}

export interface AdmissionEnquiry {
  id: string;
  school_id: string;
  school_name: string;
  parent_or_student_id: string;
  student_name: string;
  applying_for_class: string;
  academic_year: string;
  contact_phone: string;
  message: string;
  status: AdmissionEnquiryStatus;
  school_reply: string | null;
  created_at: string;
}

export interface SchoolStaffVacancy {
  id: string;
  school_id: string;
  staff_category: 'TEACHING' | 'NON_TEACHING';
  title: string;
  subject_or_department: string;
  qualification_required: string;
  employment_type: EmploymentType;
  salary_range_label: string | null;
  status: 'OPEN' | 'PAUSED' | 'CLOSED';
  created_at: string;
}

export interface SchoolGalleryItem {
  id: string;
  school_id: string;
  storage_path: string;
  caption: string;
  sort_order: number;
}

export interface SchoolSearchFilters {
  query?: string;
  institutionType?: InstitutionType | 'ALL';
  board?: BoardAffiliation | 'ALL';
  className?: string;
  facility?: string;
  admissionsOpenOnly?: boolean;
  locationId?: string;
  pincode?: string;
}
